// ───────────────────────────────────────────────────────────────
// 스킬 동작 구현 + 패시브 능력치 계산 + 레벨업 선택지
//
// 새 스킬 추가 방법 (docs/DATA_GUIDE.md 참고)
//   1) src/data/skills.js 의 SKILLS 에 데이터 추가
//   2) 아래 SKILL_IMPL 에 같은 id 로 { update(game, s, L, dt), drawGround?(ctx, game, s, L) } 추가
//      s = 스킬 상태 객체 { id, level, t }, L = 현재 레벨 수치(+mods 적용 전)
// ───────────────────────────────────────────────────────────────
import { SKILLS, PASSIVES, STAT_LABELS, MAX_ACTIVE_SLOTS, MAX_PASSIVE_SLOTS, FALLBACK_REWARDS } from '../data/skills.js';
import { fireProjectile } from './projectiles.js';
import { COLORS } from './effects.js';
import { shuffle, rand } from '../core/util.js';

export const SKILL_IMPL = {
  soul_bolt: {
    update(game, s, L, dt) {
      if ((s.t -= dt) > 0) return;
      const P = game.player;
      const targets = game.nearestHeroes(P.x, P.y, 230, L.count);
      if (!targets.length) { s.t = 0.15; return; }
      s.t = L.cd * game.mods.cdMul;
      for (let i = 0; i < L.count; i++) {
        const t = targets[i % targets.length];
        const ang = Math.atan2(t.y - 6 - (P.y - 10), t.x - P.x) + (i - (L.count - 1) / 2) * 0.25;
        fireProjectile(game, {
          kind: 'soul_bolt', x: P.x, y: P.y - 10, angle: ang, side: 'evil',
          damage: L.dmg * game.mods.dmgMul, pierce: L.pierce, homing: t, fromPlayer: true, knock: 2,
        });
      }
    },
  },

  raise_dead: {
    update(game, s, L, dt) {
      if ((s.t -= dt) > 0) return;
      s.t = L.cd * game.mods.cdMul;
      const cap = L.cap + game.mods.minionCapAdd;
      let room = cap - game.minionCount();
      if (room <= 0) return;
      const P = game.player;
      const r = L.radius * game.mods.areaMul;
      const near = game.corpses
        .filter((c) => (c.x - P.x) ** 2 + (c.y - P.y) ** 2 <= r * r)
        .sort((a, b) => (a.x - P.x) ** 2 + (a.y - P.y) ** 2 - ((b.x - P.x) ** 2 + (b.y - P.y) ** 2));
      for (let i = 0; i < near.length && i < L.perCast && room > 0; i++, room--) {
        game.raiseMinion(near[i], L.tiers);
      }
    },
    drawGround(ctx, game, s, L) {
      const P = game.player;
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = COLORS.evil;
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(P.x, P.y - 2, L.radius * game.mods.areaMul, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    },
  },

  death_aura: {
    update(game, s, L, dt) {
      if ((s.t -= dt) > 0) return;
      s.t = 0.5;
      const P = game.player;
      const r = L.radius * game.mods.areaMul;
      for (const e of game.heroesIn(P.x, P.y - 4, r)) {
        const dx = e.x - P.x;
        const dy = e.y - P.y;
        const d = Math.hypot(dx, dy) || 1;
        game.damage(e, L.dmg * game.mods.dmgMul, { fromPlayer: true, knockX: (dx / d) * 1.5, knockY: (dy / d) * 1.5 });
      }
    },
    drawGround(ctx, game, s, L) {
      const P = game.player;
      const r = L.radius * game.mods.areaMul;
      const tm = game.time;
      ctx.globalAlpha = 0.22 + 0.05 * Math.sin(tm * 3);
      ctx.fillStyle = '#4a1a7a';
      ctx.beginPath();
      ctx.arc(P.x, P.y - 4, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#9b5cff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.lineDashOffset = -tm * 12;
      ctx.beginPath();
      ctx.arc(P.x, P.y - 4, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.globalAlpha = 1;
    },
  },

  plague_pool: {
    update(game, s, L, dt) {
      if ((s.t -= dt) > 0) return;
      const P = game.player;
      const cands = game.heroesIn(P.x, P.y, 200);
      if (!cands.length) { s.t = 0.3; return; }
      s.t = L.cd * game.mods.cdMul;
      shuffle(cands);
      for (let i = 0; i < L.count; i++) {
        const t = cands[i % cands.length];
        game.pools.push({
          x: t.x + rand(-8, 8), y: t.y + rand(-6, 6), r: L.radius * game.mods.areaMul,
          life: L.duration, max: L.duration, dmg: L.dmg * game.mods.dmgMul, tickT: 0,
        });
      }
    },
  },

  bone_spear: {
    update(game, s, L, dt) {
      if ((s.t -= dt) > 0) return;
      const P = game.player;
      const t = game.nearestHeroes(P.x, P.y, 260, 1)[0];
      if (!t) { s.t = 0.2; return; }
      s.t = L.cd * game.mods.cdMul;
      const base = Math.atan2(t.y - (P.y - 8), t.x - P.x);
      for (let i = 0; i < L.count; i++) {
        fireProjectile(game, {
          kind: 'bone_spear', x: P.x, y: P.y - 8, angle: base + (i - (L.count - 1) / 2) * 0.18, side: 'evil',
          damage: L.dmg * game.mods.dmgMul, pierce: L.pierce, fromPlayer: true, knock: 6,
        });
      }
    },
  },

  corpse_explosion: {
    update(game, s, L, dt) {
      if ((s.t -= dt) > 0) return;
      const P = game.player;
      const list = game.corpses
        .filter((c) => (c.x - P.x) ** 2 + (c.y - P.y) ** 2 < 170 * 170)
        .sort((a, b) => (a.x - P.x) ** 2 + (a.y - P.y) ** 2 - ((b.x - P.x) ** 2 + (b.y - P.y) ** 2));
      if (!list.length) { s.t = 0.3; return; }
      s.t = L.cd * game.mods.cdMul;
      const r = L.radius * game.mods.areaMul;
      for (let i = 0; i < Math.min(L.count, list.length); i++) {
        const c = list[i];
        c.dead = true;
        for (const e of game.heroesIn(c.x, c.y, r)) {
          const dx = e.x - c.x;
          const dy = e.y - c.y;
          const d = Math.hypot(dx, dy) || 1;
          game.damage(e, L.dmg * game.mods.dmgMul, { fromPlayer: true, knockX: (dx / d) * 8, knockY: (dy / d) * 8 });
        }
        game.fx.ring(c.x, c.y - 3, 3, r, '#ff9a3c', 0.35, 3);
        game.fx.burst(c.x, c.y - 3, '#ffcf6b', 10, 70, 0.45, 2);
        game.fx.burst(c.x, c.y - 3, '#8a1f1f', 6, 50, 0.6, 2);
      }
      game.fx.shake(1.5, 0.12);
    },
  },

  possession: {
    update(game, s, L, dt) {
      if ((s.t -= dt) > 0) return;
      const owned = game.units.filter((u) => u.alive && u.kind === 'possessed' && u.lifeT === Infinity).length;
      if (owned >= L.cap) { s.t = 0.5; return; }
      const P = game.player;
      const cands = game.heroesIn(P.x, P.y, L.range).filter((u) => !u.boss && u.spawnT <= 0);
      if (!cands.length) { s.t = 0.5; return; }
      s.t = L.cd * game.mods.cdMul;
      cands.sort((a, b) => b.maxHp - a.maxHp); // 가장 강한 용사부터
      for (let i = 0; i < Math.min(L.count, cands.length, L.cap - owned); i++) {
        const u = cands[i];
        game.possess(u, false);
        game.fx.ring(u.x, u.y - 6, 20, 2, COLORS.evil, 0.4, 2);
      }
    },
  },
};

// ── 레벨/능력치 도우미 ─────────────────────────────────────────

export function skillLevelData(id, level) {
  const lv = SKILLS[id].levels;
  return lv[Math.min(level, lv.length) - 1];
}

export function skillMaxLevel(id) {
  return SKILLS[id].levels.length;
}

export function addSkill(game, id) {
  if (game.skills[id]) game.skills[id].level++;
  else game.skills[id] = { id, level: 1, t: 0.3 };
}

export function updateSkills(game, dt) {
  for (const id in game.skills) {
    const s = game.skills[id];
    const impl = SKILL_IMPL[id];
    if (impl) impl.update(game, s, skillLevelData(id, s.level), dt);
  }
}

export function drawSkillsGround(ctx, game) {
  for (const id in game.skills) {
    const s = game.skills[id];
    const impl = SKILL_IMPL[id];
    if (impl && impl.drawGround) impl.drawGround(ctx, game, s, skillLevelData(id, s.level));
  }
}

export function computeMods(game) {
  const m = {
    maxHp: 0, speedMul: 1, areaMul: 1, cdMul: 1, dmgMul: 1,
    minionDmgMul: 1, minionHpMul: 1, minionCapAdd: 0, magnetMul: 1,
    altarHpMul: 1, altarRegen: 0, altarDmgMul: 1,
  };
  for (const id in game.passives) PASSIVES[id].apply(m, game.passives[id]);
  game.mods = m;

  const P = game.player;
  const newMax = P.baseMaxHp + m.maxHp;
  P.hp += Math.max(0, newMax - P.maxHp);
  P.maxHp = newMax;

  const A = game.altar;
  const aMax = Math.round(A.baseMaxHp * m.altarHpMul);
  if (A.alive) A.hp += Math.max(0, aMax - A.maxHp);
  A.maxHp = aMax;
  A.regen = A.baseRegen + m.altarRegen;
}

// ── 레벨업 선택지 ──────────────────────────────────────────────

export function rollUpgrades(game, n = 3) {
  const pool = [];
  const activeCount = Object.keys(game.skills).length;
  const passiveCount = Object.keys(game.passives).length;
  for (const id in SKILLS) {
    const s = game.skills[id];
    if (s) { if (s.level < skillMaxLevel(id)) pool.push({ type: 'skill', id, weight: 3 }); }
    else if (activeCount < MAX_ACTIVE_SLOTS) pool.push({ type: 'skill', id, weight: 2 });
  }
  for (const id in PASSIVES) {
    const lv = game.passives[id] || 0;
    if (lv) { if (lv < PASSIVES[id].maxLevel) pool.push({ type: 'passive', id, weight: 2 }); }
    else if (passiveCount < MAX_PASSIVE_SLOTS) pool.push({ type: 'passive', id, weight: 1.5 });
  }
  // 가중치 랜덤 비복원 추출
  const out = [];
  while (out.length < n && pool.length) {
    let total = pool.reduce((a, o) => a + o.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) { r -= pool[idx].weight; if (r <= 0) break; }
    out.push(pool.splice(Math.min(idx, pool.length - 1), 1)[0]);
  }
  if (!out.length) return FALLBACK_REWARDS.map((f) => ({ type: 'fallback', id: f.id }));
  return out;
}

export function describeUpgrade(game, opt) {
  if (opt.type === 'fallback') {
    const f = FALLBACK_REWARDS.find((x) => x.id === opt.id);
    return { name: f.name, icon: f.icon, tag: '보상', lines: [f.desc], kind: 'fallback' };
  }
  if (opt.type === 'passive') {
    const P = PASSIVES[opt.id];
    const lv = game.passives[opt.id] || 0;
    return { name: P.name, icon: P.icon, tag: lv ? `유물 Lv ${lv + 1}` : '새 유물', lines: [P.desc], kind: 'passive' };
  }
  const S = SKILLS[opt.id];
  const cur = game.skills[opt.id];
  if (!cur) return { name: S.name, icon: S.icon, tag: '새 주문', lines: [S.desc], kind: 'skill' };
  const a = skillLevelData(opt.id, cur.level);
  const b = skillLevelData(opt.id, cur.level + 1);
  const lines = [];
  for (const k in STAT_LABELS) {
    if (a[k] !== undefined && a[k] !== b[k]) lines.push(`${STAT_LABELS[k]} ${a[k]} → ${b[k]}`);
  }
  const note = S.note && S.note[cur.level];
  if (note) lines.push(note);
  return { name: S.name, icon: S.icon, tag: `주문 Lv ${cur.level + 1}`, lines, kind: 'skill' };
}

export function applyUpgrade(game, opt) {
  if (opt.type === 'skill') addSkill(game, opt.id);
  else if (opt.type === 'passive') {
    game.passives[opt.id] = (game.passives[opt.id] || 0) + 1;
    computeMods(game);
    PASSIVES[opt.id].onPick?.(game);
  } else if (opt.id === 'heal') {
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + game.player.maxHp * 0.4);
  } else if (opt.id === 'soul_burst') {
    game.ult = Math.min(100, game.ult + 50);
  }
}
