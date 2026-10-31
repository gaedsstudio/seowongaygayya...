// ───────────────────────────────────────────────────────────────
// 유닛 AI: 대상 선택 → 이동 → 공격, 그리고 겹침 해소(분리)
//   용사(side 'hero') : 가까운 군단/플레이어를 막아서며 싸우고, goal 에 따라 플레이어 또는 제단으로 진군
//   군단(side 'evil') : 플레이어 주위를 호위하다가 근처 용사를 공격
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { clamp } from '../core/util.js';
import { fireProjectile } from './projectiles.js';
import { updateAbilities } from './abilities.js';

const tmp = [];
const MINION_AGGRO = 115;
const MINION_LEASH = 210;

function pickHeroTarget(game, u) {
  const P = game.player;
  const reach = u.ai === 'ranged' ? u.range : 40 + u.radius;
  const near = game.allyGrid.nearest(u.x, u.y, reach, (o) => o.alive && o.kind !== 'altar' && !(o.spawnT > 0));
  if (near) return near;
  if (u.goal === 'altar' && game.altar.alive) {
    if ((u.x - P.x) ** 2 + (u.y - P.y) ** 2 < 70 * 70) return P;
    return game.altar;
  }
  return P;
}

function pickEvilTarget(game, u) {
  const P = game.player;
  if ((u.x - P.x) ** 2 + (u.y - P.y) ** 2 > MINION_LEASH * MINION_LEASH) return null;
  const aggro = Math.max(MINION_AGGRO, u.ai === 'ranged' ? u.range + 20 : 0) * (u.kind === 'fallen' ? 1.4 : 1);
  return game.heroGrid.nearest(u.x, u.y, aggro, (o) => o.alive && !(o.spawnT > 0));
}

function mostWounded(game, u) {
  const list = game.alliesOf(u.side, u.x, u.y, u.range);
  let best = null;
  let br = 0.999;
  for (const o of list) {
    if (o === u || o.kind === 'altar') continue;
    const r = o.hp / o.maxHp;
    if (r < br) {
      br = r;
      best = o;
    }
  }
  return best;
}

function attack(game, u, t) {
  if (u.ai === 'ranged') {
    const ang = Math.atan2(t.y - 6 * (t.scale || 1) - (u.y - 8 * u.scale), t.x - u.x);
    fireProjectile(game, {
      kind: u.def.projectile || 'arrow',
      x: u.x,
      y: u.y - 8 * u.scale,
      angle: ang,
      side: u.side,
      damage: u.damage,
      source: u,
      target: t,
    });
    return;
  }
  const dx = t.x - u.x;
  const dy = t.y - u.y;
  const d = Math.hypot(dx, dy) || 1;
  game.damage(t, u.damage, { source: u, knockX: (dx / d) * 4, knockY: (dy / d) * 4 });
  if (u.def.cleave) {
    for (const e of game.enemiesOf(u.side, t.x, t.y, u.def.cleave)) {
      if (e !== t) game.damage(e, u.damage * 0.6, { source: u });
    }
    game.fx.ring(t.x, t.y - 4, 3, u.def.cleave, '#ffb0ff', 0.25, 2);
  } else if (Math.random() < 0.5) {
    game.fx.burst(t.x, t.y - 6, u.side === 'hero' ? '#ffffff' : '#c79bff', 2, 30, 0.2, 1);
  }
}

