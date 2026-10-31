// ───────────────────────────────────────────────────────────────
// 발사체 생성/이동/충돌/그리기
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { PROJECTILES } from '../data/projectiles.js';
import { drawFrame } from '../core/assets.js';
import { compact } from '../core/util.js';

const tmp = [];

/**
 * opts: { kind, x, y, angle, side, damage, pierce=0, homing=null, speedMul=1, source, knock=0, target }
 */
export function fireProjectile(game, opts) {
  if (game.projectiles.length >= CONFIG.MAX_PROJECTILES) return null;
  const def = PROJECTILES[opts.kind];
  const speed = def.speed * (opts.speedMul || 1);
  const p = {
    kind: opts.kind,
    def,
    x: opts.x,
    y: opts.y,
    vx: Math.cos(opts.angle) * speed,
    vy: Math.sin(opts.angle) * speed,
    speed,
    side: opts.side,
    damage: opts.damage,
    pierce: opts.pierce || 0,
    life: def.life,
    radius: def.radius,
    homing: opts.homing || null,
    hit: new Set(),
    source: opts.source || null,
    knock: opts.knock || 0,
    aim: opts.target || null, // 제단은 직접 조준한 발사체만 맞음
    fromPlayer: !!opts.fromPlayer,
    alive: true,
  };
  game.projectiles.push(p);
  return p;
}

export function updateProjectiles(game, dt) {
  for (const p of game.projectiles) {
    p.life -= dt;
    if (p.life <= 0) { p.alive = false; continue; }

    // 유도
    if (p.homing && p.homing.alive) {
      const want = Math.atan2(p.homing.y - 6 - p.y, p.homing.x - p.x);
      const cur = Math.atan2(p.vy, p.vx);
      let d = want - cur;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const turn = Math.max(-8 * dt, Math.min(8 * dt, d));
      const a = cur + turn;
      p.vx = Math.cos(a) * p.speed;
      p.vy = Math.sin(a) * p.speed;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.def.trail && Math.random() < 0.6) {
      game.fx.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.25, max: 0.25, color: p.def.trail, size: 1.5 });
    }

    // 충돌: 몸통 중심은 발보다 약간 위
    const grid = p.side === 'evil' ? game.heroGrid : game.allyGrid;
    const list = grid.query(p.x, p.y + 6, p.radius + 14, tmp);
    for (const t of list) {
      if (!t.alive || p.hit.has(t)) continue;
      if (t.spawnT > 0) continue;
      if (t.kind === 'altar' && p.aim !== t) continue;
      const cy = t.y - 6 * (t.scale || 1);
      const rr = p.radius + t.radius;
      if ((t.x - p.x) ** 2 + (cy - p.y) ** 2 > rr * rr * 1.6) continue;
      p.hit.add(t);
      game.damage(t, p.damage, {
        source: p.source,
        fromPlayer: p.fromPlayer,
        viaProjectile: true,
        knockX: p.knock ? (p.vx / p.speed) * p.knock : 0,
        knockY: p.knock ? (p.vy / p.speed) * p.knock : 0,
      });
      if (p.pierce-- <= 0) { p.alive = false; break; }
    }
    if (p.x < -50 || p.y < -50 || p.x > CONFIG.ARENA_W + 50 || p.y > CONFIG.ARENA_H + 50) p.alive = false;
  }
  compact(game.projectiles, (p) => p.alive);
}

export function drawProjectiles(ctx, game) {
  for (const p of game.projectiles) {
    const d = p.def;
    if (d.sprite) {
      drawFrame(ctx, d.sprite, p.x, p.y, {
        rot: Math.atan2(p.vy, p.vx) + Math.PI / 2,
        anchorY: 0.5,
        scale: d.scale || 1,
      });
    } else {
      ctx.fillStyle = d.glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, d.size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = d.color;
      ctx.fillRect(p.x - d.size / 2, p.y - d.size / 2, d.size, d.size);
    }
  }
}
