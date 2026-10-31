// ───────────────────────────────────────────────────────────────
// 입력: 키보드(WASD/방향키) + 터치/마우스 드래그 가상 조이스틱
// ───────────────────────────────────────────────────────────────
const keys = new Set();
const pressed = new Set(); // 이번 프레임에 눌린 키 (consume 방식)

const stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    if (stick.active) return;
    stick.active = true;
    stick.id = e.pointerId;
    stick.ox = stick.x = e.clientX;
    stick.oy = stick.y = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (stick.active && e.pointerId === stick.id) {
      stick.x = e.clientX;
      stick.y = e.clientY;
    }
  });
  const end = (e) => {
    if (e.pointerId === stick.id) stick.active = false;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}

/** 이동 입력 벡터 (길이 0~1) */
export function moveAxis() {
  let x = 0;
  let y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  if (stick.active) {
    const dx = stick.x - stick.ox;
    const dy = stick.y - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > 8) {
      const m = Math.min(1, d / 50);
      x = (dx / d) * m;
      y = (dy / d) * m;
    }
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

/** 이번 프레임에 눌렸으면 true 를 돌려주고 소비 */
export function consumePress(...codes) {
  for (const c of codes) {
    if (pressed.has(c)) {
      pressed.delete(c);
      return true;
    }
  }
  return false;
}

export function clearPresses() {
  pressed.clear();
}

/** 화면 버튼 등에서 키 입력을 흉내낼 때 */
export function virtualPress(code) {
  pressed.add(code);
}

export function getStick() {
  return stick;
}
