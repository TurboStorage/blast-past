export default class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 100;
        this.speedY = (Math.random() - 0.5) * 100;
        this.life = 1.0; // Seconds
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;
        this.life -= dt;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        ctx.globalAlpha = this.life;
        renderer.drawCircle(this.x, this.y, this.radius, this.color);
        ctx.globalAlpha = 1.0;
    }
}
