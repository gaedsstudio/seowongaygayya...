// ───────────────────────────────────────────────────────────────
// Game: 한 판의 상태와 시스템 실행 순서를 관리하는 중심 클래스
//   상태(state): 'title' | 'playing' | 'levelup' | 'paused' | 'over'
// ───────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';
import { HEROES } from './data/heroes.js';
import { MINIONS } from './data/minions.js';
import { STARTING_SKILLS } from './data/skills.js';
import { HERO_HP_GROWTH } from './data/waves.js';
import { SpatialGrid } from './core/grid.js';
import { moveAxis, consumePress } from './core/input.js';
import { clamp, compact, pick, weighted } from './core/util.js';
import { Unit } from './entities/unit.js';
import { Player } from './entities/player.js';
import { Altar } from './entities/altar.js';
import { Effects, COLORS } from './systems/effects.js';
import { updateUnits, separate } from './systems/ai.js';
import { updateProjectiles, drawProjectiles, fireProjectile } from './systems/projectiles.js';
import { Spawner } from './systems/spawner.js';
import { addSkill, updateSkills, drawSkillsGround, computeMods } from './systems/skills.js';
import {
  buildFloor, FLOOR_PAD, dropGem, updateGems, drawGems,
  addCorpse, updateCorpses, drawCorpses, updatePools, drawPools,
} from './systems/world.js';
import { createSites, insertSites, updateSites, damageSite, drawSiteMarkers } from './systems/sites.js';
import { drawHud } from './ui/hud.js';

const MASS_POSSESSION = { radius: 120, duration: 15, max: 40 };

export function xpForLevel(l) {
  return Math.floor(6 + 4 * l + 0.8 * Math.pow(l, 1.5));
}