export function updateUnits(game, dt) {
  const P = game.player;
  for (const u of game.units) {
    if (!u.alive) continue;
    u.animT += dt;
    u.hitFlash = Math.max(0, u.hitFlash - dt);
    if (u.spawnT > 0) {
      u.spawnT -= dt;
      continue;
    }
    if (u.lifeT !== Infinity) {
      u.lifeT -= dt;
      if (u.lifeT <= 0) {
        game.kill(u);
        continue;
      }
    }

    // 넉백
    if (u.knockX || u.knockY) {
      const k = Math.min(1, dt * 12);
      u.x += u.knockX * k;
      u.y += u.knockY * k;
      u.knockX *= 1 - k;
      u.knockY *= 1 - k;
      if (Math.abs(u.knockX) + Math.abs(u.knockY) < 0.05) u.knockX = u.knockY = 0;
    }

    if (updateAbilities(game, u, dt)) continue;

    // 대상 선택
    u.retargetT -= dt;
    if (u.retargetT <= 0 || (u.target && !u.target.alive)) {
      u.retargetT = 0.25 + Math.random() * 0.15;
      u.target = u.side === 'hero' ? pickHeroTarget(game, u) : pickEvilTarget(game, u);
    }

    // 힐러
    if (u.ai === 'healer') {
      u.healerCdT -= dt;
      if (u.healerCdT <= 0) {
        const w = mostWounded(game, u);
        if (w) {
          game.heal(w, u.def.heal || 8);
          game.fx.rise(w.x, w.y - 6, '#7dff9a', 5);
          u.healerCdT = u.attackCd;
        } else u.healerCdT = 0.4;
      }
    }

    // 이동 목표
    const t = u.target;
    let tx;
    let ty;
    let stop;
    let speed = u.speed;
    if (t && t.alive) {
      tx = t.x;
      ty = t.y;
      if (u.ai === 'ranged') stop = u.range * 0.85;
      else if (u.ai === 'healer') stop = u.side === 'hero' ? 80 : 30;
      else stop = u.range + t.radius + u.radius * 0.5;
    } else if (u.side === 'evil') {
      u.slotAngle += dt * 0.25;
      tx = P.x + Math.cos(u.slotAngle) * u.slotDist;
      ty = P.y + Math.sin(u.slotAngle) * u.slotDist * 0.7;
      stop = 3;
    } else {
      tx = P.x;
      ty = P.y;
      stop = 10;
    }
    const dx = tx - u.x;
    const dy = ty - u.y;
    const d = Math.hypot(dx, dy);
    if (u.side === 'evil' && (!t || !t.alive) && d > 70) speed *= 1.7; // 호위 복귀 가속
    if (d > stop) {
      const s = Math.min(speed * dt, d - stop);
      u.x += (dx / d) * s;
      u.y += (dy / d) * s;
      u.moving = true;
    } else {
      u.moving = false;
    }
    if (Math.abs(dx) > 1) u.flip = dx < 0;

    // 공격
    u.attackT -= dt;
    if (t && t.alive && u.ai !== 'healer' && u.damage > 0 && d <= stop + 3 && u.attackT <= 0) {
      u.attackT = u.attackCd * (0.9 + Math.random() * 0.2);
      attack(game, u, t);
    }
  }
}

/** 유닛끼리 겹치지 않도록 밀어내기 + 플레이어/제단 주변 밀어내기 + 아레나 경계 */
export function separate(game) {
  const grid = game.unitGrid;
  const P = game.player;
  const A = game.altar;
  const W = CONFIG.ARENA_W;
  const H = CONFIG.ARENA_H;
  for (const u of game.units) {
    if (!u.alive) continue;
    const list = grid.query(u.x, u.y, u.radius + 14, tmp);
    for (const o of list) {
      if (o.uid <= u.uid || !o.alive) continue;
      const dx = o.x - u.x;
      const dy = o.y - u.y;
      const r = (u.radius + o.radius) * 0.8;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 < 0.0001) {
        o.x += Math.random() - 0.5;
        o.y += Math.random() - 0.5;
        continue;
      }
      const d = Math.sqrt(d2);
      const push = (r - d) * 0.5;
      const mu = u.boss ? 20 : u.radius * u.radius;
      const mo = o.boss ? 20 : o.radius * o.radius;
      const wu = mo / (mu + mo);
      const nx = dx / d;
      const ny = dy / d;
      u.x -= nx * push * 2 * wu;
      u.y -= ny * push * 2 * wu;
      o.x += nx * push * 2 * (1 - wu);
      o.y += ny * push * 2 * (1 - wu);
    }
    // 용사는 플레이어 몸에 겹치지 않음
    if (u.side === 'hero') pushOut(u, P, P.radius + u.radius);
    if (A.alive) pushOut(u, A, A.radius + u.radius);
    u.x = clamp(u.x, 8, W - 8);
    u.y = clamp(u.y, 12, H - 4);
  }
}

function pushOut(u, o, r) {
  const dx = u.x - o.x;
  const dy = u.y - o.y;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r || d2 < 0.0001) return;
  const d = Math.sqrt(d2);
  u.x = o.x + (dx / d) * r;
  u.y = o.y + (dy / d) * r;
}
