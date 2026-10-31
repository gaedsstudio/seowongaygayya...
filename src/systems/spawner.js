// ───────────────────────────────────────────────────────────────
// 웨이브 디렉터: data/waves.js 를 읽어 시간에 따라 용사를 보냄
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { SPAWN_PHASES, EVENTS } from '../data/waves.js';
import { HEROES } from '../data/heroes.js';
import { weighted, clamp, rand } from '../core/util.js';

export class Spawner {
  constructor() {
    this.t = 1.5;
    this.eventIdx = 0;
  }

  phase(time) {
    let p = SPAWN_PHASES[0];
    for (const ph of SPAWN_PHASES) if (ph.from <= time) p = ph;
    return p;
  }

  /** 다음 이벤트 (HUD 표시용) */
  nextEvent() {
    return EVENTS[this.eventIdx] || null;
  }

  update(game, dt) {
    const ph = this.phase(game.time);
    this.t -= dt;
    if (this.t <= 0) {
      this.t = ph.interval;
      const room = Math.min(ph.max, CONFIG.MAX_HEROES) - game.heroCount();
      for (let i = 0; i < Math.min(ph.batch, room); i++) {
        const p = this.offscreenPos(game);
        game.spawnHero(weighted(ph.mix), p.x, p.y);
      }
    }
    while (this.eventIdx < EVENTS.length && EVENTS[this.eventIdx].at <= game.time) {
      this.runEvent(game, EVENTS[this.eventIdx++]);
    }
  }

  /** 화면 밖, 아레나 안의 위치 */
  offscreenPos(game, extra = 20) {
    const P = game.player;
    const hw = game.viewW / 2;
    const hh = game.viewH / 2;
    const R = Math.hypot(hw, hh) + extra;
    let x = 0;
    let y = 0;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      x = clamp(P.x + Math.cos(a) * R, 16, CONFIG.ARENA_W - 16);
      y = clamp(P.y + Math.sin(a) * R, 24, CONFIG.ARENA_H - 16);
      if (Math.abs(x - P.x) > hw + 8 || Math.abs(y - P.y) > hh + 8) break;
    }
    return { x, y };
  }

  runEvent(game, ev) {
    const P = game.player;
    switch (ev.type) {
      case 'swarm': {
        const R = Math.max(game.viewW, game.viewH) * 0.55;
        for (let i = 0; i < ev.count; i++) {
          const a = (i / ev.count) * Math.PI * 2;
          game.spawnHero(ev.id, clamp(P.x + Math.cos(a) * R, 16, CONFIG.ARENA_W - 16), clamp(P.y + Math.sin(a) * R, 24, CONFIG.ARENA_H - 16), { goal: 'player' });
        }
        game.banner(ev.msg || '포위!', '#ffd36b');
        break;
      }
      case 'raid': {
        const A = game.altar;
        const a = Math.random() * Math.PI * 2;
        const cx = clamp(A.x + Math.cos(a) * 700, 30, CONFIG.ARENA_W - 30);
        const cy = clamp(A.y + Math.sin(a) * 700, 30, CONFIG.ARENA_H - 30);
        for (let i = 0; i < ev.count; i++) {
          game.spawnHero(ev.id, cx + rand(-30, 30), cy + rand(-30, 30), { goal: 'altar' });
        }
        game.banner(ev.msg || '제단 습격!', '#ff6b6b');
        game.raidDir = { x: cx, y: cy, t: 6 };
        break;
      }
      case 'boss': {
        const p = this.offscreenPos(game, 10);
        game.spawnHero(ev.id, p.x, p.y, { goal: 'player' });
        const d = HEROES[ev.id];
        game.banner(`${d.name} 등장!`, '#ffcf4a', d.title);
        break;
      }
      case 'final': {
        ev.ids.forEach((id, i) => {
          const p = this.offscreenPos(game, 10 + i * 20);
          game.spawnHero(id, p.x, p.y, { goal: 'player' });
        });
        game.banner(ev.msg || '최종 결전!', '#ffe27a', '용사 레온을 쓰러뜨려라');
        break;
      }
      default:
        console.warn('[spawner] 알 수 없는 이벤트', ev);
    }
  }
}
