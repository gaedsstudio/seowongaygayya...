// ───────────────────────────────────────────────────────────────
// DOM 오버레이 화면: 타이틀 / 레벨업 / 일시정지 / 결과
// 스타일은 style.css (디자인 토큰은 :root 변수)
// ───────────────────────────────────────────────────────────────
import { frameDataURL } from '../core/assets.js';
import { formatTime } from '../core/util.js';
import { rollUpgrades, describeUpgrade, applyUpgrade } from '../systems/skills.js';
import { clearPresses } from '../core/input.js';

const $ = (sel) => document.querySelector(sel);

export class Screens {
  constructor() {
    this.root = $('#overlay');
    this.onStart = null;
    this.keyHandler = null;
    this.game = null;
  }

  clear() {
    this.root.innerHTML = '';
    this.root.className = '';
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = null;
  }

  setKeys(fn) {
    this.keyHandler = fn;
    window.addEventListener('keydown', fn);
  }

  showTitle() {
    this.clear();
    this.root.className = 'show';
    this.root.innerHTML = `
      <div class="panel title-panel">
        <div class="title-sprites">
          <img src="${frameDataURL('knight_m_idle_anim_f0', 32)}" class="flip" alt="">
          <img src="${frameDataURL('necromancer_anim_f0', 48)}" class="big" alt="">
          <img src="${frameDataURL('skelet_idle_anim_f0', 32)}" alt="">
        </div>
        <h1 class="logo">포제션 디펜스</h1>
        <p class="tagline">용사 파티를 토벌하라. 네가 바로 마왕군의 네크로맨서다.</p>
        <button class="btn primary" id="btn-start">군단 일으키기</button>
        <div class="howto">
          <div><b>이동</b> WASD / 방향키 / 화면 드래그</div>
          <div><b>공격</b> 자동 시전 — 주문은 레벨업으로 고르세요</div>
          <div><b>사령 소생</b> 쓰러진 용사의 시체가 내 마물이 됩니다</div>
          <div><b>대빙의</b> 게이지가 차면 <kbd>SPACE</kbd> — 주변 용사를 지배</div>
          <div><b>방어</b> 중앙의 <span class="hl">사령 제단</span>이 부서지면 패배</div>
          <div><b>승리</b> 10:00에 나타나는 <span class="gold">용사 레온</span>을 쓰러뜨리세요</div>
        </div>
      </div>`;
    $('#btn-start').onclick = () => this.onStart?.();
    this.setKeys((e) => {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.onStart?.(); }
    });
  }

  hide() {
    this.clear();
  }

  showLevelUp(game) {
    this.clear();
    this.root.className = 'show dim';
    const opts = rollUpgrades(game, 3);
    const cards = opts.map((o, i) => {
      const d = describeUpgrade(game, o);
      return `
        <button class="card ${d.kind}" data-i="${i}">
          <span class="key">${i + 1}</span>
          <img src="${frameDataURL(d.icon, 32)}" alt="">
          <span class="card-tag">${d.tag}</span>
          <span class="card-name">${d.name}</span>
          <span class="card-lines">${d.lines.map((l) => `<span>${l}</span>`).join('')}</span>
        </button>`;
    });
    this.root.innerHTML = `
      <div class="panel levelup-panel">
        <h2>LEVEL UP! <small>Lv ${game.level - game.pendingLevelUps + 1}</small></h2>
        <p class="sub">어둠의 힘을 하나 고르세요</p>
        <div class="cards">${cards.join('')}</div>
      </div>`;
    const choose = (i) => {
      const o = opts[i];
      if (!o) return;
      applyUpgrade(game, o);
      game.pendingLevelUps--;
      if (game.pendingLevelUps > 0) this.showLevelUp(game);
      else {
        this.hide();
        clearPresses();
        game.state = 'playing';
      }
    };
    this.root.querySelectorAll('.card').forEach((el) => (el.onclick = () => choose(Number(el.dataset.i))));
    this.setKeys((e) => {
      const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
      if (n !== undefined) choose(n);
    });
  }

  showPause(game, onResume, onQuit) {
    this.clear();
    this.root.className = 'show dim';
    this.root.innerHTML = `
      <div class="panel">
        <h2>일시정지</h2>
        <p class="sub">${formatTime(game.time)} · 처치 ${game.kills} · 군단 ${game.armyCount()}</p>
        <button class="btn primary" id="btn-resume">계속하기</button>
        <button class="btn" id="btn-quit">타이틀로</button>
      </div>`;
    $('#btn-resume').onclick = onResume;
    $('#btn-quit').onclick = onQuit;
    this.setKeys((e) => { if (e.code === 'Escape' || e.code === 'KeyP') onResume(); });
  }

  showResult(game) {
    this.clear();
    this.root.className = 'show dim';
    const v = game.result.victory;
    this.root.innerHTML = `
      <div class="panel result ${v ? 'win' : 'lose'}">
        <h2>${v ? '용사 파티 토벌 성공!' : '패배...'}</h2>
        <p class="sub">${game.result.reason}</p>
        <table class="stats">
          <tr><td>생존 시간</td><td>${formatTime(game.time)}</td></tr>
          <tr><td>레벨</td><td>${game.level}</td></tr>
          <tr><td>처치한 용사</td><td>${game.kills}</td></tr>
          <tr><td>최대 군단 규모</td><td>${game.maxArmy}</td></tr>
          <tr><td>되살린 마물</td><td>${game.stats.raised}</td></tr>
          <tr><td>빙의한 용사</td><td>${game.stats.possessed}</td></tr>
          <tr><td>타락시킨 영웅</td><td>${game.stats.bossesFallen.join(', ') || '-'}</td></tr>
        </table>
        <button class="btn primary" id="btn-retry">다시 하기</button>
        <button class="btn" id="btn-title">타이틀로</button>
      </div>`;
    $('#btn-retry').onclick = () => this.onStart?.();
    $('#btn-title').onclick = () => this.showTitle();
    this.setKeys((e) => { if (e.code === 'Enter') this.onStart?.(); });
  }
}
