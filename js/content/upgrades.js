"use strict";
/* Upgrade catalog, fallback offers, weighted offer rolls and apply (B.Upgrades). */
(() => {
  const B = window.BP;
  const AUX_WEAPON_IDS = ["rockets", "missiles", "arc", "drones"];
  const OFFER_SIZE = 3;
  const EARLY_WEAPON_LEVEL = 3;
  const FALLBACK_MAX = 9999;
  const RARITY_WEIGHTS = { COMMON: 8, UNCOMMON: 5, RARE: 2.7, EPIC: 1 };
  const always = () => true;
  const hasOrdnance = (p) => p.stats.rockets + p.stats.missiles > 0;
  const upgrade = (spec) => Object.assign({ requires: always }, spec);
  const catalog = [
    upgrade({
      id: "rapid",
      name: "Rapid Fire",
      type: "WEAPON",
      rarity: "COMMON",
      icon: "≋",
      max: 5,
      description: "Minigun fires 20% faster. More lead, less downtime.",
      apply: (p) => (p.stats.fireRate *= 1.2),
    }),
    upgrade({
      id: "link",
      name: "Weapon Link",
      type: "WEAPON",
      rarity: "RARE",
      icon: "⋔",
      max: 3,
      description:
        "Add a projectile stream. Every stream inherits ammunition effects.",
      apply: (p) => p.stats.streams++,
    }),
    upgrade({
      id: "caliber",
      name: "Heavy Caliber",
      type: "WEAPON",
      rarity: "COMMON",
      icon: "▰",
      max: 5,
      description: "All direct minigun hits deal 25% more damage.",
      apply: (p) => (p.stats.damage *= 1.25),
    }),
    upgrade({
      id: "pierce",
      name: "Piercing Ammunition",
      type: "WEAPON",
      rarity: "UNCOMMON",
      icon: "↟",
      max: 3,
      description:
        "Rounds penetrate one more enemy. Explosive hits still detonate.",
      apply: (p) => p.stats.pierce++,
    }),
    upgrade({
      id: "explosive",
      name: "High Explosive",
      type: "WEAPON",
      rarity: "RARE",
      icon: "✷",
      max: 3,
      description:
        "Add 20% chance for minigun hits to explode, damaging nearby targets.",
      apply: (p) => (p.stats.explosive += 0.2),
    }),
    upgrade({
      id: "crit",
      name: "Critical Systems",
      type: "SYSTEM",
      rarity: "COMMON",
      icon: "⌖",
      max: 4,
      description: "Add 12% chance to deal double minigun damage.",
      apply: (p) => (p.stats.crit += 0.12),
    }),
    upgrade({
      id: "rockets",
      name: "Rocket Pods",
      type: "WEAPON",
      rarity: "UNCOMMON",
      icon: "⇈",
      max: 3,
      description:
        "Mount automatic explosive rocket pods. Each rank adds a rocket per salvo.",
      apply: (p) => p.stats.rockets++,
    }),
    upgrade({
      id: "missiles",
      name: "Hunter Missiles",
      type: "WEAPON",
      rarity: "UNCOMMON",
      icon: "↗",
      max: 3,
      description:
        "Launch seeking missiles at priority threats. Each rank adds a missile.",
      apply: (p) => p.stats.missiles++,
    }),
    upgrade({
      id: "arc",
      name: "Arc Cannon",
      type: "WEAPON",
      rarity: "RARE",
      icon: "ϟ",
      max: 3,
      description:
        "Pulse lightning into nearby enemies. Each rank adds damage and a chain.",
      apply: (p) => p.stats.arc++,
    }),
    upgrade({
      id: "drones",
      name: "Drone Commander",
      type: "WEAPON",
      rarity: "UNCOMMON",
      icon: "⟐",
      max: 3,
      description:
        "Deploy an orbiting escort drone with its own targeting and cannon.",
      apply: (p) => p.stats.drones++,
    }),
    upgrade({
      id: "cluster",
      name: "Cluster Warheads",
      type: "SPECIAL",
      rarity: "EPIC",
      icon: "✣",
      max: 2,
      description:
        "Rocket and missile impacts release 4 additional shrapnel rounds per rank.",
      apply: (p) => p.stats.cluster++,
      requires: hasOrdnance,
    }),
    upgrade({
      id: "homing",
      name: "Guidance Uplink",
      type: "SYSTEM",
      rarity: "RARE",
      icon: "◎",
      max: 1,
      description: "Rocket salvos now seek targets; missiles turn faster.",
      apply: (p) => (p.stats.homing = 1),
      requires: hasOrdnance,
    }),
    upgrade({
      id: "droneLink",
      name: "Neural Squadron",
      type: "SPECIAL",
      rarity: "EPIC",
      icon: "⋈",
      max: 1,
      description:
        "Drones inherit multishot, piercing, critical and explosive ammunition.",
      apply: (p) => (p.stats.droneLink = 1),
      requires: (p) => p.stats.drones > 0,
    }),
    upgrade({
      id: "critArc",
      name: "Storm Trigger",
      type: "SPECIAL",
      rarity: "EPIC",
      icon: "↯",
      max: 1,
      description:
        "Critical hits arc to 3 nearby enemies. Chains cannot trigger themselves.",
      apply: (p) => (p.stats.critArc = 1),
      requires: (p) => p.stats.crit > 0,
    }),
    upgrade({
      id: "blast",
      name: "Blast Chamber",
      type: "WEAPON",
      rarity: "UNCOMMON",
      icon: "◉",
      max: 3,
      description: "Increase rocket and missile explosion radius by 25%.",
      apply: (p) => (p.stats.blast += 0.25),
      requires: (p) =>
        p.stats.rockets + p.stats.missiles + p.stats.explosive > 0,
    }),
    upgrade({
      id: "reload",
      name: "Fast Ordnance",
      type: "SYSTEM",
      rarity: "UNCOMMON",
      icon: "⟳",
      max: 3,
      description: "Automatic rocket and missile systems reload 18% faster.",
      apply: (p) => (p.stats.reload = (p.stats.reload || 1) * 0.82),
      requires: hasOrdnance,
    }),
    upgrade({
      id: "capacitor",
      name: "Arc Capacitor",
      type: "SYSTEM",
      rarity: "RARE",
      icon: "⌁",
      max: 2,
      description:
        "Arc Cannon cycles 25% faster and reaches 50 pixels farther.",
      apply: (p) => {
        p.stats.arcRate = (p.stats.arcRate || 1) * 0.75;
        p.stats.arcRange = (p.stats.arcRange || 0) + 50;
      },
      requires: (p) => p.stats.arc > 0,
    }),
    upgrade({
      id: "turbo",
      name: "Turbo Engines",
      type: "AIRFRAME",
      rarity: "COMMON",
      icon: "»",
      max: 3,
      description:
        "Increase cruising speed by 15%. Acceleration remains responsive.",
      apply: (p) => (p.stats.speed *= 1.15),
    }),
    upgrade({
      id: "armor",
      name: "Armor Plating",
      type: "AIRFRAME",
      rarity: "COMMON",
      icon: "▱",
      max: 4,
      description: "Add 25 maximum hull and repair 25 hull immediately.",
      apply: (p) => {
        p.maxHp += 25;
        p.hp = Math.min(p.maxHp, p.hp + 25);
      },
    }),
    upgrade({
      id: "repair",
      name: "Repair Systems",
      type: "AIRFRAME",
      rarity: "COMMON",
      icon: "✚",
      max: 3,
      description: "Repair 8 hull at each wave transition.",
      apply: (p) => (p.stats.regen += 8),
    }),
    upgrade({
      id: "magnet",
      name: "XP Magnet",
      type: "SYSTEM",
      rarity: "COMMON",
      icon: "⊕",
      max: 3,
      description: "Increase salvage attraction radius by 70 pixels.",
      apply: (p) => (p.stats.magnet += 70),
    }),
    upgrade({
      id: "afterburner",
      name: "Afterburner",
      type: "AIRFRAME",
      rarity: "UNCOMMON",
      icon: "≫",
      max: 2,
      description:
        "Boost recharges 30% faster. Boost grants brief damage protection.",
      apply: (p) => (p.stats.boostRecharge *= 1.3),
    }),
    upgrade({
      id: "killChain",
      name: "Kill Chain",
      type: "SYSTEM",
      rarity: "RARE",
      icon: "∞",
      max: 1,
      description: "Active kill combo accelerates the minigun up to 50%.",
      apply: (p) => (p.stats.killChain = 1),
    }),
    upgrade({
      id: "glass",
      name: "Glass Cannon",
      type: "SPECIAL",
      rarity: "EPIC",
      icon: "◇",
      max: 1,
      description:
        "Minigun damage +80%. Maximum hull -35%; current hull is capped.",
      apply: (p) => {
        p.stats.damage *= 1.8;
        p.maxHp = Math.max(30, Math.round(p.maxHp * 0.65));
        p.hp = Math.min(p.hp, p.maxHp);
      },
      requires: (p) => !p.ranks.gunship,
    }),
    upgrade({
      id: "gunship",
      name: "Gunship Conversion",
      type: "SPECIAL",
      rarity: "EPIC",
      icon: "▣",
      max: 1,
      description:
        "Add 60 maximum hull and 2 gun streams. Cruising speed -20%. Repairs 40 hull.",
      apply: (p) => {
        p.maxHp += 60;
        p.hp = Math.min(p.maxHp, p.hp + 40);
        p.stats.streams += 2;
        p.stats.speed *= 0.8;
      },
      requires: (p) => !p.ranks.glass,
    }),
    upgrade({
      id: "reactor",
      name: "Experimental Reactor",
      type: "SPECIAL",
      rarity: "EPIC",
      icon: "☢",
      max: 1,
      description:
        "Auxiliary damage +50% and minigun fire rate +25%, but incoming damage +25%.",
      apply: (p) => {
        p.stats.reactor = 1;
        p.stats.fireRate *= 1.25;
      },
    }),
    upgrade({
      id: "slow",
      name: "Cryo Ammunition",
      type: "WEAPON",
      rarity: "UNCOMMON",
      icon: "❖",
      max: 1,
      description: "Minigun hits slow enemy movement for 1.3 seconds.",
      apply: (p) => (p.stats.slow = 1),
    }),
    upgrade({
      id: "leech",
      name: "Salvage Repairs",
      type: "SYSTEM",
      rarity: "RARE",
      icon: "⊞",
      max: 1,
      description: "Every 15 kills restores 3 hull. Keep the pressure on.",
      apply: (p) => (p.stats.leech = 1),
    }),
    upgrade({
      id: "salvage",
      name: "Combat Analysis",
      type: "SYSTEM",
      rarity: "COMMON",
      icon: "▥",
      max: 3,
      description: "Collect 15% more XP per rank from every salvage pickup.",
      apply: (p) => (p.stats.salvage += 0.15),
    }),
    upgrade({
      id: "shieldStart",
      name: "Emergency Screen",
      type: "AIRFRAME",
      rarity: "RARE",
      icon: "⬡",
      max: 2,
      description:
        "Gain 4 seconds of shielding now and 2 seconds at each wave transition per rank.",
      apply: (p) => {
        p.shield = Math.max(p.shield, 4);
        p.stats.waveShield = (p.stats.waveShield || 0) + 2;
      },
    }),
    upgrade({
      id: "overdrive",
      name: "Redline Protocol",
      type: "SPECIAL",
      rarity: "RARE",
      icon: "⤊",
      max: 1,
      description: "While below 40% hull, all weapon damage increases by 40%.",
      apply: (p) => (p.stats.redline = 1),
    }),
    upgrade({
      id: "fieldRepair",
      name: "Field Repair",
      type: "AIRFRAME",
      rarity: "COMMON",
      icon: "+",
      max: 999,
      description:
        "Restore 35 hull immediately. Always available as an emergency fallback.",
      apply: (p) => (p.hp = Math.min(p.maxHp, p.hp + 35)),
    }),
  ];
  const fallbacks = [
    upgrade({
      id: "reserveShield",
      name: "Reserve Shield",
      type: "SYSTEM",
      rarity: "COMMON",
      icon: "⬡",
      max: FALLBACK_MAX,
      description:
        "Activate an 8-second shield. Repeatable once the research tree is exhausted.",
      apply: (p) => (p.shield = Math.max(p.shield, 8)),
    }),
    upgrade({
      id: "reserveRepair",
      name: "Depot Overhaul",
      type: "AIRFRAME",
      rarity: "COMMON",
      icon: "+",
      max: FALLBACK_MAX,
      description: "Fully repair the airframe and add 5 maximum hull.",
      apply: (p) => {
        p.maxHp += 5;
        p.hp = p.maxHp;
      },
    }),
    upgrade({
      id: "reserveBoost",
      name: "Combat Reserve",
      type: "SYSTEM",
      rarity: "COMMON",
      icon: "≫",
      max: FALLBACK_MAX,
      description: "Recharge boost instantly and gain 20% XP attraction range.",
      apply: (p) => {
        p.boostCd = 0;
        p.stats.magnet *= 1.2;
      },
    }),
  ];
  const find = (id) =>
    catalog.find((u) => u.id === id) || fallbacks.find((u) => u.id === id);
  const rank = (p, id) => p.ranks[id] || 0;
  const isAuxWeapon = (u) => AUX_WEAPON_IDS.includes(u.id);
  const eligiblePool = (p) =>
    catalog.filter(
      (u) =>
        rank(p, u.id) < u.max &&
        u.requires(p) &&
        !(u.id === "fieldRepair" && p.hp >= p.maxHp),
    );
  // An early run always offers access to a distinct auxiliary weapon.
  const needsStarterWeapon = (g) =>
    g.level <= EARLY_WEAPON_LEVEL &&
    !AUX_WEAPON_IDS.some((k) => g.player.stats[k]);
  // Rarity-weighted draw; consumes exactly one rng.next() per call.
  function weightedIndex(rng, pool) {
    const total = pool.reduce((sum, u) => sum + RARITY_WEIGHTS[u.rarity], 0);
    let roll = rng.next() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= RARITY_WEIGHTS[pool[i].rarity];
      if (roll <= 0) return i;
    }
    return pool.length - 1;
  }
  function offer(g) {
    let pool = eligiblePool(g.player);
    const chosen = [];
    if (needsStarterWeapon(g)) {
      const weapon = g.rng.pick(pool.filter(isAuxWeapon));
      if (weapon) chosen.push(weapon);
    }
    pool = pool.filter((u) => !chosen.includes(u));
    while (chosen.length < OFFER_SIZE && pool.length)
      chosen.push(pool.splice(weightedIndex(g.rng, pool), 1)[0]);
    for (const fallback of fallbacks) {
      if (chosen.length >= OFFER_SIZE) break;
      chosen.push(fallback);
    }
    return chosen;
  }
  function apply(g, id) {
    const u = find(id),
      p = g.player;
    if (!u || !u.requires(p) || rank(p, id) >= u.max) return false;
    u.apply(p);
    p.ranks[id] = rank(p, id) + 1;
    g.saved.discoveries = Array.from(
      new Set([...(g.saved.discoveries || []), id]),
    );
    B.Achievements?.check(g);
    g.save();
    return true;
  }
  B.Upgrades = { catalog, fallbacks, AUX_WEAPON_IDS, find, offer, apply };
})();
