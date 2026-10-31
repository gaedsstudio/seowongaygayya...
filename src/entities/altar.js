// ───────────────────────────────────────────────────────────────
// 사령 제단: 용사 일부가 노리는 방어 거점. 파괴되면 패배.
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { drawFrame } from '../core/assets.js';

export class Altar {
  constructor(x, y) {
    const A = CONFIG.ALTAR;
    this.side = 'evil';
    this.kind = 'altar';
    this.x = x;
    this.y = y;
    this.radius = A.radius;
    this.baseMaxHp = A.maxHp;
    this.maxHp = A.maxHp;
    this.hp = A.maxHp;
    this.baseRegen = A.regen;
    this.regen = A.regen;
    this.alive = true;
    this.hitFlash = 0;
    this.underAttackT = 0;
    this.attackT = 0;
  }

  /** 바닥 마법진 (엔티티보다 먼저 그림) */
  drawGround(ctx, time) {
    const r = CONFIG.ALTAR.healAuraRadius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#5b1d99';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55 + 0.15 * Math.sin(time * 2);
    ctx.strokeStyle = '#a970ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    // 회전하는 오망성
    ctx.rotate(time * 0.25);
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(a) * r * 0.62;
      const py = Math.sin(a) * r * 0.62;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  draw(ctx, time) {
    const hover = Math.sin(time * 2) * 2;
    // 기둥 받침
    drawFrame(ctx, 'column', this.x, this.y + 4, { scale: 0.75, tint: this.hitFlash > 0 ? '#ff5050' : '#3a1466', tintAlpha: this.hitFlash > 0 ? 0.7 : 0.35 });
    // 떠 있는 해골
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#b26bff';
    ctx.beginPath();
    ctx.arc(this.x, this.y - 40 + hover, 9 + Math.sin(time * 5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawFrame(ctx, 'skull', this.x, this.y - 32 + hover, { scale: 1.3 });
  }
}
