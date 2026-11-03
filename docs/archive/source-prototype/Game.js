import Renderer from './Renderer.js';
import Input from './Input.js';
import Player from './Entities/Player.js';
import Enemy from './Entities/Enemy.js';
import Projectile from './Entities/Projectile.js';
import Particle from './Entities/Particle.js';
import UpgradeSystem from './Systems/UpgradeSystem.js';
import SoundSystem from './Systems/SoundSystem.js';

export default class Game {
    constructor(canvas) {
        console.log('Game: Constructor called');
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.renderer = new Renderer(canvas);
        this.input = new Input();
        this.upgradeSystem = new UpgradeSystem(this);
        
        try {
            this.sound = new SoundSystem();
            console.log('Game: SoundSystem initialized');
        } catch (err) {
            console.error('Game: Could not initialize SoundSystem, sound will be disabled:', err);
            // Fallback object to prevent crashes
            this.sound = { 
                playShoot: () => {}, 
                playExplosion: () => {}, 
                playPowerup: () => {}, 
                ctx: { state: 'suspended', resume: () => Promise.resolve() } 
            };
        }
        
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = []; 
        
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.bgScrollY = 0;

        // Game State
        this.score = 0;
        this.wave = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2; 

        this.loop = this.loop.bind(this);
    }

    start() {
        console.log('Game: Starting...');
        if (this.isRunning) {
            console.log('Game: Already running');
            return;
        }
        this.player = new Player(this);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // Reset Stats
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.enemySpawnInterval = 2;
        this.score = 0;
        this.wave = 1;

        // Initialize audio context on user interaction
        if (this.sound.ctx && this.sound.ctx.state === 'suspended') {
            this.sound.ctx.resume().catch(e => console.warn('Audio resume failed:', e));
        }

        requestAnimationFrame(this.loop);
        this.updateUI();
        console.log('Game: Loop started');
    }

    restart() {
        console.log('Game: Restarting...');
        this.isRunning = false; // Stop current loop
        this.bgScrollY = 0;
        this.player = null;
        // Wait a frame to ensure loop stops before starting new one
        setTimeout(() => this.start(), 10);
    }

    gameOver() {
        console.log('Game: Game Over');
        this.isRunning = false;
        document.getElementById('gameover-screen').classList.add('active');
        document.getElementById('final-score').textContent = `FINAL SCORE: ${this.score}`;
    }

