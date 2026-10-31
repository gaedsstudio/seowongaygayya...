// ───────────────────────────────────────────────────────────────
// 플레이어: 네크로맨서
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { animFrames, drawFrame } from '../core/assets.js';

export class Player {
  constructor(x, y) {
    const P = CONFIG.PLAYER;
    this.side = 'evil';
    this.kind = 'player';
    this.x = x;
    this.y = y;
    this.radius = P.radius;
    this.baseMaxHp = P.maxHp;
    this.maxHp = P.maxHp;
    this.hp = P.maxHp;
    this.baseSpeed = P.speed;
    this.alive = true;
    this.flip = false;
    this.animT = 0;
    this.moving = false;
    this.hitFlash = 0;
    this.faceX = 1;
    this.faceY = 0;
  }

  draw(ctx, time) {
    const list = animFrames(CONFIG.PLAYER.sprite, 'idle');
    const fi = Math.floor(this.animT * (this.moving ? 10 : 6)) % list.length;
    // 발밑 마력 고리
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 4);
    ctx.fillStyle = '#7d3cff';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 1, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const bob = this.moving ? Math.abs(Math.sin(this.animT * 12)) * -1 : 0;
    drawFrame(ctx, list[fi], this.x, this.y + bob, {
      flip: this.flip,
      tint: this.hitFlash > 0 ? '#ff4040' : null,
      tintAlpha: 0.7,
    });
  }
}
