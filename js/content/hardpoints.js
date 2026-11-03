"use strict";
/*
 * Weapon stations shared by the simulation (projectile origins) and the art
 * (pods, muzzle flash). Airframe-local coords: nose -y, starboard +x.
 * Also maps enemy types to the airframes that draw them.
 */
(() => {
  const B = window.BP;
  B.Hardpoints = {
    player: {
      gun: [0, -26],
      muzzle: [0, -43],
      rocketPods: [
        [-15.5, 3],
        [15.5, 3],
      ],
      missileRails: [
        [-11.5, 4],
        [11.5, 4],
      ],
    },
  };
  B.EnemyAirframes = {
    scout: "littleBird",
    gunship: "hind",
    interceptor: "jet",
    kamikaze: "munition",
    swarm: "quad",
    heavy: "chinook",
    missile: "blackHawk",
    artillery: "mi17",
    carrierBoss: "carrier",
  };
  // Elite formations fly premium airframes where one exists.
  B.EliteAirframes = { gunship: "ka52" };
  // Fixed-wing types point their nose along their velocity; rotorcraft can
  // hover and yaw to face the player while they strafe.
  B.FixedWing = new Set(["interceptor", "kamikaze"]);
})();