    triggerLevelUp() {
        console.log('Game: Level Up triggered');
        this.isPaused = true;
        this.sound.playPowerup();
        const upgrades = this.upgradeSystem.getRandomUpgrades(3);
        const container = document.getElementById('upgrade-container');
        container.innerHTML = ''; 

        upgrades.forEach(u => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upgrade-icon">${u.icon}</div>
                <div class="upgrade-title">${u.name}</div>
                <div class="upgrade-desc">${u.description}</div>
            `;
            card.onclick = () => {
                u.apply(this.player);
                this.resumeFromLevelUp();
            };
            container.appendChild(card);
        });

        document.getElementById('levelup-screen').classList.add('active');
    }

    resumeFromLevelUp() {
        console.log('Game: Resuming from Level Up');
        document.getElementById('levelup-screen').classList.remove('active');
        this.isPaused = false;
        this.lastTime = performance.now(); 
        requestAnimationFrame(this.loop);
    }

    spawnEnemy(dt) {
        this.enemySpawnTimer += dt;
        if (this.enemySpawnTimer > this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            const x = Math.random() * (this.width - 40);
            this.enemies.push(new Enemy(this, x, -50));
            
            if (this.enemySpawnInterval > 0.5) this.enemySpawnInterval -= 0.01;
        }
    }

    createExplosion(x, y, color) {
        this.sound.playExplosion();
        for (let i = 0; i < 12; i++) {
            this.particles.push(new Particle(this, x, y, color));
        }
    }

    checkCollisions() {
        this.projectiles.forEach(p => {
            if (p.markedForDeletion) return;

            if (p.isEnemyProjectile) {
                if (this.player && this.checkCollision(p, this.player)) {
                    p.markedForDeletion = true;
                    this.player.takeDamage(10);
                    this.createExplosion(p.x, p.y, '#f1c40f');
                    this.updateUI();
                    if (this.player.hp <= 0) {
                        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#f1c40f');
                        this.gameOver();
                    }
                }
            } else {
                this.enemies.forEach(e => {
                    if (!e.markedForDeletion && !p.markedForDeletion) {
                        if (this.checkCollision(p, e)) {
                            p.markedForDeletion = true;
                            e.hp--;
                            if (e.hp <= 0) {
                                e.markedForDeletion = true;
                                this.score += e.scoreValue;
                                this.gainXp(25); 
                                this.createExplosion(e.x + e.width/2, e.y + e.height/2, e.color);
                                this.updateUI();
                            }
                        }
                    }
                });
            }
        });

        if (this.player) {
            this.enemies.forEach(e => {
                if (!e.markedForDeletion && this.checkCollision(this.player, e)) {
                    e.markedForDeletion = true;
                    this.player.takeDamage(20);
                    this.createExplosion(e.x + e.width/2, e.y + e.height/2, '#e74c3c');
                    this.updateUI();
                    if (this.player.hp <= 0) {
                        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#f1c40f');
                        this.gameOver();
                    }
                }
            });
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.3);
            this.triggerLevelUp();
        }
        this.updateUI();
    }

    checkCollision(entity1, entity2) {
        // Adjust coordinates if they are center-based (Projectiles)
        const getBounds = (ent) => {
            if (ent.radius) { // It's a projectile (centered)
                return {
                    left: ent.x - ent.radius,
                    right: ent.x + ent.radius,
                    top: ent.y - ent.radius,
                    bottom: ent.y + ent.radius
                };
            } else { // It's a Player or Enemy (top-left based)
                return {
                    left: ent.x,
                    right: ent.x + ent.width,
                    top: ent.y,
                    bottom: ent.y + ent.height
                };
            }
        };

        const b1 = getBounds(entity1);
        const b2 = getBounds(entity2);

        return (
            b1.left < b2.right &&
            b1.right > b2.left &&
            b1.top < b2.bottom &&
            b1.bottom > b2.top
        );
    }

    updateUI() {
        const scoreEl = document.getElementById('score-display');
        const waveEl = document.getElementById('wave-display');
        const hpBar = document.getElementById('hp-bar');
        const xpBar = document.getElementById('xp-bar');

        if (scoreEl) scoreEl.textContent = `SCORE: ${this.score.toString().padStart(6, '0')}`;
        if (waveEl) waveEl.textContent = `WAVE: ${this.wave}`;
        
        if (this.player) {
            const hpPercent = (this.player.hp / this.player.maxHp) * 100;
            if (hpBar) hpBar.style.width = `${Math.max(0, hpPercent)}%`;
            
            const xpPercent = (this.xp / this.xpToNextLevel) * 100;
            if (xpBar) xpBar.style.width = `${Math.min(100, xpPercent)}%`;
        }
    }

    update(dt) {
        if (this.isPaused || !this.isRunning) return;
        if (dt > 0.1) dt = 0.1;

        this.bgScrollY = (this.bgScrollY + 120 * dt) % 40; 

        if (!this.player) return;

        this.player.update(dt);
        
        this.projectiles.forEach(p => p.update(dt));
        this.enemies.forEach(e => e.update(dt));
        this.particles.forEach(p => p.update(dt));
        
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        this.spawnEnemy(dt);
        this.checkCollisions();
    }

    draw() {
        this.renderer.clear();
        this.drawBackground();

        this.projectiles.forEach(p => p.draw(this.renderer));
        this.enemies.forEach(e => e.draw(this.renderer));
        this.particles.forEach(p => p.draw(this.renderer));

        if (this.player) {
            this.player.draw(this.renderer);
        }
    }

    drawBackground() {
        const ctx = this.renderer.ctx;
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        for (let y = -40; y <= this.height; y += 40) {
            const yPos = y + this.bgScrollY;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(this.width, yPos);
            ctx.stroke();
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        if (this.isPaused) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop);
    }
}
