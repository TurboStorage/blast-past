export default class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.availableUpgrades = [
            {
                id: 'fire_rate',
                name: 'Rapid Fire',
                description: 'Increases shooting speed by 20%.',
                icon: '⚡',
                apply: (player) => {
                    player.fireRate *= 0.8;
                }
            },
            {
                id: 'speed',
                name: 'Turbo Engines',
                description: 'Increases movement speed by 15%.',
                icon: '🚀',
                apply: (player) => {
                    player.speed *= 1.15;
                }
            },
            {
                id: 'health',
                name: 'Hull Reinforcement',
                description: 'Restores 30 HP and increases Max HP by 20.',
                icon: '🛡️',
                apply: (player) => {
                    player.maxHp += 20;
                    player.hp = Math.min(player.hp + 30, player.maxHp);
                }
            },
            {
                id: 'multishot',
                name: 'Side Cannons',
                description: 'Adds diagonal shots (WIP).', // Placeholder for now
                icon: '🔱',
                apply: (player) => {
                    player.weaponLevel = (player.weaponLevel || 1) + 1;
                }
            },
            {
                id: 'damage',
                name: 'High Caliber',
                description: 'Increases projectile size and damage.',
                icon: '💥',
                apply: (player) => {
                    // Logic to be added to Projectile/Player
                    player.damageMultiplier = (player.damageMultiplier || 1) + 0.2;
                }
            }
        ];
    }

    getRandomUpgrades(count = 3) {
        const shuffled = [...this.availableUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}
