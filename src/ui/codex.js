// ───────────────────────────────────────────────────────────────
// 능력 도감: 주문과 유물을 data/skills.js 에서 읽어 목록으로 보여 준다.
// 데이터를 추가하면 도감에도 자동으로 나온다. (화면 전환은 ui/screens.js 의 showCodex)
// ───────────────────────────────────────────────────────────────
import { frameDataURL } from '../core/assets.js';
import { SKILLS, PASSIVES, STAT_LABELS, STARTING_SKILLS } from '../data/skills.js';

export const CODEX_TABS = [
  { id: 'skills', label: '주문' },
  { id: 'passives', label: '유물' },
];

/** 주문 하나: 설명 + 레벨별 수치 표 (STAT_LABELS 에 있는 키만) */
function skillEntry(id) {
  const S = SKILLS[id];
  const keys = Object.keys(STAT_LABELS).filter((k) => S.levels.some((L) => L[k] !== undefined));
  const head = S.levels.map((_, i) => `<th>${i + 1}</th>`).join('');
  const rows = keys.map((k) => {
    const cells = S.levels.map((L, i) => {
      const changed = i > 0 && S.levels[i - 1][k] !== L[k];
      return `<td${changed ? ' class="up"' : ''}>${L[k] ?? '-'}</td>`;
    }).join('');
    return `<tr><th>${STAT_LABELS[k]}</th>${cells}</tr>`;
  }).join('');
  const notes = (S.note || [])
    .map((n, i) => (n ? `<li><b>Lv ${i + 1}</b> ${n}</li>` : ''))
    .join('');
  const tag = STARTING_SKILLS.includes(id) ? '시작 주문' : `최대 Lv ${S.levels.length}`;
  return `
    <article class="codex-entry">
      <img src="${frameDataURL(S.icon, 32)}" alt="">
      <div class="codex-body">
        <div class="codex-name">${S.name} <span class="codex-tag">${tag}</span></div>
        <p class="codex-desc">${S.desc}</p>
        <div class="codex-table-wrap">
          <table class="codex-table"><tr><th>Lv</th>${head}</tr>${rows}</table>
        </div>
        ${notes ? `<ul class="codex-notes">${notes}</ul>` : ''}
      </div>
    </article>`;
}

function passiveEntry(id) {
  const P = PASSIVES[id];
  return `
    <article class="codex-entry passive">
      <img src="${frameDataURL(P.icon, 32)}" alt="">
      <div class="codex-body">
        <div class="codex-name">${P.name} <span class="codex-tag">최대 Lv ${P.maxLevel}</span></div>
        <p class="codex-desc">레벨마다 ${P.desc}</p>
      </div>
    </article>`;
}

export function codexListHTML(tab) {
  if (tab === 'passives') return Object.keys(PASSIVES).map(passiveEntry).join('');
  return Object.keys(SKILLS).map(skillEntry).join('');
}
