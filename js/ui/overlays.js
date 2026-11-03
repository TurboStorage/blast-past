"use strict";
/* B.UI overlay template builders: button, menu, pause, upgrade, results, settings, help and logbook views. */
(() => {
  const B = window.BP,
    { esc, num, names } = B.UIKit;
  Object.assign(B.UI.prototype, {
    btn(a, label, quiet = false) {
      return `<button${quiet ? ' class="quiet"' : ""} data-action="${a}">${label}</button>`;
    },
    menu() {
      return `<section class="title-panel"><div class="eyebrow">◆ 1987 / TACTICAL FLIGHT COMMAND ◆</div><h1>BLAST<br><span>PAST</span></h1><p class="tagline">AERIAL ROGUELITE // SURVIVE THE SKY</p><div class="menu-actions">${this.btn("deploy", "DEPLOY <b>↗</b>")}${this.btn("help", "HOW TO FLY", true)}${this.btn("stats", "LOGBOOK", true)}${this.btn("settings", "SETTINGS", true)}</div><div class="micro">MOUSE / WASD TO PILOT · HOLD LMB / SPACE TO FIRE · SHIFT BOOST</div></section>`;
    },
    pause() {
      return `<section class="modal"><div class="eyebrow">FLIGHT COMPUTER / PAUSED</div><h2>SYSTEM HOLD</h2><p>Combat telemetry is frozen.</p><div class="modal-actions">${this.btn("resume", "RESUME MISSION")}${this.btn("settings", "SETTINGS", true)}${this.btn("help", "HOW TO FLY", true)}</div></section>`;
    },
    upgrade() {
      const g = this.g;
      return `<section class="upgrade"><div class="eyebrow">LEVEL ${g.level} // LOADOUT OPPORTUNITY</div><h2>CHOOSE YOUR EDGE</h2><div class="cards">${(g.offers || []).map((u, i) => `<button class="upgrade-card rarity-${String(u.rarity || "common").toLowerCase()}" data-action="upgrade" data-index="${i}"><span class="card-icon">${esc(u.icon || "✦")}</span><span class="rarity">${esc(u.rarity || "FIELD")} / ${esc(u.type || "SYSTEM")}</span><strong>${esc(u.name)}</strong><small>${esc(u.description)}</small><em>RANK ${(g.player.ranks[u.id] || 0) + 1} / ${u.max} · SELECT [${i + 1}]</em></button>`).join("")}</div></section>`;
    },
    results() {
      const g = this.g,
        rank =
          Object.entries(g.player.ranks || {})
            .filter(([, r]) => r)
            .map(([id, r]) => {
              const u = [...B.Upgrades.catalog, ...B.Upgrades.fallbacks].find(
                (x) => x.id === id,
              );
              return `<li>${esc(u?.name || id)}<b>${r}/${u?.max || r}</b></li>`;
            })
            .join("") || "<li>No upgrades collected</li>",
        damage =
          Object.entries(g.weaponDamage || {})
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(
              ([n, v]) =>
                `<li>${esc(names[n] || n.toUpperCase())}<b>${num(v)}</b></li>`,
            )
            .join("") || "<li>No damage recorded</li>";
      return `<section class="modal results"><div class="eyebrow">SIGNAL LOST / MISSION COMPLETE</div><h2>MISSION<br><span>OVER</span></h2><div class="result-grid"><b>${num(g.score)}<small>SCORE</small></b><b>${g.wave}<small>WAVE</small></b><b>${num(g.kills)}<small>HOSTILES</small></b><b>${Math.floor(g.time)}s<small>AIRBORNE</small></b><b>${g.level}<small>LEVEL</small></b><b>${num(g.damage)}<small>DAMAGE</small></b><b>${num(g.bossKills)}<small>BOSSES</small></b><b>${num(g.maxCombo)}<small>BEST COMBO</small></b></div><div class="result-details"><div><h3>LOADOUT</h3><ul>${rank}</ul></div><div><h3>DAMAGE REPORT</h3><ul>${damage}</ul></div></div>${this.btn("restart", "FLY AGAIN <b>↗</b>")}<p class="micro">BEST SCORE ${num(g.saved.bestScore)} · TOTAL RUNS ${num(g.saved.runs)}</p></section>`;
    },
    settings() {
      const g = this.g,
        s = g.settings,
        row = (id, label, k, min, max, step) =>
          `<div class="setting-row"><label for="${id}">${label}</label><output for="${id}">${Math.round(s[k] * 100)}%</output><input id="${id}" data-setting="${k}" type="range" min="${min}" max="${max}" step="${step}" value="${s[k]}"></div>`;
      return `<section class="modal settings"><div class="eyebrow">FLIGHT COMPUTER / CONFIG</div><h2>SETTINGS</h2>${row("masterVolume", "MASTER VOLUME", "master", 0, 1, 0.05)}${row("sfxVolume", "SFX VOLUME", "sfx", 0, 1, 0.05)}${row("screenShake", "SCREEN SHAKE", "shake", 0, 1, 0.05)}${row("particleDensity", "PARTICLE DENSITY", "particles", 0.2, 1, 0.1)}<div class="modal-actions">${this.btn("fullscreen", "FULLSCREEN [F]")}${this.btn("close", "BACK", true)}</div></section>`;
    },
    help() {
      return `<section class="modal help"><div class="eyebrow">FIELD MANUAL / 01</div><h2>HOW TO FLY</h2><div class="how"><p><b>PILOT</b> Steer with the cursor, or switch to WASD / arrow keys in settings.</p><p><b>ENGAGE</b> Hold left click or SPACE to fire. Mouse mode assists forward aim; keyboard mode aims independently at the cursor.</p><p><b>BOOST</b> Tap SHIFT for speed and a short damage grace period.</p><p><b>SURVIVE</b> Collect cyan salvage, choose upgrades, and clear amber warning zones. Waves advance every 30 seconds; bosses must be destroyed. Press Esc or P to pause.</p></div>${this.btn("close", "BACK", true)}</section>`;
    },
    stats() {
      const s = this.g.saved;
      const awards = B.Achievements.catalog
        .map(
          (a) =>
            `<li class="${s.achievements.includes(a.id) ? "earned" : ""}"><strong>${s.achievements.includes(a.id) ? "◆" : "◇"} ${esc(a.name)}</strong><small>${esc(a.description)}</small></li>`,
        )
        .join("");
      return `<section class="modal"><div class="eyebrow">FLIGHT COMPUTER / RECORDS</div><h2>LOGBOOK</h2><div class="result-grid"><b>${num(s.bestScore)}<small>BEST SCORE</small></b><b>${num(s.highestWave)}<small>HIGH WAVE</small></b><b>${num(s.totalKills)}<small>TOTAL KILLS</small></b><b>${num(s.bossKills)}<small>BOSSES</small></b></div><p class="micro">${num(s.runs)} MISSIONS · ${s.discoveries.filter((id) => B.Upgrades.catalog.some((u) => u.id === id)).length} / ${B.Upgrades.catalog.length} UPGRADES DISCOVERED</p><ul class="commendations">${awards}</ul>${this.btn("close", "BACK", true)}</section>`;
    },
  });
})();
