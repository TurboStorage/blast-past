export default class Projectile {
    constructor(game, x, y, angle, speed, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.color = color;
        this.radius = 4;
        this.markedForDeletion = false;
        
        // Calculate velocity components
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check if out of bounds
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(renderer) {
        renderer.drawCircle(this.x, this.y, this.radius, this.color);
    }
}
