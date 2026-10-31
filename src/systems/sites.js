// ───────────────────────────────────────────────────────────────
// 유적(맵 오브젝트): 점령(오벨리스크) / 파괴(성광 첨탑) / 획득(보물고)
// 수치와 배치는 data/sites.js
//
// 성광 첨탑은 side 'hero' 로 heroGrid 에 들어가서, 주문, 발사체, 군단이 용사처럼 공격한다.
// 피해는 game.damage → damageSite 로 넘어온다. boss: true 라서 빙의 대상에서 빠진다.
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { SITE_TYPES, SITE_LAYOUT } from '../data/sites.js';
import { drawFrame } from '../core/assets.js';
import { weighted, rand } from '../core/util.js';
import { COLORS } from './effects.js';
import { fireProjectile } from './projectiles.js';
import { dropGem } from './world.js';

// ART_GUIDE 토큰 값 (--dim, --gold, --danger)
const DIM = '#9b8fae';
const GOLD = '#ffcf4a';
const DANGER = '#ff5b5b';

let nextSiteId = 1;

export class Site {
  constructor(type, x, y) {
    const def = SITE_TYPES[type];
    this.uid = -nextSiteId++; // 유닛 uid 와 겹치지 않게 음수
    this.type = type;
    this.def = def;
    this.x = x;
    this.y = y;
    this.radius = def.radius ?? 8;
    this.scale = 1;
    this.alive = true;
    this.hitFlash = 0;
    this.done = false; // 점령 완료 / 파괴됨 / 열림
    this.t = 0; // 행동 타이머
    this.t2 = 0;
    if (def.kind === 'destroy') {
      this.side = 'hero';
      this.kind = 'site';
      this.boss = true;
      this.maxHp = def.hp;
      this.hp = def.hp;
      this.awake = false;
    } else {
      this.side = 'neutral';
      this.kind = 'site';
      this.progress = 0; // 점령 진행도(초)
      this.guards = null; // 보물고 수호대
    }
  }

  get color() {
    if (this.def.kind === 'capture') return this.done ? COLORS.evil : DIM;
    if (this.def.kind === 'destroy') return COLORS.holy;
    return this.guards && !this.done ? DANGER : GOLD;
  }

