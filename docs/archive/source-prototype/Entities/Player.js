import Projectile from './Projectile.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 60;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - 100;
        this.speed = 300; // pixels per second
        this.color = '#f1c40f'; // Yellow
        this.propellerAngle = 0;
        
        // Stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.fireRate = 0.2; // Seconds between shots
        this.fireTimer = 0;
        
        // Upgrades
        this.weaponLevel = 1;
        this.damageMultiplier = 1;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    update(dt) {
        const input = this.game.input;

        // Horizontal Movement
        if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.x -= this.speed * dt;
        }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.x += this.speed * dt;
        }

        // Vertical Movement
        if (input.isDown('ArrowUp') || input.isDown('KeyW')) {
            this.y -= this.speed * dt;
        }
        if (input.isDown('ArrowDown') || input.isDown('KeyS')) {
            this.y += this.speed * dt;
        }

        // Bounds Checking
        this.x = Math.max(0, Math.min(this.game.width - this.width, this.x));
        this.y = Math.max(0, Math.min(this.game.height - this.height, this.y));

        // Propeller Animation
        this.propellerAngle += 15 * dt;

        // Shooting
        this.fireTimer += dt;
        if (input.isDown('Space') && this.fireTimer > this.fireRate) {
            this.shoot();
            this.fireTimer = 0;
        }
    }

    shoot() {
        const projectileX = this.x + this.width / 2;
        const projectileY = this.y;
        const speed = 600;
        
        // Play Sound
        this.game.sound.playShoot();

        // Base shot (Straight up)
        this.spawnProjectile(projectileX, projectileY, -Math.PI / 2, speed);

        // Weapon Level 2: Diagonal shots
        if (this.weaponLevel >= 2) {
             this.spawnProjectile(projectileX, projectileY, -Math.PI / 2 - 0.2, speed);
             this.spawnProjectile(projectileX, projectileY, -Math.PI / 2 + 0.2, speed);
        }
        
        // Weapon Level 3: More spread
         if (this.weaponLevel >= 3) {
             this.spawnProjectile(projectileX, projectileY, -Math.PI / 2 - 0.4, speed);
             this.spawnProjectile(projectileX, projectileY, -Math.PI / 2 + 0.4, speed);
        }
    }

    spawnProjectile(x, y, angle, speed) {
        const p = new Projectile(this.game, x, y, angle, speed, '#e74c3c');
        // Apply damage multiplier logic if Projectile supports it later
        // p.damage *= this.damageMultiplier; 
        this.game.projectiles.push(p);
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Body
        ctx.fillStyle = this.color;
        // Simple shape: A rectangle body with a tail
        ctx.fillRect(-15, -20, 30, 40); 
        
        // Tail
        ctx.fillStyle = '#d35400';
        ctx.fillRect(-5, 20, 10, 25);

        // Cockpit window
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-10, -15, 20, 15);

        // Propeller Blades (spinning)
        ctx.save();
        ctx.rotate(this.propellerAngle);
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(-40, -4, 80, 8);
        ctx.fillRect(-4, -40, 8, 80);
        ctx.restore();

        ctx.restore();
    }
}
