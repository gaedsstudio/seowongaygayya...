// ───────────────────────────────────────────────────────────────
// Unit: 용사(적) / 마물(아군) / 빙의된 용사 / 타락한 보스 공용 클래스
//   side  'hero' (적) | 'evil' (아군)
//   kind  'hero' | 'minion' | 'possessed' | 'fallen'
// ───────────────────────────────────────────────────────────────
import { animFrames, drawFrame } from '../core/assets.js';

let nextId = 1;

export const TINT = {
  possessed: '#a64dff', // 빙의된 용사 (보라)
  fallen: '#6a1fb8', // 타락한 보스 (짙은 보라)
  hit: '#ffffff',
};

export class Unit {
  constructor({ id, def, side, kind, x, y, hpMul = 1, dmgMul = 1 }) {
    this.uid = nextId++;
    this.defId = id;
    this.def = def;
    this.side = side;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.maxHp = Math.max(1, Math.round(def.hp * hpMul));
    this.hp = this.maxHp;
    this.damage = (def.damage || 0) * dmgMul;
    this.speed = def.speed;
    this.range = def.range ?? 8;
    this.attackCd = def.attackCd ?? 1;
    this.attackT = Math.random() * this.attackCd;
    this.scale = def.scale || 1;
    this.radius = def.radius ?? 5;
    this.sprite = def.sprite;
    this.ai = def.ai || 'melee';
    this.alive = true;
    this.boss = !!def.boss;

    this.flip = false;
    this.animT = Math.random();
    this.moving = false;
    this.hitFlash = 0;
    this.target = null;
    this.retargetT = Math.random() * 0.3;
    this.knockX = 0;
    this.knockY = 0;
    this.spawnT = 0; // >0 이면 소환/부활 연출 중 (행동 안 함)
    this.lifeT = Infinity; // 남은 수명 (일시 빙의)
    this.goal = 'player'; // 용사: 'player' | 'altar'
    this.slotAngle = Math.random() * Math.PI * 2;
    this.slotDist = 18 + Math.random() * 34;
    this.dash = null; // 돌진 상태 (abilities)
    this.abilities = (def.abilities || []).map((a) => ({ ...a, t: a.cd * (0.5 + Math.random() * 0.5) }));
    this.healerCdT = this.attackCd;
  }

  get tint() {
    if (this.hitFlash > 0) return TINT.hit;
    if (this.kind === 'possessed') return TINT.possessed;
    if (this.kind === 'fallen') return TINT.fallen;
    return null;
  }

  draw(ctx) {
    const list = animFrames(this.sprite, this.moving ? 'run' : 'idle');
    if (!list.length) return;
    const fi = Math.floor(this.animT * (this.moving ? 10 : 6)) % list.length;
    let alpha = 1;
    let y = this.y;
    if (this.spawnT > 0) {
      // 땅에서 솟아오르는 연출
      alpha = 1 - this.spawnT / 0.6;
      y += this.spawnT * 12;
    }
    if (this.lifeT < 2) alpha *= 0.5 + 0.5 * Math.abs(Math.sin(this.lifeT * 10));
    const tint = this.tint;
    drawFrame(ctx, list[fi], this.x, y, {
      scale: this.scale,
      flip: this.flip,
      alpha,
      tint,
      tintAlpha: this.hitFlash > 0 ? 0.85 : 0.45,
    });
  }
}