  /** 바닥 표시 (엔티티보다 먼저 그림) */
  drawGround(ctx, time) {
    const d = this.def;
    ctx.save();
    ctx.lineWidth = 1;
    if (d.kind === 'capture') {
      const r = this.done ? d.boltRange : d.captureRadius;
      ctx.globalAlpha = this.done ? 0.1 : 0.14;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(time * 2);
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.stroke();
      if (!this.done && this.progress > 0) {
        // 점령 진행 호
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COLORS.evil;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, d.captureRadius, -Math.PI / 2, -Math.PI / 2 + (this.progress / d.captureTime) * Math.PI * 2);
        ctx.stroke();
      }
    } else if (d.kind === 'destroy') {
      ctx.globalAlpha = this.awake ? 0.5 + 0.2 * Math.sin(time * 4) : 0.25;
      ctx.strokeStyle = COLORS.holy;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, d.healRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (!this.done) {
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 3);
      ctx.strokeStyle = this.color;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.guards ? d.openRadius : d.triggerRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw(ctx, time) {
    const d = this.def;
    const flash = this.hitFlash > 0;
    if (d.kind === 'capture') {
      drawFrame(ctx, 'column', this.x, this.y + 4, { scale: 0.75, tint: this.done ? '#3a1466' : '#2b2233', tintAlpha: 0.45 });
      const hover = Math.sin(time * 2 + this.uid) * 1.5;
      ctx.save();
      ctx.globalAlpha = this.done ? 0.55 : 0.25;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 40 + hover, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (d.kind === 'destroy') {
      drawFrame(ctx, 'column', this.x, this.y + 4, { tint: flash ? '#ffffff' : COLORS.holy, tintAlpha: flash ? 0.85 : 0.35 });
      const hover = Math.sin(time * 3) * 2;
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = COLORS.holy;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 54 + hover, 6 + Math.sin(time * 6), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (this.hp < this.maxHp) {
        // 체력바
        const w = 28;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(this.x - w / 2 - 1, this.y - 66, w + 2, 4);
        ctx.fillStyle = GOLD;
        ctx.fillRect(this.x - w / 2, this.y - 65, w * (this.hp / this.maxHp), 2);
      }
    } else {
      const frame = this.done ? 'chest_empty_open_anim_f2' : 'chest_full_open_anim_f0';
      drawFrame(ctx, frame, this.x, this.y, { scale: 2 });
    }
  }
}

export function createSites(game) {
  game.sites = SITE_LAYOUT.map((s) => new Site(s.type, s.x * CONFIG.ARENA_W, s.y * CONFIG.ARENA_H));
}

/** 성광 첨탑처럼 공격받을 수 있는 유적을 그리드에 넣는다 (game.update 의 그리드 재구성에서 호출) */
export function insertSites(game) {
  for (const s of game.sites) if (s.alive && s.side === 'hero') game.heroGrid.insert(s);
}

export function updateSites(game, dt) {
  for (const s of game.sites) {
    if (!s.alive) continue;
    s.hitFlash = Math.max(0, s.hitFlash - dt);
    if (s.def.kind === 'capture') updateObelisk(game, s, dt);
    else if (s.def.kind === 'destroy') updateSpire(game, s, dt);
    else updateVault(game, s, dt);
  }
}

const near = (a, b, r) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= r * r;

function updateObelisk(game, s, dt) {
  const d = s.def;
  const P = game.player;
  if (!s.done) {
    const inside = near(P, s, d.captureRadius);
    const contested = inside && game.heroesIn(s.x, s.y, d.captureRadius).length > 0;
    if (inside && !contested) s.progress += dt;
    else if (!inside) s.progress = Math.max(0, s.progress - d.decayPerSec * dt);
    if (s.progress >= d.captureTime) {
      s.done = true;
      giveReward(game, s, d.reward);
      game.fx.ring(s.x, s.y - 6, 4, d.boltRange, COLORS.evil, 0.6, 3);
      game.fx.rise(s.x, s.y, COLORS.evil, 16);
      game.banner(`${d.name} 점령!`, COLORS.evil, '주변 용사에게 영혼 화살을 쏩니다');
    }
    return;
  }
  // 점령한 오벨리스크: 회복 + 자동 영혼 화살
  if (near(P, s, d.healRadius)) P.hp = Math.min(P.maxHp, P.hp + d.healPerSec * dt);
  if ((s.t -= dt) <= 0) {
    const t = game.nearestHeroes(s.x, s.y, d.boltRange, 1)[0];
    s.t = t ? d.boltCd : 0.25;
    if (t) {
      fireProjectile(game, {
        kind: 'soul_bolt', x: s.x, y: s.y - 40, angle: Math.atan2(t.y - (s.y - 40), t.x - s.x), side: 'evil',
        damage: d.boltDamage * game.mods.altarDmgMul * game.levelScale(), homing: t, knock: 2,
      });
    }
  }
}

function updateSpire(game, s, dt) {
  const d = s.def;
  const wasAwake = s.awake;
  s.awake = near(game.player, s, d.activeRadius);
  if (s.awake && !wasAwake && !s.warned) {
    s.warned = true;
    game.banner(`${d.name}이 깨어났다!`, COLORS.holy, '부수면 큰 보상을 얻습니다');
  }
  if (!s.awake) return;
  if ((s.t -= dt) <= 0) {
    s.t = d.summonCd;
    const room = CONFIG.MAX_HEROES - game.heroCount();
    for (let i = 0; i < Math.min(d.summonCount, room); i++) {
      const a = Math.random() * Math.PI * 2;
      game.spawnHero(weighted(d.summonMix), s.x + Math.cos(a) * 26, s.y + Math.sin(a) * 18 + 10, { goal: 'player' });
    }
    game.fx.ring(s.x, s.y - 10, 6, 36, COLORS.holy, 0.5);
  }
  if ((s.t2 -= dt) <= 0) {
    s.t2 = d.healCd;
    for (const o of game.alliesOf('hero', s.x, s.y, d.healRadius)) if (o !== s) game.heal(o, d.healAmount);
    game.fx.ring(s.x, s.y - 6, 6, d.healRadius, COLORS.heal, 0.4, 1);
  }
}

function updateVault(game, s, dt) {
  const d = s.def;
  const P = game.player;
  if (s.done) return;
  if (!s.guards) {
    if (!near(P, s, d.triggerRadius)) return;
    s.guards = [];
    for (const id in d.guards) {
      for (let i = 0; i < d.guards[id]; i++) {
        const a = Math.random() * Math.PI * 2;
        const u = game.spawnHero(id, s.x + Math.cos(a) * rand(20, 34), s.y + Math.sin(a) * rand(14, 24), { goal: 'player' });
        if (!u) continue;
        u.maxHp = Math.round(u.maxHp * d.guardHpMul);
        u.hp = u.maxHp;
        u.damage *= d.guardDmgMul;
        s.guards.push(u);
      }
    }
    game.fx.ring(s.x, s.y - 6, 4, d.triggerRadius, DANGER, 0.5, 2);
    game.banner('보물고의 수호대가 깨어났다!', DANGER, '정예 수호대를 모두 쓰러뜨리세요');
    return;
  }
  // 수호대가 모두 죽거나 빙의되면 열 수 있음
  const guarded = s.guards.some((u) => u.alive && u.side === 'hero');
  if (!guarded && near(P, s, d.openRadius)) {
    s.done = true;
    giveReward(game, s, d.reward);
    game.fx.burst(s.x, s.y - 8, GOLD, 24, 60, 0.8);
    game.banner(`${d.name} 개방!`, GOLD, '보물이 힘을 줍니다');
  }
}

/** game.damage 에서 kind 'site' 대상일 때 호출 */
export function damageSite(game, s, dmg, opts) {
  if (s.def.kind !== 'destroy') return;
  s.hp -= dmg;
  s.hitFlash = 0.08;
  game.fx.text(s.x, s.y - 30, dmg, opts.fromPlayer ? COLORS.dmgHero : COLORS.dmgMinion, false);
  if (s.hp > 0) return;
  s.hp = 0;
  s.alive = false;
  s.done = true;
  giveReward(game, s, s.def.reward);
  game.fx.shake(4, 0.4);
  game.fx.burst(s.x, s.y - 30, COLORS.holy, 30, 80, 0.8);
  game.fx.ring(s.x, s.y - 10, 5, 70, COLORS.holy, 0.6, 3);
  game.banner(`${s.def.name} 파괴!`, GOLD, '영혼이 쏟아집니다');
}

function giveReward(game, s, r) {
  if (!r) return;
  if (r.xp) {
    const n = r.gems || 1;
    for (let i = 0; i < n; i++) dropGem(game, s.x + rand(-20, 20), s.y + rand(-12, 12), Math.ceil(r.xp / n));
  }
  if (r.ult) game.ult = Math.min(100, game.ult + r.ult);
  if (r.heal) game.heal(game.player, r.heal);
  if (r.levelUps) game.pendingLevelUps += r.levelUps;
  game.stats.sites = (game.stats.sites || 0) + 1;
}

/** 화면 밖에 있는 미완료 유적을 화면 가장자리에 작은 마름모로 표시 */
export function drawSiteMarkers(ctx, game) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const s = Math.max(1, Math.round(H / 360)); // hud.js 와 같은 UI 배율
  const m = 12 * s;
  for (const site of game.sites) {
    if (site.done) continue;
    const p = game.toScreen(site.x, site.y - 16);
    if (p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H) continue;
    const x = Math.max(m, Math.min(W - m, p.x));
    const y = Math.max(m, Math.min(H - m, p.y));
    const r = 5 * s;
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#07040b';
    ctx.lineWidth = s;
    ctx.fillStyle = site.color;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