export class Game {
  constructor(canvas, screens) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screens = screens;
    this.state = 'title';
    this.floor = buildFloor();
    this.heroGrid = new SpatialGrid(32);
    this.allyGrid = new SpatialGrid(32);
    this.unitGrid = new SpatialGrid(32);
    this.zoom = 2;
    this.shakeX = 0;
    this.shakeY = 0;
    this.viewW = 640;
    this.viewH = 360;
    this.resize();
    this.reset();
    this.state = 'title';
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.zoom = Math.max(CONFIG.MIN_ZOOM, Math.round(h / CONFIG.VIEW_H));
    this.viewW = w / this.zoom;
    this.viewH = h / this.zoom;
  }

  reset() {
    const cx = CONFIG.ARENA_W / 2;
    const cy = CONFIG.ARENA_H / 2;
    this.time = 0;
    this.altar = new Altar(cx, cy);
    this.player = new Player(cx, cy + 50);
    this.units = [];
    this.projectiles = [];
    this.gems = [];
    this.corpses = [];
    this.pools = [];
    this.pendingFallen = [];
    createSites(this);
    this.fx = new Effects();
    this.spawner = new Spawner();
    this.cam = { x: this.player.x, y: this.player.y };
    this.level = 1;
    this.xp = 0;
    this.xpNext = xpForLevel(1);
    this.pendingLevelUps = 0;
    this.kills = 0;
    this.ult = 0;
    this.maxArmy = 0;
    this.skills = {};
    this.passives = {};
    this.mods = null;
    this.bannerData = null;
    this.raidDir = null;
    this.result = null;
    this.victoryT = -1;
    this.stats = { bossesFallen: [], possessed: 0, raised: 0 };
    for (const id of STARTING_SKILLS) addSkill(this, id);
    computeMods(this);
    this.state = 'playing';
  }

  /** 플레이어 레벨에 따른 군단/제단 성장 배율 */
  levelScale() {
    return 1 + (this.level - 1) * 0.06;
  }

  // ── 조회 도우미 ──────────────────────────────────────────────
  heroCount() {
    let n = 0;
    for (const u of this.units) if (u.alive && u.side === 'hero') n++;
    return n;
  }

  minionCount() {
    let n = 0;
    for (const u of this.units) if (u.alive && u.kind === 'minion') n++;
    return n;
  }

  armyCount() {
    let n = 0;
    for (const u of this.units) if (u.alive && u.side === 'evil') n++;
    return n;
  }

  heroesIn(x, y, r) {
    const out = [];
    for (const o of this.heroGrid.query(x, y, r, this._q || (this._q = []))) {
      if (o.alive && (o.x - x) ** 2 + (o.y - y) ** 2 <= (r + o.radius) ** 2) out.push(o);
    }
    return out;
  }

  /** side 의 적 목록 (반경 r) */
  enemiesOf(side, x, y, r) {
    const grid = side === 'hero' ? this.allyGrid : this.heroGrid;
    const out = [];
    for (const o of grid.query(x, y, r + 12, this._q2 || (this._q2 = []))) {
      if (o.alive && !(o.spawnT > 0) && (o.x - x) ** 2 + (o.y - y) ** 2 <= (r + o.radius) ** 2) out.push(o);
    }
    return out;
  }

  /** side 의 아군 목록 (반경 r) */
  alliesOf(side, x, y, r) {
    const grid = side === 'hero' ? this.heroGrid : this.allyGrid;
    const out = [];
    for (const o of grid.query(x, y, r, this._q3 || (this._q3 = []))) {
      if (o.alive && (o.x - x) ** 2 + (o.y - y) ** 2 <= r * r) out.push(o);
    }
    return out;
  }

  nearestHeroes(x, y, r, n) {
    const list = this.heroesIn(x, y, r);
    list.sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2));
    return list.slice(0, n);
  }

  // ── 생성 ─────────────────────────────────────────────────────
  spawnHero(id, x, y, opts = {}) {
    const def = HEROES[id];
    if (!def) { console.warn('[game] 없는 용사 id:', id); return null; }
    const hpMul = def.boss ? 1 : 1 + this.time * HERO_HP_GROWTH;
    const u = new Unit({ id, def, side: 'hero', kind: 'hero', x, y, hpMul });
    u.goal = opts.goal || (Math.random() < (def.altarBias ?? 0.3) ? 'altar' : 'player');
    this.units.push(u);
    if (def.boss && def.lines) this.fx.bubble(u, pick(def.lines), 4);
    return u;
  }

  raiseMinion(corpse, tiers) {
    const tier = Number(weighted(tiers));
    const ids = Object.keys(MINIONS).filter((k) => MINIONS[k].tier === tier);
    const id = pick(ids);
    const u = new Unit({
      id, def: MINIONS[id], side: 'evil', kind: 'minion', x: corpse.x, y: corpse.y,
      hpMul: this.mods.minionHpMul * this.levelScale(), dmgMul: this.mods.minionDmgMul * this.levelScale(),
    });
    u.spawnT = 0.6;
    this.units.push(u);
    corpse.dead = true;
    this.stats.raised++;
    this.fx.rise(corpse.x, corpse.y, COLORS.evil, 8);
    this.fx.ring(corpse.x, corpse.y - 2, 2, 12, COLORS.evil, 0.4, 1);
    return u;
  }

  /** 살아있는 용사를 아군으로 (temporary=true 면 대빙의: 수명 제한) */
  possess(u, temporary) {
    u.side = 'evil';
    u.kind = 'possessed';
    u.target = null;
    u.retargetT = 0;
    u.goal = null;
    u.maxHp = Math.round(u.maxHp * 1.5 * this.mods.minionHpMul);
    u.hp = u.maxHp;
    u.damage *= 1.5 * this.mods.minionDmgMul;
    u.lifeT = temporary ? MASS_POSSESSION.duration : Infinity;
    this.stats.possessed++;
    this.fx.rise(u.x, u.y - 4, '#d29bff', 6);
  }

  massPossession() {
    const P = this.player;
    const r = MASS_POSSESSION.radius * this.mods.areaMul;
    const list = this.heroesIn(P.x, P.y, r).filter((u) => !u.boss).slice(0, MASS_POSSESSION.max);
    for (const u of list) this.possess(u, true);
    this.ult = 0;
    this.fx.ring(P.x, P.y - 6, 4, r, '#c27bff', 0.6, 4);
    this.fx.ring(P.x, P.y - 6, 4, r * 0.7, '#ffffff', 0.45, 2);
    this.fx.flash('#7a2cff', 0.35);
    this.fx.shake(4, 0.35);
    this.banner(`대빙의! 용사 ${list.length}명 지배`, '#d6a6ff');
  }

  // ── 전투 ─────────────────────────────────────────────────────
  damage(t, amount, opts = {}) {
    if (!t.alive || this.state === 'over') return;
    const dmg = Math.max(1, Math.round(amount));
    if (t.kind === 'player') {
      if (this.godMode) return;
      t.hp -= dmg;
      t.hitFlash = 0.15;
      this.fx.text(t.x, t.y - 26, dmg, COLORS.dmgPlayer, true);
      this.fx.shake(1.5, 0.1);
      if (t.hp <= 0) {
        t.hp = 0;
        t.alive = false;
        this.endRun(false, '네크로맨서가 쓰러졌습니다');
      }
      return;
    }
    if (t.kind === 'altar') {
      t.hp -= Math.max(1, Math.round(dmg * CONFIG.ALTAR.damageTakenMul));
      t.hitFlash = 0.1;
      t.underAttackT = 2.5;
      if (t.hp <= 0) {
        t.hp = 0;
        t.alive = false;
        this.fx.burst(t.x, t.y - 20, '#b26bff', 40, 90, 1);
        this.endRun(false, '사령 제단이 파괴되었습니다');
      }
      return;
    }
    if (t.kind === 'site') { damageSite(this, t, dmg, opts); return; }
    t.hp -= dmg;
    t.hitFlash = 0.08;
    const kr = 1 - (t.def.knockResist || 0);
    if (opts.knockX) t.knockX += opts.knockX * kr;
    if (opts.knockY) t.knockY += opts.knockY * kr;
    if (t.side === 'hero') {
      this.fx.text(t.x, t.y - 18 * t.scale, dmg, opts.fromPlayer ? COLORS.dmgHero : COLORS.dmgMinion, t.boss);
    }
    if (t.hp <= 0) this.kill(t);
  }

  heal(t, amount) {
    if (!t.alive) return;
    t.hp = Math.min(t.maxHp, t.hp + amount);
  }

  healAltar(amount) {
    if (this.altar.alive) this.heal(this.altar, amount);
  }

  kill(u) {
    if (!u.alive) return;
    u.alive = false;
    u.hp = 0;
    if (u.side === 'hero') {
      this.kills++;
      this.ult = Math.min(100, this.ult + (u.boss ? 30 : 0.8));
      const xp = u.def.xp || 1;
      if (u.boss) {
        for (let i = 0; i < 12; i++) dropGem(this, u.x + (Math.random() - 0.5) * 30, u.y + (Math.random() - 0.5) * 20, Math.ceil(xp / 12));
        this.onBossKilled(u);
      } else {
        dropGem(this, u.x, u.y, xp);
        addCorpse(this, u);
      }
      this.fx.burst(u.x, u.y - 6, '#ffffff', 4, 40, 0.3);
      this.fx.burst(u.x, u.y - 6, '#b0203a', 4, 30, 0.4);
    } else {
      if (u.kind === 'possessed') addCorpse(this, u);
      this.fx.burst(u.x, u.y - 6, '#d8d0c0', 6, 40, 0.4);
      this.fx.burst(u.x, u.y - 6, COLORS.evil, 4, 30, 0.4);
    }
  }

  onBossKilled(u) {
    this.fx.shake(5, 0.5);
    this.fx.ring(u.x, u.y - 10, 5, 60, '#ffe08a', 0.6, 3);
    if (u.def.final) {
      this.banner(`${u.def.name} 토벌!`, '#ffe27a', '용사 파티는 무너졌다');
      this.victoryT = 2.5;
      return;
    }
    this.banner(`${u.def.name} 쓰러짐!`, '#d6a6ff', '...그리고 일어선다');
    this.pendingFallen.push({ id: u.defId, x: u.x, y: u.y, t: 1.6 });
  }

  raiseFallen(f) {
    const def = HEROES[f.id];
    const u = new Unit({ id: f.id, def, side: 'evil', kind: 'fallen', x: f.x, y: f.y, hpMul: 0.6 * this.mods.minionHpMul, dmgMul: this.mods.minionDmgMul });
    u.spawnT = 0.6;
    this.units.push(u);
    this.stats.bossesFallen.push(def.name);
    this.fx.rise(f.x, f.y, COLORS.evil, 24, 1.2);
    this.fx.ring(f.x, f.y - 4, 4, 40, COLORS.evil, 0.6, 3);
    if (def.fallenLine) this.fx.bubble(u, def.fallenLine, 4);
  }

  addXp(v) {
    this.xp += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = xpForLevel(this.level);
      this.pendingLevelUps++;
    }
  }

  banner(text, color = '#fff', sub = '') {
    this.bannerData = { text, color, sub, t: 3.2 };
  }

  endRun(victory, reason) {
    if (this.state === 'over') return;
    this.state = 'over';
    this.result = { victory, reason };
    this.screens.showResult(this);
  }

  // ── 메인 업데이트 ────────────────────────────────────────────
  update(dt) {
    if (this.state !== 'playing') return;
    this.time += dt;
    const P = this.player;

    // 그리드 재구성
    this.heroGrid.clear();
    this.allyGrid.clear();
    this.unitGrid.clear();
    this.allyGrid.insert(P);
    if (this.altar.alive) this.allyGrid.insert(this.altar);
    for (const u of this.units) {
      if (!u.alive) continue;
      this.unitGrid.insert(u);
      if (u.spawnT > 0) continue;
      if (u.side === 'hero') this.heroGrid.insert(u);
      else this.allyGrid.insert(u);
    }
    insertSites(this);

    // 플레이어 이동
    const ax = moveAxis();
    const sp = P.baseSpeed * this.mods.speedMul;
    P.x = clamp(P.x + ax.x * sp * dt, 8, CONFIG.ARENA_W - 8);
    P.y = clamp(P.y + ax.y * sp * dt, 14, CONFIG.ARENA_H - 4);
    P.moving = ax.x !== 0 || ax.y !== 0;
    if (P.moving) { P.faceX = ax.x; P.faceY = ax.y; }
    if (ax.x !== 0) P.flip = ax.x < 0;
    P.animT += dt;
    P.hitFlash = Math.max(0, P.hitFlash - dt);

    // 제단 근처 회복
    const A = this.altar;
    const AC = CONFIG.ALTAR;
    if (A.alive) {
      A.hp = Math.min(A.maxHp, A.hp + A.regen * dt);
      A.hitFlash = Math.max(0, A.hitFlash - dt);
      A.underAttackT = Math.max(0, A.underAttackT - dt);
      if ((P.x - A.x) ** 2 + (P.y - A.y) ** 2 < AC.healAuraRadius ** 2) {
        P.hp = Math.min(P.maxHp, P.hp + AC.healAuraPerSec * dt);
      }
      // 제단 자동 방어
      if ((A.attackT -= dt) <= 0) {
        const t = this.nearestHeroes(A.x, A.y, AC.boltRange, 1)[0];
        A.attackT = t ? AC.boltCd : 0.2;
        if (t) {
          fireProjectile(this, {
            kind: 'soul_bolt', x: A.x, y: A.y - 34, angle: Math.atan2(t.y - (A.y - 34), t.x - A.x), side: 'evil',
            damage: AC.boltDamage * this.mods.altarDmgMul * this.levelScale(), homing: t, knock: 2,
          });
        }
      }
    }

    // 대빙의
    if (consumePress('Space') && this.ult >= 100) this.massPossession();

    this.spawner.update(this, dt);
    updateSites(this, dt);
    updateSkills(this, dt);
    updateUnits(this, dt);
    separate(this);
    updateProjectiles(this, dt);
    updatePools(this, dt);
    updateGems(this, dt);
    updateCorpses(this, dt);

    for (const f of this.pendingFallen) if ((f.t -= dt) <= 0) this.raiseFallen(f);
    compact(this.pendingFallen, (f) => f.t > 0);
    compact(this.units, (u) => u.alive);
    this.maxArmy = Math.max(this.maxArmy, this.armyCount());

    this.fx.update(dt);
    if (this.bannerData && (this.bannerData.t -= dt) <= 0) this.bannerData = null;
    if (this.raidDir && (this.raidDir.t -= dt) <= 0) this.raidDir = null;

    // 카메라
    const k = Math.min(1, dt * 8);
    this.cam.x += (P.x - this.cam.x) * k;
    this.cam.y += (P.y - 8 - this.cam.y) * k;

    if (this.victoryT > 0 && (this.victoryT -= dt) <= 0) this.endRun(true, '용사 파티를 토벌했습니다!');

    if (this.pendingLevelUps > 0 && this.state === 'playing') {
      this.state = 'levelup';
      this.screens.showLevelUp(this);
    }
  }

  // ── 그리기 ───────────────────────────────────────────────────
  toScreen = (x, y) => ({
    x: (x - this.cam.x) * this.zoom + this.canvas.width / 2 + this.shakeX,
    y: (y - this.cam.y) * this.zoom + this.canvas.height / 2 + this.shakeY,
  });

  draw() {
    const ctx = this.ctx;
    const z = this.zoom;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#07040b';
    ctx.fillRect(0, 0, W, H);

    const sm = this.fx.shakeMag;
    this.shakeX = sm ? Math.round((Math.random() - 0.5) * sm * 2) * z : 0;
    this.shakeY = sm ? Math.round((Math.random() - 0.5) * sm * 2) * z : 0;
    const ox = Math.round(W / 2 - this.cam.x * z + this.shakeX);
    const oy = Math.round(H / 2 - this.cam.y * z + this.shakeY);
    ctx.setTransform(z, 0, 0, z, ox, oy);

    // 바닥 (보이는 영역만)
    const vx = this.cam.x - this.viewW / 2 - 2;
    const vy = this.cam.y - this.viewH / 2 - 2;
    const sx = Math.max(0, Math.floor(vx + FLOOR_PAD));
    const sy = Math.max(0, Math.floor(vy + FLOOR_PAD));
    const sw = Math.min(this.floor.width - sx, Math.ceil(this.viewW + 4));
    const sh = Math.min(this.floor.height - sy, Math.ceil(this.viewH + 4));
    if (sw > 0 && sh > 0) ctx.drawImage(this.floor, sx, sy, sw, sh, sx - FLOOR_PAD, sy - FLOOR_PAD, sw, sh);

    if (this.altar.alive) this.altar.drawGround(ctx, this.time);
    for (const s of this.sites) if (s.alive) s.drawGround(ctx, this.time);
    drawPools(ctx, this);
    drawSkillsGround(ctx, this);
    drawCorpses(ctx, this);
    drawGems(ctx, this);

    // 그림자 + 정렬된 엔티티
    const ents = [];
    const margin = 40;
    for (const u of this.units) {
      if (Math.abs(u.x - this.cam.x) > this.viewW / 2 + margin || Math.abs(u.y - this.cam.y) > this.viewH / 2 + margin) continue;
      ents.push(u);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (const u of ents) {
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, u.radius * 0.9, u.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 아군 표식 (보라 발광)
    ctx.fillStyle = 'rgba(150, 70, 255, 0.35)';
    for (const u of ents) {
      if (u.side !== 'evil') continue;
      ctx.beginPath();
      ctx.ellipse(u.x, u.y, u.radius * 1.1, u.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ents.push(this.player);
    if (this.altar.alive) ents.push(this.altar);
    for (const s of this.sites) {
      if (s.alive && Math.abs(s.x - this.cam.x) <= this.viewW / 2 + margin && Math.abs(s.y - this.cam.y) <= this.viewH / 2 + 80) ents.push(s);
    }
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw(ctx, this.time);

    drawProjectiles(ctx, this);
    this.fx.drawWorld(ctx);

    // 화면 공간
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 비네트
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(10,0,20,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (this.state === 'title') return; // 타이틀에서는 배경만
    this.fx.drawScreen(ctx, this.toScreen, z);
    drawHud(ctx, this);
    drawSiteMarkers(ctx, this);

    if (this.fx.flashT > 0) {
      ctx.globalAlpha = this.fx.flashT * 1.2;
      ctx.fillStyle = this.fx.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }
}
