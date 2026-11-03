import Projectile from './Projectile.js';

export default class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speedY = 100; // Falling speed
        this.speedX = 0;
        this.color = '#e74c3c';
        this.markedForDeletion = false;
        this.hp = 1;
        this.scoreValue = 10;
        
        this.canShoot = Math.random() > 0.5; // 50% chance to be a shooter
        this.shootTimer = 0;
        this.shootInterval = 2 + Math.random() * 2; // Shoot every 2-4 seconds
    }

    update(dt) {
        this.y += this.speedY * dt;
        this.x += this.speedX * dt;

        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }

        if (this.canShoot) {
            this.shootTimer += dt;
            if (this.shootTimer > this.shootInterval) {
                this.shootTimer = 0;
                this.shoot();
            }
        }
    }

    shoot() {
        const pX = this.x + this.width / 2;
        const pY = this.y + this.height;
        // Shoot downwards (+90 degrees or PI/2)
        const p = new Projectile(this.game, pX, pY, Math.PI / 2, 300, '#f39c12');
        p.isEnemyProjectile = true; // Tag it
        this.game.projectiles.push(p);
    }

    draw(renderer) {
        // Simple enemy shape (diamond)
        const ctx = renderer.ctx;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Draw gun if shooter
        if (this.canShoot) {
             ctx.fillStyle = '#f39c12';
             ctx.fillRect(this.x + this.width/2 - 2, this.y + this.height - 5, 4, 10);
        }
    }
}
