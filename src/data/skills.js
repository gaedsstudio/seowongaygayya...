// ───────────────────────────────────────────────────────────────
// 스킬(자동 시전 주문) & 패시브(유물) 데이터
//
//  - levels[i] = (i+1)레벨의 수치. 최대 레벨 = levels.length
//  - note[i]   = 해당 레벨에서 추가로 보여줄 설명 (선택)
//  - 실제 동작 코드는 src/systems/skills.js 의 SKILL_IMPL[id]
//  - 패시브 효과는 apply(mods, level) 에서 mods 객체를 수정
//  - 레벨업 카드 문구는 STAT_LABELS 로 자동 생성됨 (예: "피해 10 → 13")
// ───────────────────────────────────────────────────────────────

export const MAX_ACTIVE_SLOTS = 6;
export const MAX_PASSIVE_SLOTS = 6;
export const STARTING_SKILLS = ['soul_bolt', 'raise_dead'];

export const STAT_LABELS = {
  dmg: '피해',
  count: '개수',
  cd: '재사용(초)',
  pierce: '관통',
  radius: '범위',
  cap: '군단 최대치',
  perCast: '동시 소생',
  duration: '지속(초)',
  range: '사거리',
};

export const SKILLS = {
  soul_bolt: {
    name: '영혼 화살',
    icon: 'flask_big_blue',
    desc: '가까운 용사에게 유도되는 영혼 화살을 날립니다.',
    levels: [
      { dmg: 12, count: 1, cd: 0.85, pierce: 0 },
      { dmg: 14, count: 1, cd: 0.8, pierce: 0 },
      { dmg: 14, count: 2, cd: 0.8, pierce: 0 },
      { dmg: 16, count: 2, cd: 0.8, pierce: 1 },
      { dmg: 18, count: 3, cd: 0.75, pierce: 1 },
      { dmg: 22, count: 4, cd: 0.65, pierce: 2 },
    ],
  },
  raise_dead: {
    name: '사령 소생',
    icon: 'skull',
    desc: '주변 용사의 시체를 마물로 되살려 군단에 편입합니다.',
    levels: [
      { cap: 4, radius: 70, cd: 1.6, perCast: 1, tiers: { 1: 100 } },
      { cap: 6, radius: 80, cd: 1.4, perCast: 2, tiers: { 1: 100 } },
      { cap: 8, radius: 90, cd: 1.3, perCast: 2, tiers: { 1: 70, 2: 30 } },
      { cap: 11, radius: 100, cd: 1.2, perCast: 3, tiers: { 1: 55, 2: 45 } },
      { cap: 14, radius: 110, cd: 1.0, perCast: 3, tiers: { 1: 40, 2: 45, 3: 15 } },
      { cap: 18, radius: 125, cd: 0.9, perCast: 4, tiers: { 1: 30, 2: 45, 3: 25 } },
    ],
    note: [null, null, '2티어 마물(오크·구울) 등장', null, '3티어 마물(오우거·대악마) 등장', '3티어 확률 증가'],
  },
  death_aura: {
    name: '죽음의 장막',
    icon: 'flask_green',
    desc: '네크로맨서 주위에 닿는 용사를 계속 썩게 하는 장막을 두릅니다.',
    levels: [
      { dmg: 4, radius: 30 },
      { dmg: 5, radius: 34 },
      { dmg: 6, radius: 38 },
      { dmg: 8, radius: 42 },
      { dmg: 10, radius: 47 },
      { dmg: 13, radius: 52 },
    ],
  },
  plague_pool: {
    name: '역병 웅덩이',
    icon: 'flask_big_green',
    desc: '용사 무리 아래에 역병 웅덩이를 터뜨립니다.',
    levels: [
      { dmg: 5, radius: 20, cd: 3.5, count: 1, duration: 2.5 },
      { dmg: 6, radius: 22, cd: 3.2, count: 2, duration: 2.5 },
      { dmg: 7, radius: 24, cd: 3.0, count: 2, duration: 3.0 },
      { dmg: 8, radius: 26, cd: 2.7, count: 3, duration: 3.0 },
      { dmg: 10, radius: 28, cd: 2.4, count: 3, duration: 3.5 },
      { dmg: 12, radius: 31, cd: 2.2, count: 4, duration: 3.5 },
    ],
  },
  bone_spear: {
    name: '뼈창',
    icon: 'weapon_spear',
    desc: '여러 적을 꿰뚫는 뼈창을 던집니다.',
    levels: [
      { dmg: 20, count: 1, cd: 1.8, pierce: 3 },
      { dmg: 24, count: 1, cd: 1.6, pierce: 4 },
      { dmg: 28, count: 2, cd: 1.5, pierce: 4 },
      { dmg: 32, count: 2, cd: 1.4, pierce: 6 },
      { dmg: 38, count: 3, cd: 1.3, pierce: 6 },
      { dmg: 45, count: 4, cd: 1.1, pierce: 8 },
    ],
  },
  corpse_explosion: {
    name: '시체 폭발',
    icon: 'bomb_f1',
    desc: '근처 시체를 폭발시켜 주변 용사에게 큰 피해를 줍니다.',
    levels: [
      { dmg: 25, radius: 26, cd: 3.0, count: 2 },
      { dmg: 30, radius: 28, cd: 2.7, count: 3 },
      { dmg: 36, radius: 30, cd: 2.5, count: 3 },
      { dmg: 42, radius: 33, cd: 2.2, count: 4 },
      { dmg: 50, radius: 36, cd: 2.0, count: 5 },
      { dmg: 60, radius: 40, cd: 1.8, count: 6 },
    ],
  },
  possession: {
    name: '빙의',
    icon: 'weapon_red_magic_staff',
    desc: '살아있는 용사의 영혼을 빼앗아 영구히 내 편으로 만듭니다.',
    levels: [
      { cd: 12, cap: 2, count: 1, range: 110 },
      { cd: 11, cap: 3, count: 1, range: 120 },
      { cd: 10, cap: 4, count: 2, range: 130 },
      { cd: 9, cap: 5, count: 2, range: 140 },
      { cd: 7.5, cap: 6, count: 3, range: 150 },
      { cd: 6, cap: 8, count: 3, range: 160 },
    ],
  },
};

