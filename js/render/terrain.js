"use strict";
/* Sector terrain tiles baked once at startup plus the scrolling battlefield backdrop. */
(() => {
  const B = window.BP;
  const { TAU, poly, rect, circle, label } = B.Draw;
  const palettes = [
    ["#152a2f", "#253b39", "#34443b", "#506051"],
    ["#102b37", "#143c46", "#26555a", "#4c736a"],
    ["#141e30", "#212c3e", "#344153", "#657274"],
  ];
  const TILE_SIZE = 1024;
  const TILE_SEED_BASE = 4593;
  const GRAIN_COUNT = 4500;
  const CLOUD_RADIUS = 180;
  const CLOUD_SPRITE_SIZE = CLOUD_RADIUS * 2;

  // Fine surface grain is baked once, never allocated during combat.
  function paintSurfaceGrain(c, rng, sector) {
    const grainColor = sector === 2 ? "#8899ae12" : "#91b4a20a";
    for (let i = 0; i < GRAIN_COUNT; i++)
      rect(
        c,
        rng.range(0, TILE_SIZE),
        rng.range(0, TILE_SIZE),
        rng.range(1, 3),
        1,
        grainColor,
      );
  }

  function paintPortOutline(c, p) {
    poly(
      c,
      [
        [310, 0],
        [1024, 0],
        [1024, 1024],
        [235, 1024],
        [260, 860],
        [215, 690],
        [270, 505],
        [220, 340],
      ],
      p[1],
    );
    c.strokeStyle = "#637461";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(310, 0);
    c.lineTo(220, 340);
    c.lineTo(270, 505);
    c.lineTo(215, 690);
    c.lineTo(260, 860);
    c.lineTo(235, 1024);
    c.stroke();
  }

  function paintWarehouseHatches(c, x, y, width, height) {
    for (let yy = 16; yy < height - 12; yy += 15)
      rect(c, x + 12, y + yy, width - 24, 2, "#81917622");
  }

  function paintWarehouseUnit(c, rng, x, y, p) {
    const width = rng.range(82, 128),
      height = rng.range(68, 120);
    rect(c, x + 9, y + 10, width, height, "#0a191b55");
    rect(c, x, y, width, height, p[2], "#4a574850");
    rect(c, x + 7, y + 7, width - 14, height - 14, "#2b3f38", "#65735b35");
    paintWarehouseHatches(c, x, y, width, height);
    rect(c, x + 12, y + 12, 20, 24, "#45564a", "#65745a");
    rect(c, x + 15, y + 15, 14, 4, "#172b2b");
    if (rng.next() > 0.45) {
      circle(c, x + width - 25, y + height - 24, 13, "#2b3c32", "#6c76554d");
      circle(c, x + width - 25, y + height - 24, 5, "#5e6b4e");
    }
  }

  function paintPortWarehouses(c, rng, p) {
    for (let y = -80; y < 1024; y += 190) {
      rect(c, 320, y + 148, 710, 28, "#1e3030");
      rect(c, 320, y + 160, 710, 2, "#60705b40");
      for (let x = 365; x < 1024; x += 172) {
        rect(c, x - 22, y, 20, 180, "#1c3030");
        rect(c, x - 13, y + 14, 2, 70, "#8a886a30");
        paintWarehouseUnit(c, rng, x, y, p);
      }
    }
  }

  function paintPortYard(c) {
    for (let y = 60; y < 1000; y += 230) {
      rect(c, 160, y, 155, 34, "#334a43", "#586955");
      rect(c, 165, y + 5, 142, 3, "#83917740");
      for (let x = 168; x < 285; x += 22)
        rect(c, x, y + 10, 16, 14, "#6c694941", "#7e775055");
    }
  }

  function paintPortDebris(c, rng) {
    for (let i = 0; i < 70; i++) {
      const x = rng.range(0, 200),
        y = rng.range(0, 1024);
      rect(c, x, y, rng.range(10, 45), 1, "#89afaa13");
    }
  }

  function paintIndustrialPort(c, rng, p) {
    paintPortOutline(c, p);
    paintPortWarehouses(c, rng, p);
    paintPortYard(c);
    paintPortDebris(c, rng);
    label(c, "PORT 04 // RESTRICTED AIRSPACE", 382, 365, "#98a98b35", 15);
  }

  function paintPlatformStructure(c, x, y) {
    rect(c, x + 15, y + 18, 210, 125, "#081b2477");
    rect(c, x, y, 210, 125, "#324b4d", "#596960");
    rect(c, x + 9, y + 9, 192, 107, "#293f43", "#73847655");
    circle(c, x + 145, y + 63, 41, null, "#b9ad7166", 2);
    label(c, "H", x + 145, y + 78, "#b9ad7188", 40, "center");
    for (let n = 0; n < 3; n++) {
      rect(c, x + 15, y + 13 + n * 32, 61, 23, "#466267", "#86958a55");
      rect(c, x + 20, y + 17 + n * 32, 48, 3, "#122e39");
    }
    rect(c, x + 88, y - 80, 18, 80, "#364d4d");
    rect(c, x + 82, y - 91, 30, 15, "#6a7762");
  }

  function paintOceanPlatforms(c, rng) {
    for (let i = 0; i < 260; i++) {
      const x = rng.range(0, 1024),
        y = rng.range(0, 1024);
      rect(c, x, y, rng.range(8, 75), 1, "#98c7c71b");
    }
    for (const [x, y] of [
      [80, 110],
      [650, 490],
      [180, 840],
    ])
      paintPlatformStructure(c, x, y);
  }

  function paintScrapyardDust(c, rng) {
    for (let i = 0; i < 420; i++)
      circle(
        c,
        rng.range(0, 1024),
        rng.range(0, 1024),
        rng.next() > 0.96 ? 1.5 : 0.65,
        `rgba(169,194,207,${rng.range(0.1, 0.5)})`,
      );
  }

  function paintScrapyardWreck(c) {
    c.save();
    c.translate(140, 210);
    c.rotate(0.35);
    rect(c, -80, -13, 160, 26, "#42515c", "#697578");
    rect(c, -13, -65, 26, 130, "#36424d", "#75817d");
    for (let side of [-1, 1]) {
      rect(c, side * 42 - 22, -48, 44, 96, "#243549", "#4f6678");
      for (let y = -42; y < 43; y += 14)
        rect(c, side * 42 - 18, y, 36, 1, "#7793a544");
    }
    c.restore();
  }

  function paintScrapyardRing(c) {
    circle(c, 790, 765, 132, null, "#6c7e8133", 16);
    circle(c, 790, 765, 109, null, "#8197942b", 3);
    const RING_STUD_COUNT = 16;
    for (let i = 0; i < RING_STUD_COUNT; i++) {
      const a = (i * TAU) / RING_STUD_COUNT;
      rect(
        c,
        790 + Math.cos(a) * 132 - 3,
        765 + Math.sin(a) * 132 - 3,
        6,
        6,
        "#b2a77b55",
      );
    }
  }

  function paintOrbitalScrapyard(c, rng) {
    paintScrapyardDust(c, rng);
    paintScrapyardWreck(c);
    paintScrapyardRing(c);
  }

  function buildCloudSprite() {
    const sprite = document.createElement("canvas");
    sprite.width = CLOUD_SPRITE_SIZE;
    sprite.height = CLOUD_SPRITE_SIZE;
    const c = sprite.getContext("2d");
    const cloud = c.createRadialGradient(
      CLOUD_RADIUS,
      CLOUD_RADIUS,
      0,
      CLOUD_RADIUS,
      CLOUD_RADIUS,
      CLOUD_RADIUS,
    );
    cloud.addColorStop(0, "#c4d3bb");
    cloud.addColorStop(1, "#c4d3bb00");
    c.fillStyle = cloud;
    c.fillRect(0, 0, CLOUD_SPRITE_SIZE, CLOUD_SPRITE_SIZE);
    return sprite;
  }

  function drawTiledBackground(c, g, tile, scroll) {
    for (let x = -100; x < g.w; x += TILE_SIZE)
      for (let y = scroll - TILE_SIZE; y < g.h; y += TILE_SIZE)
        c.drawImage(tile, x, y);
  }

  function drawSurveyGrid(c, g, scroll) {
    // Tactical survey grid stays behind the aircraft and never resembles a floor.
    c.strokeStyle = "#b7ded00a";
    c.lineWidth = 1;
    for (let x = 60; x < g.w; x += 240) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, g.h);
      c.stroke();
    }
    for (let y = scroll % 180; y < g.h; y += 180) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(g.w, y);
      c.stroke();
    }
  }

  function drawClouds(c, g, t, sprite) {
    c.save();
    c.globalAlpha = 0.05;
    for (let i = 0; i < 3; i++) {
      const x = ((i * 550 + t * 14) % (g.w + 550)) - 200,
        y = 90 + i * 225;
      c.drawImage(
        sprite,
        x - CLOUD_RADIUS,
        y - CLOUD_RADIUS,
        CLOUD_SPRITE_SIZE,
        CLOUD_SPRITE_SIZE,
      );
    }
    c.restore();
  }

  Object.assign(B.Renderer.prototype, {
    buildTerrain() {
      for (let sector = 0; sector < 3; sector++) {
        const tile = document.createElement("canvas");
        tile.width = TILE_SIZE;
        tile.height = TILE_SIZE;
        const c = tile.getContext("2d"),
          rng = new B.RNG(TILE_SEED_BASE + sector),
          p = palettes[sector];
        rect(c, 0, 0, TILE_SIZE, TILE_SIZE, p[0]);
        paintSurfaceGrain(c, rng, sector);
        if (sector === 0) paintIndustrialPort(c, rng, p);
        else if (sector === 1) paintOceanPlatforms(c, rng);
        else paintOrbitalScrapyard(c, rng);
        this.tiles.push(tile);
      }
      // Cloud sprite is pre-rendered once; frames only drawImage it.
      this.cloudSprite = buildCloudSprite();
    },
    background(c, g, t) {
      const sector = Math.floor((g.wave - 1) / 10) % 3,
        tile = this.tiles[sector],
        scroll = (t * (sector === 2 ? 16 : 27)) % TILE_SIZE;
      drawTiledBackground(c, g, tile, scroll);
      drawSurveyGrid(c, g, scroll);
      if (sector < 2) drawClouds(c, g, t, this.cloudSprite);
    },
  });
})();
