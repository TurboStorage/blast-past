# Blast Past - Game Evaluation & Improvement Plan

## 1. Current State Evaluation
The game is a functional, browser-based top-down shooter with core "Flash" elements.

### Strengths:
- **Clean Codebase:** Modular ES6 classes, no heavy external dependencies.
- **Responsive Controls:** Support for both Keyboard and Mouse (Follow) inputs.
- **Core Loop:** Functional XP/Level-up system, procedural enemies/obstacles, and wave-based progression.
- **Technical Stability:** Full-window scaling and robust collision detection.

### Weaknesses (The "Flash Game" Gap):
- **Visual Stagnation:** Static geometric shapes lack the "juice" of classic 2000s Flash games (gradients, glows, animations).
- **Audio Simplicity:** Basic oscillators provide sound, but lack punch or variety.
- **Gameplay Depth:** No boss encounters, limited enemy patterns, and static background.
- **UI/UX:** Very utilitarian HUD; lacks thematic flair or animations.

---

## 2. Comparison to Classics (e.g., Heli Attack, Raiden)
| Feature | Blast Past (Current) | Classic Flash Shooters |
| :--- | :--- | :--- |
| **Visuals** | Flat colors, basic shapes. | Sprites, particle trails, screen shake, glows. |
| **Feedback** | Basic color-coded explosions. | "Juice": Hit-flashes, debris, sound layers. |
| **Progression** | Choice of 3 stat buffs. | Weapons that look/feel different (Lasers, Missiles). |
| **Environment** | Simple scrolling grid. | Layered backgrounds (Parallax), destructible terrain. |

---

## 3. Visual Improvement Action List (Priority Order)

### Phase 1: "The Juice" (Immediate Impact)
- [ ] **Hit Flashes:** Make enemies/player flash white for 0.1s when taking damage.
- [ ] **Screen Shake:** Add a slight camera shake on large explosions or player hits.
- [ ] **Particle Trails:** Add smoke/engine trails to the helicopter and enemy projectiles.
- [ ] **Glow Effects:** Use `shadowBlur` in Canvas to give projectiles and engines a neon glow.

### Phase 2: Asset Quality
- [ ] **Sprite Integration:** Replace geometric shapes with actual 2D sprites (even simple vector-drawn PNGs).
- [ ] **Parallax Scrolling:** Add a second, slower background layer (e.g., stars or clouds) to give a sense of height.
- [ ] **Dynamic Propellers:** Blur the propeller based on speed rather than just rotating a solid bar.

### Phase 3: Gameplay Variety
- [ ] **Boss Waves:** Every 5 waves, spawn a larger "Boss" enemy with multiple hit points and patterns.
- [ ] **Power-up Variety:** Add distinct weapon types (e.g., a continuous Beam, seeking Missiles, or a temporary Shield).
- [ ] **Destructible Obstacles:** Allow players to shoot down the "Space Junk" for minor points.

---

## 4. Technical Strategy for Next Steps
1. **Renderer Upgrades:** Implement a `ParticleSystem` class to handle complex trails and debris more efficiently.
2. **State Management:** Formalize a `WaveManager` to handle boss spawns and increasing difficulty curves.
3. **Asset Loader:** Create a simple utility to load and cache images/audio files to move away from purely procedural drawing.
