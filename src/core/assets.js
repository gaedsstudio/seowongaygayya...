// ───────────────────────────────────────────────────────────────
// 스프라이트 아틀라스 로더 + 그리기 도우미
//  - 프레임 이름은 assets/sprites/atlas.json 기준 (tools/build_atlas.py 로 생성)
//  - 애니메이션은 "<base>_run_anim_f0..fN" / "<base>_idle_anim_f0..fN" / "<base>_anim_f0..fN" 규칙
// ───────────────────────────────────────────────────────────────

const IMAGES = {
  dungeon: 'assets/sprites/dungeon_tileset_ii.png',
};

const images = {};
let frames = {};
const animCache = new Map();
const tintCache = new Map();
const warned = new Set();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패: ' + src));
    img.src = src;
  });
}

export async function loadAssets() {
  const entries = Object.entries(IMAGES);
  const loaded = await Promise.all(entries.map(([, src]) => loadImage(src)));
  entries.forEach(([key], i) => (images[key] = loaded[i]));
  const json = await fetch('assets/sprites/atlas.json').then((r) => r.json());
  frames = json.frames;
  try {
    await Promise.all([
      document.fonts.load('16px Galmuri11'),
      document.fonts.load('bold 16px Galmuri11'),
    ]);
  } catch (_) { /* 폰트 실패해도 진행 */ }
}

export function hasFrame(name) {
  return !!frames[name];
}

export function getFrame(name) {
  const f = frames[name];
  if (!f && !warned.has(name)) {
    warned.add(name);
    console.warn('[assets] 없는 프레임:', name);
  }
  return f;
}

/** base 이름과 상태(run/idle)로 프레임 이름 배열을 돌려준다. */
export function animFrames(base, state = 'run') {
  const key = base + '|' + state;
  if (animCache.has(key)) return animCache.get(key);
  const candidates = [`${base}_${state}_anim`, `${base}_run_anim`, `${base}_idle_anim`, `${base}_anim`];
  let list = [];
  for (const c of candidates) {
    for (let i = 0; i < 16 && frames[`${c}_f${i}`]; i++) list.push(`${c}_f${i}`);
    if (list.length) break;
  }
  if (!list.length && frames[base]) list = [base];
  if (!list.length) getFrame(base); // 경고 출력
  animCache.set(key, list);
  return list;
}

function tinted(name, color, alpha) {
  const key = name + '|' + color + '|' + alpha;
  let c = tintCache.get(key);
  if (c) return c;
  const f = frames[name];
  c = document.createElement('canvas');
  c.width = f.w;
  c.height = f.h;
  const g = c.getContext('2d');
  g.drawImage(images[f.img], f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = alpha;
  g.fillStyle = color;
  g.fillRect(0, 0, f.w, f.h);
  tintCache.set(key, c);
  return c;
}

/**
 * 프레임 그리기. (x, y) = 앵커 위치 (기본: 발밑 중앙)
 * opts: { scale, flip, rot, alpha, tint, tintAlpha, anchorX, anchorY }
 */
export function drawFrame(ctx, name, x, y, opts = {}) {
  const f = frames[name];
  if (!f) { getFrame(name); return; }
  const sc = opts.scale || 1;
  const w = f.w * sc;
  const h = f.h * sc;
  const ax = opts.anchorX ?? 0.5;
  const ay = opts.anchorY ?? 1;
  const prevAlpha = ctx.globalAlpha;
  if (opts.alpha !== undefined) ctx.globalAlpha = prevAlpha * opts.alpha;
  const simple = !opts.rot && !opts.flip;
  if (!simple) {
    ctx.save();
    ctx.translate(x, y);
    if (opts.rot) ctx.rotate(opts.rot);
    if (opts.flip) ctx.scale(-1, 1);
  }
  const dx = simple ? Math.round(x - w * ax) : -w * ax;
  const dy = simple ? Math.round(y - h * ay) : -h * ay;
  if (opts.tint) {
    ctx.drawImage(tinted(name, opts.tint, opts.tintAlpha ?? 1), 0, 0, f.w, f.h, dx, dy, w, h);
  } else {
    ctx.drawImage(images[f.img], f.x, f.y, f.w, f.h, dx, dy, w, h);
  }
  if (!simple) ctx.restore();
  ctx.globalAlpha = prevAlpha;
}

/** UI 아이콘용: 프레임을 담은 작은 캔버스 dataURL (DOM 에 쓰기) */
const iconCache = new Map();
export function frameDataURL(name, size = 32) {
  const key = name + '|' + size;
  if (iconCache.has(key)) return iconCache.get(key);
  const f = frames[name];
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  if (f) {
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const s = Math.max(1, Math.floor(Math.min(size / f.w, size / f.h)));
    g.drawImage(images[f.img], f.x, f.y, f.w, f.h, (size - f.w * s) / 2, (size - f.h * s) / 2, f.w * s, f.h * s);
  }
  const url = c.toDataURL();
  iconCache.set(key, url);
  return url;
}

export function getImage(key) {
  return images[key];
}
