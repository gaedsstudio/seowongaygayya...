// ───────────────────────────────────────────────────────────────
// 진입점: 에셋 로드 → 화면/입력 초기화 → 고정 스텝 게임 루프
// ───────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';
import { loadAssets } from './core/assets.js';
import { initInput, consumePress, clearPresses, virtualPress } from './core/input.js';
import { Game } from './game.js';
import { Screens } from './ui/screens.js';

async function boot() {
  const canvas = document.getElementById('game');
  await loadAssets();
  initInput(canvas);
  const screens = new Screens();
  const game = new Game(canvas, screens);
  window.__game = game; // 디버그/테스트용 (콘솔에서 __game 으로 접근)

  screens.onStart = () => {
    game.reset();
    screens.hide();
    clearPresses();
  };
  screens.showTitle();

  const pause = () => {
    game.state = 'paused';
    screens.showPause(
      game,
      () => { screens.hide(); clearPresses(); game.state = 'playing'; },
      () => { game.state = 'title'; screens.showTitle(); },
    );
  };
  window.addEventListener('resize', () => game.resize());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'playing') pause();
  });

  const ultBtn = document.getElementById('ult-btn');
  ultBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); virtualPress('Space'); });

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (game.state === 'playing' && consumePress('Escape', 'KeyP')) pause();
    while (acc >= CONFIG.STEP) {
      game.update(CONFIG.STEP);
      acc -= CONFIG.STEP;
    }
    game.draw();
    ultBtn.classList.toggle('playing', game.state === 'playing');
    ultBtn.classList.toggle('ready', game.ult >= 100);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.getElementById('loading')?.remove();
}

boot().catch((e) => {
  console.error(e);
  const el = document.getElementById('loading');
  if (el) el.textContent = '로드 실패: ' + e.message + ' (로컬 서버로 실행했는지 확인하세요: README 참고)';
});
