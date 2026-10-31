// ───────────────────────────────────────────────────────────────
// 시각 효과: 파티클, 원형 충격파, 데미지 숫자, 대사 말풍선, 화면 흔들림
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { rand, compact } from '../core/util.js';

export const COLORS = {
  dmgHero: '#ff8f80', // 용사가 받는 피해 (스크린샷처럼 붉은 숫자)
  dmgMinion: '#d9b3ff', // 군단이 준 피해
  dmgPlayer: '#ff3b3b', // 플레이어가 받은 피해
  heal: '#7dff9a',
  soul: '#5ac8ff',
  evil: '#a970ff',
  holy: '#ffe08a',
};

export class Effects {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.bubbles = [];
    this.shakeT = 0;
    this.shakeMag = 0;
    this.flashT = 0;
    this.flashColor = '#fff';
  }

  burst(x, y, color, n = 8, speed = 40, life = 0.5, size = 1.5) {
    if (this.particles.length > CONFIG.MAX_PARTICLES) n = Math.min(n, 2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life, max: life, color, size, grav: 0 });
    }
  }

  rise(x, y, color, n = 6, life = 0.8) {
    for (let i = 0; i < n; i++) {
      this.particles.push({ x: x + rand(-6, 6), y: y + rand(-4, 2), vx: rand(-6, 6), vy: rand(-30, -12), life, max: life, color, size: rand(1, 2), grav: 0 });
    }
  }

  ring(x, y, r0, r1, color, life = 0.35, width = 2) {
    this.rings.push({ x, y, r0, r1, color, life, max: life, width });
  }

  text(x, y, value, color, big = false) {
    if (this.texts.length >= CONFIG.MAX_DAMAGE_TEXTS) this.texts.shift();
    this.texts.push({ x: x + rand(-4, 4), y, text: String(value), color, life: 0.7, max: 0.7, big });
  }

  bubble(unit, text, life = 3.5) {
    this.bubbles.push({ unit, text, life, max: life });
  }

  shake(mag = 3, t = 0.25) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeT = Math.max(this.shakeT, t);
  }

  flash(color = '#fff', t = 0.25) {
    this.flashColor = color;
    this.flashT = t;
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
    compact(this.particles, (p) => p.life > 0);
    for (const r of this.rings) r.life -= dt;
    compact(this.rings, (r) => r.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 18 * dt;
    }
    compact(this.texts, (t) => t.life > 0);
    for (const b of this.bubbles) b.life -= dt;
    compact(this.bubbles, (b) => b.life > 0 && b.unit.alive);
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.shakeT === 0) this.shakeMag = 0;
    this.flashT = Math.max(0, this.flashT - dt);
  }

  /** 월드 좌표계에서 그림 */
  drawWorld(ctx) {
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = r.life / r.max;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /** 화면 좌표계에서 그림 (toScreen: 월드→화면 변환 함수) */
  drawScreen(ctx, toScreen, zoom) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const t of this.texts) {
      const s = toScreen(t.x, t.y);
      const size = (t.big ? 8 : 6) * zoom;
      ctx.font = `bold ${size}px Galmuri11, monospace`;
      ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2);
      ctx.lineWidth = Math.max(2, zoom);
      ctx.strokeStyle = '#1a0a10';
      ctx.strokeText(t.text, s.x, s.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, s.x, s.y);
    }
    ctx.globalAlpha = 1;
    for (const b of this.bubbles) {
      const u = b.unit;
      const s = toScreen(u.x, u.y - 30 * (u.scale || 1) - 6);
      ctx.font = `${5.5 * zoom}px Galmuri11, monospace`;
      const w = ctx.measureText(b.text).width + 6 * zoom;
      const h = 9 * zoom;
      s.x = Math.max(w / 2 + 4, Math.min(ctx.canvas.width - w / 2 - 4, s.x)); // 화면 밖으로 잘리지 않게
      s.y = Math.max(h + 40, s.y);
      ctx.globalAlpha = Math.min(1, b.life * 2);
      ctx.fillStyle = 'rgba(20, 12, 30, 0.88)';
      ctx.strokeStyle = '#f2d27a';
      ctx.lineWidth = 2;
      ctx.fillRect(s.x - w / 2, s.y - h, w, h);
      ctx.strokeRect(s.x - w / 2, s.y - h, w, h);
      ctx.fillStyle = '#fff6da';
      ctx.fillText(b.text, s.x, s.y - h / 2);
    }
    ctx.globalAlpha = 1;
  }
}
