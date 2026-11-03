# Runtime contracts

Runtime is classic scripts sharing `window.BP`; no imports, fetch, or runtime dependencies. `index.html` loads core, services, content, encounters, weapons, render, UI, game, main in that order. New files may refer to BP classes at execution time. Read js/core.js and js/game.js for the authoritative interfaces. Coordinating agent owns those files and weapons/content/tests.

## Game data

- g.w/g.h are logical canvas dimensions; y down, origin top-left. Height 720; width responds to aspect ratio. Renderer receives resize(w,h,dpr).
- g.mode: menu / playing / paused / upgrade / settings / stats / help / dead. g.time combat seconds; g.visualTime always ticks. g.wave, waveTime, level, xp, xpNext, pendingLevels, score, combo, kills, damage, bossKills, weaponDamage.
- g.player has x,y,vx,vy,r,hp,maxHp,angle (forward is -PI/2),bank,rotor,invuln,boost,boostCd,muzzle,shield,ranks,stats,cooldowns.
- g.enemies: id,type,x,y,r,hp,maxHp,speed,age,warning (seconds),fire,flash,dead,score,xp; optional boss,phase,parts,telegraph. Game advances age/flash/warning, skips update during warning, handles contact and off-bottom cleanup.
- g.projectiles: x,y,px,py,angle,speed,r,damage,life,enemy,color,weapon,pierce,hit Set; optional homing,splash,cluster,critical,explosive. Game moves/collides/cleans.
- g.pickups: x,y,type ('xp','repair','shield','emp'),value,r,life.
- g.obstacles: x,y,type,r,hp,maxHp,angle,dead. Environment owns obstacle simulation.
- g.particles: x,y,vx,vy,color,life,maxLife,size.
- g.effects: type,x,y,life,maxLife; ring has radius; arc has points array of {x,y}; beam has x2,y2,width,color; text has text/color. Game decrements life.
- g.warnings: encounter-owned objects; renderer must read optional shape safely. Coordinate warnings with encounter agent.
- g.banner, bannerTime; g.shake (magnitude), slowmo (seconds).

## Game methods

- start(seed?), pause(), togglePause(), fullscreen(), save(), die(), gainXp(amount), chooseUpgrade(index).
- nearest(from,range,predicate) returns active non-warning enemy or null.
- spawnEnemy(type,x,y,options) merges options into baseline and returns entity or null (cap 65).
- bullet(x,y,angle,options) returns projectile or undefined (cap 700).
- damageEnemy(entity,amount,weapon,projectile?), killEnemy(entity), hurt(amount).
- particle(x,y,vx,vy,color,life,size), burst(x,y,color,count,size), effect(type,x,y,extra), drop(x,y,type,value).
- audio.unlock(), audio.play(name); names shoot, boost, explosion, bossDeath, damage, death, xp, repair, shield, emp, levelUp, upgrade, rocket, missile, arc, warning, bossArrival, heavy, ui.
- settings: controls ('mouse'/'keyboard'), master/sfx/shake/particles normalized 0–1. saved: bestScore,highestWave,totalKills,bossKills,runs,discoveries,achievements,settings.

## Extension interfaces

- BP.Director constructor(game), update(dt). Owns wave pacing and boss spawn; sets g.waveTime and advances g.wave. Call BP.Encounters.spawn(g,type,x,y,extra) for configured enemies.
- BP.Encounters.update(g,e,dt); optional damagePart(g,e,projectile,amount) hook coordinating agent can wire. Do not modify game.js without coordination.
- BP.Environment.update(g,dt), explode(g,obstacle) optional.
- BP.Upgrades.catalog array with id,name,description,type,rarity,icon,max; offer(g) returns 3; apply(g,id) updates stats and ranks.
- BP.Weapons.update(g,dt), explode(g,x,y,radius,damage,weapon,cluster), arc(g,origin,count,damage).
- BP.Renderer(canvas): resize(w,h,dpr), draw(g). All procedural game artwork drawn to single canvas, DOM UI above.
- BP.UI(game): refresh() on state changes, tick() per rendered frame (throttle HUD DOM writes), close() returns from submenus correctly. Own index.html/style.css/js/ui.js if assigned presentation.
- BP.Persistence.load()/save(data): defensive versioned storage. BP.Audio(settings): unlock/play.

Keep edits within assigned files. Write test notes in your final handoff; coordinator updates progress.md.
