// ───────────────────────────────────────────────────────────────
// 보스 패턴. heroes.js 의 abilities: [{ type, cd, ... }] 가 여기 type 과 연결됨.
// 새 패턴을 추가하려면 ABILITIES 에 함수를 하나 추가하세요.
//   (game, unit, ability) => void   ← cd 마다 1회 호출
// ───────────────────────────────────────────────────────────────
import { fireProjectile } from './projectiles.js';
import { COLORS } from './effects.js';
import { rand } from '../core/util.js';

export const ABILITIES = {
  /** 부채꼴 발사 */
  spread(game, u, a) {
    const t = u.target || game.player;
    const base = Math.atan2(t.y - 6 - (u.y - 10), t.x - u.x);
    for (let i = 0; i < a.count; i++) {
      const ang = base + (a.count === 1 ? 0 : (i / (a.count - 1) - 0.5) * a.arc);
      fireProjectile(game, { kind: a.projectile, x: u.x, y: u.y - 10 * u.scale, angle: ang, side: u.side, damage: a.damage, source: u });
    }
  },

  /** 원형 탄막 */
  ring(game, u, a) {
    const off = Math.random() * Math.PI;
    for (let i = 0; i < a.count; i++) {
      const ang = off + (i / a.count) * Math.PI * 2;
      fireProjectile(game, { kind: a.projectile, x: u.x, y: u.y - 10 * u.scale, angle: ang, side: u.side, damage: a.damage, source: u });
    }
    game.fx.ring(u.x, u.y - 8, 4, 30, COLORS.holy, 0.4);
  },

  /** 대상에게 돌진. 경로상 적에게 피해 */
  dash(game, u, a) {
    const t = u.target || game.player;
    const ang = Math.atan2(t.y - u.y, t.x - u.x);
    u.dash = { vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, t: a.duration, damage: a.damage, radius: a.radius, hit: new Set() };
    game.fx.ring(u.x, u.y, 4, 22, '#ffffff', 0.3);
  },

  /** 주변 광역 베기 */
  slash(game, u, a) {
    const enemies = game.enemiesOf(u.side, u.x, u.y, a.radius);
    for (const e of enemies) game.damage(e, a.damage, { source: u, knockX: (e.x - u.x) * 0.15, knockY: (e.y - u.y) * 0.15 });
    game.fx.ring(u.x, u.y - 6, a.radius * 0.4, a.radius, '#fff2b0', 0.3, 3);
  },

  /** 같은 편 회복 파동 */
  heal_wave(game, u, a) {
    const allies = game.alliesOf(u.side, u.x, u.y, a.radius);
    for (const o of allies) game.heal(o, a.amount);
    game.fx.ring(u.x, u.y - 6, 6, a.radius, COLORS.heal, 0.6, 2);
  },

  /** 같은 편 보호막: duration 초 동안 받는 피해에 damageTakenMul 을 곱함 (game.damage 에서 적용) */
  shield_aura(game, u, a) {
    const allies = game.alliesOf(u.side, u.x, u.y, a.radius);
    for (const o of allies) {
      o.shieldUntil = game.time + a.duration;
      o.shieldMul = a.damageTakenMul;
    }
    game.fx.ring(u.x, u.y - 6, 4, a.radius, COLORS.holy, 0.5, 2);
  },

  /** 부하 소환 (용사 편일 때만 동작) */
  summon(game, u, a) {
    if (u.side !== 'hero') return;
    for (let i = 0; i < a.count; i++) {
      const ang = (i / a.count) * Math.PI * 2;
      game.spawnHero(a.id, u.x + Math.cos(ang) * 24 + rand(-4, 4), u.y + Math.sin(ang) * 24, { goal: 'player' });
    }
    game.fx.ring(u.x, u.y, 6, 34, COLORS.holy, 0.5);
  },
};

export function updateAbilities(game, u, dt) {
  // 돌진 중
  if (u.dash) {
    const d = u.dash;
    d.t -= dt;
    u.x += d.vx * dt;
    u.y += d.vy * dt;
    u.moving = true;
    u.flip = d.vx < 0;
    for (const e of game.enemiesOf(u.side, u.x, u.y, d.radius)) {
      if (d.hit.has(e)) continue;
      d.hit.add(e);
      game.damage(e, d.damage, { source: u, knockX: d.vx * 0.06, knockY: d.vy * 0.06 });
    }
    if (Math.random() < 0.5) game.fx.burst(u.x, u.y - 4, '#e8e8ff', 1, 10, 0.3);
    if (d.t <= 0) u.dash = null;
    return true; // 이번 프레임 이동 처리함
  }
  for (const a of u.abilities) {
    a.t -= dt;
    if (a.t <= 0) {
      a.t = a.cd;
      const fn = ABILITIES[a.type];
      if (fn) fn(game, u, a);
      else console.warn('[abilities] 없는 패턴:', a.type);
    }
  }
  return false;
}
