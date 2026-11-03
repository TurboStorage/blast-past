"use strict";
/* Tuning constants shared across systems. Changing a value changes gameplay. */
(() => {
  const B = window.BP;
  B.Config = Object.freeze({
    FIXED_DT: 1 / 60,
    // Entity caps keep late-game frames bounded.
    MAX_PARTICLES: 650,
    MAX_EFFECTS: 100,
    MAX_PROJECTILES: 700,
    MAX_ENEMIES: 65,
    MAX_PICKUPS: 160,
    MAX_WARNINGS: 18,
    // Playfield margins for the player's hitbox centre.
    PLAYER_MARGIN_X: 24,
    PLAYER_MARGIN_TOP: 80,
    PLAYER_MARGIN_BOTTOM: 45,
    // Hull fraction below which the airframe smokes and the screen edge pulses.
    LOW_HULL: 0.3,
    // Redline upgrade: bonus damage below this hull fraction.
    REDLINE_HULL: 0.4,
    REDLINE_BONUS: 1.4,
  });
})();
