// ───────────────────────────────────────────────────────────────
// 캔버스 HUD (화면 좌표계). 색/배치 규칙은 docs/ART_GUIDE.md 의 "UI" 절 참고
// ───────────────────────────────────────────────────────────────
import { CONFIG } from '../config.js';
import { drawFrame, getFrame } from '../core/assets.js';
import { formatTime } from '../core/util.js';
import { SKILLS, PASSIVES } from '../data/skills.js';
import { skillMaxLevel, skillLevelData } from '../systems/skills.js';
import { getStick } from '../core/input.js';

export const UI = {
  font: 'Galmuri11, monospace',
  panel: 'rgba(16, 8, 24, 0.82)',
  border: '#c9a35b', // 금테
  xp: '#3a7bff',
  xpEdge: '#9cc3ff',
  hp: '#e0303a',
  altar: '#a970ff',
  ult: '#c27bff',
  text: '#f4ead5',
  dim: '#9b8fae',
};

function bar(ctx, x, y, w, h, ratio, fill, s) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - s, y - s, w + 2 * s, h + 2 * s);
  ctx.fillStyle = '#1b1022';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, ratio))), h);
}

function text(ctx, str, x, y, size, color, align = 'left', bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${UI.font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 5);
  ctx.strokeStyle = '#0a0410';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function icon(ctx, frame, x, y, size, s) {
  ctx.fillStyle = UI.panel;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = UI.border;
  ctx.lineWidth = s;
  ctx.strokeRect(x + s / 2, y + s / 2, size - s, size - s);
  ctx.save();
  ctx.setTransform(s, 0, 0, s, x + size / 2, y + size / 2);
  const f = getFrame(frame);
  const fit = f ? Math.min(1, (size / s - 4) / Math.max(f.w, f.h)) : 1;
  drawFrame(ctx, frame, 0, 0, { anchorY: 0.5, scale: fit });
  ctx.restore();
}

export function drawHud(ctx, game) {
  const W = game.canvas.width;
  const H = game.canvas.height;
  const s = Math.max(1, Math.round(H / 360)); // UI 픽셀 배율 (720p=2, 1080p=3)
  const P = game.player;

  // ── 경험치 바 (상단 전체) ──
  const xh = 10 * s;
  bar(ctx, 2 * s, 2 * s, W - 4 * s, xh, game.xp / game.xpNext, UI.xp, s);
  ctx.fillStyle = UI.xpEdge;
  ctx.fillRect(2 * s, 2 * s, Math.round((W - 4 * s) * (game.xp / game.xpNext)), s);
  text(ctx, `LV ${game.level}`, W - 8 * s, 2 * s + xh / 2 + s, 9 * s, '#fff', 'right', true);

  // ── 타이머 / 다음 이벤트 ──
  const top = xh + 6 * s;
  text(ctx, formatTime(game.time), W / 2, top + 10 * s, 16 * s, '#fff', 'center', true);
  const ev = game.spawner.nextEvent();
  if (ev && (ev.type === 'boss' || ev.type === 'final')) {
    const left = ev.at - game.time;
    if (left < 60) text(ctx, `${ev.type === 'final' ? '용사 파티' : '보스'} 접근 ${Math.ceil(left)}초`, W / 2, top + 24 * s, 7 * s, '#ffcf4a', 'center');
  }

  // ── 처치 수 / 군단 ──
  text(ctx, `처치 ${game.kills}`, W - 8 * s, top + 6 * s, 8 * s, UI.text, 'right');
  const raise = game.skills.raise_dead;
  const cap = raise ? skillLevelData('raise_dead', raise.level).cap + game.mods.minionCapAdd : 0;
  text(ctx, `군단 ${game.minionCount()}/${cap}  ·  전체 ${game.armyCount()}`, W - 8 * s, top + 17 * s, 8 * s, '#d6a6ff', 'right');

  // ── 스킬/유물 아이콘 ──
  const is = 18 * s;
  let ix = 4 * s;
  for (const id in game.skills) {
    icon(ctx, SKILLS[id].icon, ix, top, is, s);
    const lv = game.skills[id].level;
    text(ctx, lv >= skillMaxLevel(id) ? 'M' : String(lv), ix + is - 3 * s, top + is - 3 * s, 6 * s, lv >= skillMaxLevel(id) ? '#ffd34a' : '#fff', 'center', true);
    ix += is + 2 * s;
  }
  ix = 4 * s;
  for (const id in game.passives) {
    icon(ctx, PASSIVES[id].icon, ix, top + is + 2 * s, is, s);
    text(ctx, String(game.passives[id]), ix + is - 3 * s, top + 2 * is - 1 * s, 6 * s, '#fff', 'center', true);
    ix += is + 2 * s;
  }

  // ── 제단 체력 ──
  const A = game.altar;
  const aw = 110 * s;
  const ay = top + 2 * is + 10 * s;
  const flash = A.underAttackT > 0 && Math.floor(game.time * 6) % 2 === 0;
  text(ctx, '사령 제단', 4 * s, ay, 7 * s, flash ? '#ff6b6b' : UI.dim);
  bar(ctx, 4 * s, ay + 6 * s, aw, 5 * s, A.hp / A.maxHp, flash ? '#ff4a4a' : UI.altar, s);

  // 제단이 화면 밖이면 방향 화살표
  const sp = game.toScreen(A.x, A.y - 16);
  if (A.alive && (sp.x < 0 || sp.x > W || sp.y < 0 || sp.y > H)) {
    const ang = Math.atan2(sp.y - H / 2, sp.x - W / 2);
    const m = 30 * s;
    const ex = Math.max(m, Math.min(W - m, W / 2 + Math.cos(ang) * W));
    const ey = Math.max(m + top, Math.min(H - m, H / 2 + Math.sin(ang) * H));
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(ang);
    ctx.fillStyle = A.underAttackT > 0 ? (flash ? '#ff4a4a' : '#ffffff') : UI.altar;
    ctx.beginPath();
    ctx.moveTo(8 * s, 0);
    ctx.lineTo(-5 * s, -6 * s);
    ctx.lineTo(-5 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (A.underAttackT > 0) text(ctx, '제단 공격받는 중!', ex, ey + 12 * s, 6 * s, '#ff6b6b', 'center');
  }

  // ── 플레이어 체력 (캐릭터 아래, 스크린샷처럼 빨간 바) ──
  const pp = game.toScreen(P.x, P.y);
  const pw = 10 * game.zoom;
  bar(ctx, pp.x - pw / 2, pp.y + 3 * s, pw, 3 * s, P.hp / P.maxHp, UI.hp, 1);

  // ── 보스 체력 (하단) ──
  const bosses = game.units.filter((u) => u.alive && u.boss && u.side === 'hero');
  let by = H - 16 * s;
  for (const b of bosses) {
    const bw = Math.min(W * 0.6, 260 * s);
    bar(ctx, W / 2 - bw / 2, by, bw, 6 * s, b.hp / b.maxHp, '#ffcf4a', s);
    text(ctx, b.def.name, W / 2, by - 6 * s, 8 * s, '#ffe7a6', 'center', true);
    by -= 22 * s;
  }

  // ── 대빙의 게이지 (좌하단) ──
  const uw = 90 * s;
  const uy = H - 14 * s;
  const full = game.ult >= 100;
  bar(ctx, 4 * s, uy, uw, 6 * s, game.ult / 100, full ? (Math.floor(game.time * 4) % 2 ? '#ffffff' : UI.ult) : UI.ult, s);
  text(ctx, full ? '대빙의 준비! [SPACE]' : '대빙의 게이지', 4 * s, uy - 7 * s, 7 * s, full ? '#f3dcff' : UI.dim);

  // ── 배너 ──
  const bd = game.bannerData;
  if (bd) {
    const a = Math.min(1, bd.t * 2, (3.2 - bd.t) * 4);
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(10, 4, 16, 0.7)';
    ctx.fillRect(0, H * 0.28 - 16 * s, W, bd.sub ? 40 * s : 30 * s);
    text(ctx, bd.text, W / 2, H * 0.28, 14 * s, bd.color, 'center', true);
    if (bd.sub) text(ctx, bd.sub, W / 2, H * 0.28 + 16 * s, 7 * s, UI.text, 'center');
    ctx.globalAlpha = 1;
  }

  // ── 가상 조이스틱 ──
  const st = getStick();
  if (st.active) {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(st.ox, st.oy, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#c27bff';
    const dx = st.x - st.ox;
    const dy = st.y - st.oy;
    const d = Math.hypot(dx, dy);
    const k = d > 50 ? 50 / d : 1;
    ctx.beginPath();
    ctx.arc(st.ox + dx * k, st.oy + dy * k, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (CONFIG.DEBUG) {
    text(ctx, `units ${game.units.length} proj ${game.projectiles.length} fx ${game.fx.particles.length} gems ${game.gems.length}`, 4 * s, H - 30 * s, 6 * s, '#0f0');
  }
}
