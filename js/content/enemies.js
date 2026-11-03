"use strict";
/* Enemy archetype table (B.EnemySpecs): radius, hull, speed, rewards, director cost, tint. */
(() => {
  const B = window.BP;
  B.EnemySpecs = {
    scout: {
      r: 15,
      hp: 28,
      speed: 88,
      score: 100,
      xp: 9,
      cost: 1,
      color: "#ff7567",
    },
    gunship: {
      r: 23,
      hp: 95,
      speed: 43,
      score: 250,
      xp: 22,
      cost: 3,
      color: "#e99a62",
    },
    interceptor: {
      r: 14,
      hp: 42,
      speed: 154,
      score: 160,
      xp: 14,
      cost: 2,
      color: "#ff667e",
    },
    kamikaze: {
      r: 13,
      hp: 25,
      speed: 176,
      score: 135,
      xp: 12,
      cost: 2,
      color: "#ffbf63",
    },
    swarm: {
      r: 9,
      hp: 12,
      speed: 108,
      score: 55,
      xp: 5,
      cost: 0.55,
      color: "#f18b65",
    },
    heavy: {
      r: 31,
      hp: 255,
      speed: 34,
      score: 560,
      xp: 48,
      cost: 7,
      color: "#c87a5d",
    },
    missile: {
      r: 22,
      hp: 135,
      speed: 52,
      score: 380,
      xp: 30,
      cost: 4,
      color: "#e87d71",
    },
    artillery: {
      r: 24,
      hp: 145,
      speed: 35,
      score: 410,
      xp: 34,
      cost: 5,
      color: "#c49061",
    },
  };
})();