export const PASSIVES = {
  vitality: {
    name: '망자의 육신', icon: 'ui_heart_full', maxLevel: 5,
    desc: '최대 체력 +20',
    apply: (m, lv) => { m.maxHp += 20 * lv; },
  },
  swiftness: {
    name: '그림자 걸음', icon: 'flask_yellow', maxLevel: 5,
    desc: '이동 속도 +8%',
    apply: (m, lv) => { m.speedMul += 0.08 * lv; },
  },
  expanse: {
    name: '심연 확장', icon: 'flask_big_yellow', maxLevel: 5,
    desc: '스킬 범위 +10%',
    apply: (m, lv) => { m.areaMul += 0.1 * lv; },
  },
  haste: {
    name: '시간 왜곡', icon: 'weapon_green_magic_staff', maxLevel: 5,
    desc: '스킬 재사용 대기시간 -7%',
    apply: (m, lv) => { m.cdMul *= Math.pow(0.93, lv); },
  },
  spell_power: {
    name: '금단의 지식', icon: 'weapon_golden_sword', maxLevel: 5,
    desc: '네크로맨서 스킬 피해 +12%',
    apply: (m, lv) => { m.dmgMul += 0.12 * lv; },
  },
  dark_pact: {
    name: '어둠의 계약', icon: 'weapon_red_gem_sword', maxLevel: 5,
    desc: '군단 공격력·체력 +15%',
    apply: (m, lv) => { m.minionDmgMul += 0.15 * lv; m.minionHpMul += 0.15 * lv; },
  },
  warlord: {
    name: '군단장의 깃발', icon: 'wall_banner_red', maxLevel: 5,
    desc: '군단 최대치 +2',
    apply: (m, lv) => { m.minionCapAdd += 2 * lv; },
  },
  soul_magnet: {
    name: '영혼 흡인', icon: 'flask_blue', maxLevel: 5,
    desc: '영혼 획득 범위 +35%',
    apply: (m, lv) => { m.magnetMul += 0.35 * lv; },
  },
  altar_ward: {
    name: '제단의 가호', icon: 'flask_big_red', maxLevel: 5,
    desc: '제단 최대 체력 +20%, 재생 +1/초, 제단 화살 피해 +30% (획득 시 제단 30% 회복)',
    apply: (m, lv) => { m.altarHpMul += 0.2 * lv; m.altarRegen += 1 * lv; m.altarDmgMul += 0.3 * lv; },
    onPick: (game) => game.healAltar(game.altar.maxHp * 0.3),
  },
};

/** 모든 업그레이드가 끝났을 때 나오는 대체 보상 */
export const FALLBACK_REWARDS = [
  { id: 'heal', name: '피의 성배', icon: 'flask_big_red', desc: '체력 40% 회복' },
  { id: 'soul_burst', name: '영혼 폭주', icon: 'flask_big_blue', desc: '대빙의 게이지 50% 충전' },
];
