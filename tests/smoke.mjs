// 스모크 테스트: 게임을 헤드리스 브라우저로 띄워 몇 분을 빠르게 돌려보고
// 콘솔 에러가 없는지 확인 + 스크린샷 저장.
// 사용법:  node tests/smoke.mjs [초=240] [스크린샷 폴더=tests/out]
// 출력: 30초마다 상태 로그, 콘솔 에러가 하나라도 있으면 exit 1
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../tools/serve.mjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SECONDS = Number(process.argv[2] || 240);
const OUT = process.argv[3] || join(ROOT, 'tests/out');
mkdirSync(OUT, { recursive: true });

const server = await startServer(0);
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });

await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__game);
await page.screenshot({ path: join(OUT, '0-title.png') });
await page.click('#btn-start');

// 시뮬레이션: 무적 + 레벨업 자동 선택(주문 우선) + 간단한 봇 이동
await page.evaluate(() => {
  const g = window.__game;
  g.godMode = true;
  const bot = (window.__bot = { log: [], altarDmg: {}, playerDmg: 0, held: new Set() });
  // 피해 집계 (밸런스 확인용)
  const orig = g.damage.bind(g);
  g.damage = (t, a, o = {}) => {
    if (t.kind === 'altar') {
      const k = (o.source?.defId || '?') + (o.viaProjectile ? '(proj)' : '');
      bot.altarDmg[k] = Math.round((bot.altarDmg[k] || 0) + a);
    }
    if (t.kind === 'player') bot.playerDmg += a;
    return orig(t, a, o);
  };
  const press = (code, on) => {
    if (on && !bot.held.has(code)) { bot.held.add(code); window.dispatchEvent(new KeyboardEvent('keydown', { code })); }
    if (!on && bot.held.has(code)) { bot.held.delete(code); window.dispatchEvent(new KeyboardEvent('keyup', { code })); }
  };
  // 가까운 영혼 보석을 줍고, 제단이 공격받으면 돌아가고, 아니면 제단 주위를 돈다. 붙은 용사는 피한다.
  bot.steer = () => {
    const P = g.player;
    let tx, ty;
    const gem = g.gems.reduce((b, o) => { const d = (o.x - P.x) ** 2 + (o.y - P.y) ** 2; return d < b.d ? { o, d } : b; }, { o: null, d: 160 ** 2 }).o;
    if (g.altar.underAttackT > 0 && (P.x - g.altar.x) ** 2 + (P.y - g.altar.y) ** 2 > 40 ** 2) { tx = g.altar.x; ty = g.altar.y + 20; }
    else if (gem) { tx = gem.x; ty = gem.y; }
    else { const a = g.time * 0.6; tx = g.altar.x + Math.cos(a) * 70; ty = g.altar.y + Math.sin(a) * 70; }
    let vx = tx - P.x, vy = ty - P.y;
    for (const h of g.heroesIn(P.x, P.y, 26)) { vx -= (h.x - P.x) * 6; vy -= (h.y - P.y) * 6; }
    press('KeyD', vx > 4); press('KeyA', vx < -4); press('KeyS', vy > 4); press('KeyW', vy < -4);
  };
  bot.run = (sec) => {
    const t0 = performance.now();
    for (let t = 0; t < sec * 60; t++) {
      if (t % 6 === 0) bot.steer();
      if (g.state === 'levelup') (document.querySelector('.card.skill') || document.querySelector('.card'))?.click();
      if (g.ult >= 100) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); }
      g.update(1 / 60);
      if (g.state === 'over') break;
    }
    const ms = (performance.now() - t0) / (sec * 60);
    bot.log.push(`${Math.round(g.time)}s lv${g.level} kills${g.kills} heroes${g.heroCount()} army${g.armyCount()} altar${Math.round(g.altar.hp)} playerDmgTaken${Math.round(bot.playerDmg)} update${ms.toFixed(2)}ms`);
    return g.state;
  };
});
const SHOTS = new Set([90, 180, 330, 480, 600]);
for (let t = 30; t <= SECONDS; t += 30) {
  const st = await page.evaluate(() => window.__bot.run(30));
  if (SHOTS.has(t) && st === 'playing') {
    await page.evaluate(() => window.__game.draw());
    await page.screenshot({ path: join(OUT, `t${t}.png`) });
  }
  if (st === 'over') break;
}
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, 'end.png') });
const report = await page.evaluate(() => {
  const g = window.__game;
  const b = window.__bot;
  b.log.push('altar dmg by source: ' + JSON.stringify(b.altarDmg));
  return { log: b.log, state: g.state, result: g.result, skills: Object.fromEntries(Object.entries(g.skills).map(([k, v]) => [k, v.level])), passives: g.passives };
});

console.log(report.log.join('\n'));
console.log('state:', report.state, report.result || '');
console.log('skills:', JSON.stringify(report.skills), 'passives:', JSON.stringify(report.passives));
if (errors.length) {
  console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
}
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
