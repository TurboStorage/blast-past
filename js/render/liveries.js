"use strict";
/*
 * Paint schemes. Friendly aircraft wear low-visibility greys that read against
 * the dark battlefield; hostiles wear desert camouflage with red recognition
 * flashes; elites swap to charcoal with gold trim.
 */
(() => {
  const B = window.BP;
  const GLASS = ["#d6f1f7", "#6fa8bf", "#1d3442"];
  const shared = {
    glass: GLASS,
    frame: "#15202599",
    outline: "#10171bd9",
    metal: "#8b9296",
    metalDark: "#3c4247",
    exhaust: "#1b1d1f",
    blade: "#2e3438",
    bladeTip: "#e7d58a",
    disc: "205,214,218",
    lightPort: "#ff4f45",
    lightStarboard: "#4dff9a",
    lightTail: "#fff8e6",
    beacon: "#ff3b30",
  };

  B.Liveries = {
    // USMC-style Light Ghost Gray undersides with Blue Gray upper surfaces.
    ghost: {
      ...shared,
      base: "#7f8b93",
      light: "#b5c0c6",
      dark: "#4a555c",
      panel: "#1c262c55",
      spine: "#d5dde066",
      camo: null,
      accent: "#2b3338",
      mark: "#1d2529aa",
      store: "#58615a",
      storeDark: "#2c322e",
      storeTip: "#c9b27a",
    },
    // Hostile desert scheme: sand with brown disruptive patches, red flashes.
    sand: {
      ...shared,
      base: "#a98f67",
      light: "#d3bd92",
      dark: "#6b5a40",
      panel: "#2d231655",
      spine: "#efe0bb55",
      camo: ["#7d6446cc", "#8a7a55bb"],
      accent: "#3a2f24",
      mark: "#d8473dee",
      store: "#6d6450",
      storeDark: "#3a3428",
      storeTip: "#d86a4a",
    },
    // Hostile temperate scheme for transports: olive with sand patches.
    olive: {
      ...shared,
      base: "#76784f",
      light: "#a7a676",
      dark: "#474a31",
      panel: "#1e1f1255",
      spine: "#d9d6a855",
      camo: ["#a08c5fbb", "#50533acc"],
      accent: "#2e2f20",
      mark: "#d8473dee",
      store: "#5b5b43",
      storeDark: "#303123",
      storeTip: "#d86a4a",
    },
    // Elite wing: charcoal with gold trim and a brighter beacon.
    elite: {
      ...shared,
      base: "#4a4d52",
      light: "#7d8187",
      dark: "#26282c",
      panel: "#0c0d0f66",
      spine: "#a3a7ad55",
      camo: null,
      accent: "#16181a",
      mark: "#f0c05aee",
      store: "#3e4043",
      storeDark: "#1e2022",
      storeTip: "#f0c05a",
      bladeTip: "#f0c05a",
      beacon: "#ffd24a",
    },
    // Friendly escort drones: teal composite.
    escort: {
      ...shared,
      base: "#4f8c86",
      light: "#86c4b8",
      dark: "#2b5250",
      panel: "#10221f55",
      spine: "#c5eee466",
      camo: null,
      accent: "#1b2e2c",
      mark: "#9ff5e0",
      store: "#3d5f5a",
      storeDark: "#1f3431",
      storeTip: "#9ff5e0",
    },
    // Hostile expendable drones: matte grey-brown with red eyes.
    drone: {
      ...shared,
      base: "#6a625a",
      light: "#9a9086",
      dark: "#3b3632",
      panel: "#16131155",
      spine: "#c9beb055",
      camo: null,
      accent: "#221f1c",
      mark: "#ff5a48",
      store: "#4d4640",
      storeDark: "#2a2622",
      storeTip: "#ff5a48",
    },
  };
})();
