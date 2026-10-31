// ───────────────────────────────────────────────────────────────
// 월드: 던전 바닥 생성, 영혼 보석(경험치), 시체, 역병 웅덩이
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { drawFrame, animFrames } from '../core/assets.js';
import { compact, weighted } from '../core/util.js';
import { COLORS } from './effects.js';

export const FLOOR_PAD = 48;

/** 아레나 전체 바닥을 오프스크린 캔버스에 한 번 그려 둔다 */
export function buildFloor() {
  const W = CONFIG.ARENA_W;
  const H = CONFIG.ARENA_H;
  const T = CONFIG.TILE;
  const c = document.createElement('canvas');
  c.width = W + FLOOR_PAD * 2;
  c.height = H + FLOOR_PAD * 2;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#07040b';
  g.fillRect(0, 0, c.width, c.height);
  const floorMix = { floor_1: 60, floor_2: 6, floor_3: 6, floor_4: 5, floor_5: 4, floor_6: 4, floor_7: 3, floor_8: 3 };
  for (let y = 0; y < H; y += T) {
    for (let x = 0; x < W; x += T) {
      drawFrame(g, weighted(floorMix), FLOOR_PAD + x, FLOOR_PAD + y, { anchorX: 0, anchorY: 0 });
    }
  }
  // 윗벽
  for (let x = 0; x < W; x += T) {
    drawFrame(g, 'wall_top_mid', FLOOR_PAD + x, FLOOR_PAD - 2 * T, { anchorX: 0, anchorY: 0 });
    drawFrame(g, Math.random() < 0.05 ? 'wall_banner_red' : 'wall_mid', FLOOR_PAD + x, FLOOR_PAD - T, { anchorX: 0, anchorY: 0 });
  }
  // 장식: 해골, 웅덩이
  for (let i = 0; i < 140; i++) {
    const x = FLOOR_PAD + 20 + Math.random() * (W - 40);
    const y = FLOOR_PAD + 20 + Math.random() * (H - 40);
    g.globalAlpha = 0.6;
    if (Math.random() < 0.6) drawFrame(g, 'skull', x, y, { scale: 0.8 });
    else {
      g.fillStyle = '#2a0f17';
      g.beginPath();
      g.ellipse(x, y, 6 + Math.random() * 10, 3 + Math.random() * 4, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  // 아레나 경계 어둡게
  const grad = 40;
  for (let i = 0; i < grad; i += 4) {
    g.fillStyle = `rgba(7,4,11,${0.5 * (1 - i / grad)})`;
    g.fillRect(FLOOR_PAD + i, FLOOR_PAD, 4, H);
    g.fillRect(FLOOR_PAD + W - i - 4, FLOOR_PAD, 4, H);
    g.fillRect(FLOOR_PAD, FLOOR_PAD + H - i - 4, W, 4);
  }
  return c;
}

// ── 영혼 보석 ──────────────────────────────────────────────────
export function dropGem(game, x, y, value) {
  if (game.gems.length > 500) {
    // 너무 많으면 기존 보석에 합침
    const g = game.gems[Math.floor(Math.random() * game.gems.length)];
    g.value += value;
    return;
  }
  game.gems.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, value, magnet: false, t: Math.random() * 6 });
}

export function updateGems(game, dt) {
  const P = game.player;
  const R = CONFIG.PLAYER.pickupRadius * game.mods.magnetMul;
  for (const g of game.gems) {
    g.t += dt;
    const dx = P.x - g.x;
    const dy = P.y - 6 - g.y;
    const d = Math.hypot(dx, dy);
    if (!g.magnet && d < R) g.magnet = true;
    if (g.magnet) {
      const sp = 140 + g.t * 10;
      g.x += (dx / (d || 1)) * Math.min(d, sp * dt);
      g.y += (dy / (d || 1)) * Math.min(d, sp * dt);
      if (d < 6) {
        g.dead = true;
        game.addXp(g.value);
      }
    }
  }
  compact(game.gems, (g) => !g.dead);
}

export function drawGems(ctx, game) {
  for (const g of game.gems) {
    const big = g.value >= 10;
    const color = g.value >= 25 ? '#ff5b6e' : g.value >= 5 ? '#62ff9a' : COLORS.soul;
    const s = big ? 3 : 2;
    const bob = Math.sin(g.t * 4) * 0.8;
    ctx.fillStyle = 'rgba(90,200,255,0.25)';
    ctx.fillRect(g.x - s - 1, g.y - s * 2 - 1 + bob, s * 2 + 2, s * 3 + 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - s * 2 + bob);
    ctx.lineTo(g.x + s, g.y - s + bob);
    ctx.lineTo(g.x, g.y + s + bob);
    ctx.lineTo(g.x - s, g.y - s + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(g.x - 1, g.y - s * 2 + 1 + bob, 1, 1);
  }
}

// ── 시체 ───────────────────────────────────────────────────────
export function addCorpse(game, u) {
  if (game.corpses.length >= CONFIG.MAX_CORPSES) game.corpses.shift();
  const frames = animFrames(u.sprite, 'idle');
  game.corpses.push({ x: u.x, y: u.y, frame: frames[0], flip: u.flip, scale: u.scale, life: CONFIG.CORPSE_LIFETIME, heroId: u.defId });
}

export function updateCorpses(game, dt) {
  for (const c of game.corpses) c.life -= dt;
  compact(game.corpses, (c) => c.life > 0 && !c.dead);
}

export function drawCorpses(ctx, game) {
  for (const c of game.corpses) {
    const a = Math.min(1, c.life / 3) * 0.85;
    drawFrame(ctx, c.frame, c.x, c.y - 2, {
      rot: c.flip ? -Math.PI / 2 : Math.PI / 2,
      anchorY: 0.5,
      scale: c.scale,
      alpha: a,
      tint: '#2b2233',
      tintAlpha: 0.55,
    });
  }
}

// ── 역병 웅덩이 ────────────────────────────────────────────────
export function updatePools(game, dt) {
  for (const p of game.pools) {
    p.life -= dt;
    p.tickT -= dt;
    if (p.tickT <= 0) {
      p.tickT = 0.4;
      for (const e of game.heroesIn(p.x, p.y, p.r)) game.damage(e, p.dmg, { fromPlayer: true });
    }
    if (Math.random() < 0.3) game.fx.rise(p.x + (Math.random() - 0.5) * p.r * 1.4, p.y + (Math.random() - 0.5) * p.r * 0.6, '#8dff6a', 1, 0.6);
  }
  compact(game.pools, (p) => p.life > 0);
}

export function drawPools(ctx, game) {
  for (const p of game.pools) {
    const k = p.life / p.max;
    const grow = Math.min(1, (p.max - p.life) * 6);
    ctx.globalAlpha = 0.4 * Math.min(1, k * 3);
    ctx.fillStyle = '#2f7a2a';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r * grow, p.r * 0.6 * grow, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55 * Math.min(1, k * 3);
    ctx.fillStyle = '#7dff5a';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r * 0.55 * grow, p.r * 0.32 * grow, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
