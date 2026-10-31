// 데이터 검증: 브라우저 없이 src/data/* 의 참조가 모두 올바른지 확인합니다.
//   - 스프라이트/아이콘 프레임이 아틀라스에 있는지
//   - 웨이브/이벤트/소환이 존재하는 용사 id 를 가리키는지
//   - 발사체, 보스 패턴, 스킬 구현이 존재하는지
// 사용법: node tests/validate-data.mjs
import { readFileSync } from 'node:fs';
import { HEROES } from '../src/data/heroes.js';
import { MINIONS } from '../src/data/minions.js';
import { SKILLS, PASSIVES, STARTING_SKILLS, FALLBACK_REWARDS } from '../src/data/skills.js';
import { SPAWN_PHASES, EVENTS } from '../src/data/waves.js';
import { PROJECTILES } from '../src/data/projectiles.js';
import { SITE_TYPES, SITE_LAYOUT } from '../src/data/sites.js';
import { ABILITIES } from '../src/systems/abilities.js';
import { SKILL_IMPL } from '../src/systems/skills.js';
import { CONFIG } from '../src/config.js';

const atlas = JSON.parse(readFileSync(new URL('../assets/sprites/atlas.json', import.meta.url))).frames;
const errors = [];
const err = (m) => errors.push(m);

const hasAnim = (base) =>
  ['_run_anim_f0', '_idle_anim_f0', '_anim_f0'].some((s) => atlas[base + s]) || !!atlas[base];
const checkFrame = (name, where) => { if (!atlas[name]) err(`${where}: 아틀라스에 없는 프레임 '${name}'`); };

checkFrame(CONFIG.PLAYER.sprite + '_anim_f0', 'CONFIG.PLAYER.sprite');

for (const [id, d] of Object.entries(HEROES)) {
  const w = `heroes.${id}`;
  if (!d.name) err(`${w}: name 없음`);
  if (!hasAnim(d.sprite)) err(`${w}: 스프라이트 '${d.sprite}' 없음`);
  for (const k of ['hp', 'speed']) if (!(d[k] > 0)) err(`${w}: ${k} 는 양수여야 함`);
  if (d.ai === 'ranged' && !PROJECTILES[d.projectile]) err(`${w}: 발사체 '${d.projectile}' 없음`);
  if (d.ai && !['melee', 'ranged', 'healer'].includes(d.ai)) err(`${w}: 알 수 없는 ai '${d.ai}'`);
  for (const a of d.abilities || []) {
    if (!ABILITIES[a.type]) err(`${w}: 보스 패턴 '${a.type}' 구현 없음 (systems/abilities.js)`);
    if (!(a.cd > 0)) err(`${w}: 패턴 '${a.type}' cd 필요`);
    if (a.projectile && !PROJECTILES[a.projectile]) err(`${w}: 패턴 발사체 '${a.projectile}' 없음`);
    if (a.type === 'summon' && !HEROES[a.id]) err(`${w}: 소환 대상 '${a.id}' 없음`);
  }
}
if (!Object.values(HEROES).some((d) => d.final)) err('heroes: final:true 보스가 하나는 있어야 승리 가능');

const tiers = new Set();
for (const [id, d] of Object.entries(MINIONS)) {
  const w = `minions.${id}`;
  if (!hasAnim(d.sprite)) err(`${w}: 스프라이트 '${d.sprite}' 없음`);
  if (![1, 2, 3].includes(d.tier)) err(`${w}: tier 는 1~3`);
  tiers.add(d.tier);
  if (d.ai === 'ranged' && !PROJECTILES[d.projectile]) err(`${w}: 발사체 '${d.projectile}' 없음`);
}
for (const t of [1, 2, 3]) if (!tiers.has(t)) err(`minions: ${t}티어 마물이 없음`);

for (const [id, d] of Object.entries(SKILLS)) {
  const w = `skills.${id}`;
  checkFrame(d.icon, w + '.icon');
  if (!SKILL_IMPL[id]) err(`${w}: systems/skills.js SKILL_IMPL 에 구현 없음`);
  if (!Array.isArray(d.levels) || !d.levels.length) err(`${w}: levels 비어 있음`);
  if (id === 'raise_dead') for (const L of d.levels) for (const t in L.tiers) if (!tiers.has(Number(t))) err(`${w}: 없는 티어 ${t}`);
}
for (const id of STARTING_SKILLS) if (!SKILLS[id]) err(`STARTING_SKILLS: '${id}' 없음`);
for (const [id, d] of Object.entries(PASSIVES)) {
  checkFrame(d.icon, `passives.${id}.icon`);
  if (typeof d.apply !== 'function') err(`passives.${id}: apply 함수 없음`);
  if (!(d.maxLevel > 0)) err(`passives.${id}: maxLevel 필요`);
}
for (const f of FALLBACK_REWARDS) checkFrame(f.icon, `fallback.${f.id}.icon`);

for (const [id, d] of Object.entries(PROJECTILES)) {
  if (d.sprite) checkFrame(d.sprite, `projectiles.${id}`);
  else if (!d.color) err(`projectiles.${id}: sprite 또는 color 필요`);
}

let prev = -1;
for (const p of SPAWN_PHASES) {
  if (p.from <= prev) err(`waves: SPAWN_PHASES 는 from 오름차순이어야 함 (${p.from})`);
  prev = p.from;
  for (const id in p.mix) if (!HEROES[id]) err(`waves: phase@${p.from} mix 의 '${id}' 없음`);
}
prev = -1;
for (const e of EVENTS) {
  if (e.at < prev) err(`waves: EVENTS 는 at 오름차순이어야 함 (${e.at})`);
  prev = e.at;
  for (const id of e.ids || [e.id]) if (!HEROES[id]) err(`waves: event@${e.at} 의 '${id}' 없음`);
  if (!['swarm', 'raid', 'boss', 'final'].includes(e.type)) err(`waves: event@${e.at} 알 수 없는 type '${e.type}'`);
}

for (const [id, d] of Object.entries(SITE_TYPES)) {
  const w = `sites.${id}`;
  if (!['capture', 'destroy', 'loot'].includes(d.kind)) err(`${w}: 알 수 없는 kind '${d.kind}'`);
  for (const h in { ...d.summonMix, ...d.guards }) if (!HEROES[h]) err(`${w}: 없는 용사 id '${h}'`);
  if (d.kind === 'destroy' && !(d.hp > 0)) err(`${w}: hp 는 양수여야 함`);
}
for (const s of SITE_LAYOUT) {
  if (!SITE_TYPES[s.type]) err(`sites: 배치의 '${s.type}' 없음`);
  if (!(s.x > 0 && s.x < 1 && s.y > 0 && s.y < 1)) err(`sites: '${s.type}' 위치는 0~1 비율이어야 함`);
}

if (errors.length) {
  console.error(`데이터 검증 실패 (${errors.length})\n - ` + errors.join('\n - '));
  process.exit(1);
}
console.log(`데이터 검증 통과: 용사 ${Object.keys(HEROES).length}, 마물 ${Object.keys(MINIONS).length}, 주문 ${Object.keys(SKILLS).length}, 유물 ${Object.keys(PASSIVES).length}, 이벤트 ${EVENTS.length}, 유적 ${SITE_LAYOUT.length}`);
