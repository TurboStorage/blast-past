import Game from './Game.js';

console.log('Blast Past: Initializing...');

window.addEventListener('DOMContentLoaded', () => {
    console.log('Blast Past: DOM Content Loaded');
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Blast Past: Canvas element not found!');
        return;
    }
    
    try {
        const game = new Game(canvas);
        console.log('Blast Past: Game instance created');
        
        // UI Buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            console.log('Blast Past: Start button clicked');
            document.getElementById('start-screen').classList.remove('active');
            game.start();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            console.log('Blast Past: Restart button clicked');
            document.getElementById('gameover-screen').classList.remove('active');
            game.restart();
        });
    } catch (err) {
        console.error('Blast Past: Error during initialization:', err);
    }
});
