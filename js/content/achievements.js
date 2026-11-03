"use strict";
/* Achievement (commendation) catalog and unlock checks (B.Achievements). */
(() => {
  const B = window.BP;
  const { AUX_WEAPON_IDS } = B.Upgrades;
  const BANNER = { y: 125, color: "#ebc78c", life: 2.5 };
  const announce = (g, a) =>
    g.effect("text", g.w / 2, BANNER.y, {
      text: "COMMENDATION // " + a.name.toUpperCase(),
      color: BANNER.color,
      life: BANNER.life,
      maxLife: BANNER.life,
    });
  B.Achievements = {
    catalog: [
      {
        id: "firstBlood",
        name: "First Contact",
        description: "Destroy your first hostile.",
        test: (g) => g.kills >= 1,
      },
      {
        id: "ace",
        name: "Ace Pilot",
        description: "Destroy 100 hostiles in one run.",
        test: (g) => g.kills >= 100,
      },
      {
        id: "chain",
        name: "Chain Reaction",
        description: "Reach a 20-kill combo.",
        test: (g) => g.maxCombo >= 20,
      },
      {
        id: "platform",
        name: "Weapons Platform",
        description: "Equip all four auxiliary weapon systems.",
        test: (g) => AUX_WEAPON_IDS.every((k) => g.player.stats[k] > 0),
      },
      {
        id: "boss",
        name: "Giant Killer",
        description: "Destroy a sector boss.",
        test: (g) => g.bossKills >= 1,
      },
      {
        id: "veteran",
        name: "Beyond the Coast",
        description: "Destroy two bosses in one run.",
        test: (g) => g.bossKills >= 2,
      },
    ],
    check(g) {
      let changed = false;
      g.saved.achievements ||= [];
      for (const a of this.catalog)
        if (!g.saved.achievements.includes(a.id) && a.test(g)) {
          g.saved.achievements.push(a.id);
          announce(g, a);
          changed = true;
        }
      if (changed) g.save();
    },
  };
})();
