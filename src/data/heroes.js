// ───────────────────────────────────────────────────────────────
// 용사 파티 (적 유닛) 데이터
//
// 필드 설명 (docs/DATA_GUIDE.md 참고)
//   name        표시 이름
//   sprite      아틀라스 base 이름 (예: 'knight_m' → knight_m_run_anim_f0..3)
//   hp/speed/damage/range/attackCd/radius   기본 능력치 (게임 픽셀, 초)
//   ai          'melee' | 'ranged' | 'healer'
//   projectile  ai='ranged' 일 때 발사체 id (data/projectiles.js)
//   heal        ai='healer' 일 때 1회 회복량
//   altarBias   제단을 노릴 확률 (0~1). 기본 0.3
//   xp          처치 시 떨어뜨리는 영혼 수치
//   scale       스프라이트 배율 (보스용)
//   boss        true 면 보스 체력바/등장 연출. 처치 시 '타락한' 아군으로 부활
//   abilities   보스 패턴 목록 (systems/abilities.js 의 type)
//   lines       등장 대사 / fallenLine 부활 대사
// ───────────────────────────────────────────────────────────────

export const HEROES = {
  // ── 일반 병력 ────────────────────────────────────────────────
  squire: {
    name: '견습 기사', sprite: 'knight_m',
    hp: 20, speed: 30, damage: 5, range: 8, attackCd: 1.0, radius: 5, xp: 1,
    ai: 'melee', altarBias: 0.15,
  },
  lancer: {
    name: '왕국 여기사', sprite: 'knight_f',
    hp: 34, speed: 34, damage: 7, range: 9, attackCd: 0.9, radius: 5, xp: 2,
    ai: 'melee', altarBias: 0.2,
  },
  scout: {
    name: '리자드 척후병', sprite: 'lizard_m',
    hp: 13, speed: 50, damage: 4, range: 8, attackCd: 0.7, radius: 5, xp: 1,
    ai: 'melee', altarBias: 0.35,
  },
  archer: {
    name: '엘프 궁수', sprite: 'elf_m',
    hp: 15, speed: 32, damage: 5, range: 100, attackCd: 1.8, radius: 5, xp: 2,
    ai: 'ranged', projectile: 'arrow', altarBias: 0.2,
  },
  mage: {
    name: '견습 마법사', sprite: 'wizzard_m',
    hp: 17, speed: 26, damage: 9, range: 110, attackCd: 2.4, radius: 5, xp: 2,
    ai: 'ranged', projectile: 'holy_orb', altarBias: 0.25,
  },
  guardian: {
    name: '드워프 방패병', sprite: 'dwarf_m',
    hp: 70, speed: 22, damage: 9, range: 9, attackCd: 1.3, radius: 6, xp: 3,
    ai: 'melee', altarBias: 0.35, knockResist: 0.8,
  },
  berserker: {
    name: '드워프 광전사', sprite: 'dwarf_f',
    hp: 42, speed: 42, damage: 10, range: 9, attackCd: 0.8, radius: 6, xp: 3,
    ai: 'melee', altarBias: 0.2,
  },
  priest: {
    name: '수련 사제', sprite: 'angel',
    hp: 20, speed: 28, damage: 0, range: 90, attackCd: 3.0, radius: 5, xp: 3,
    ai: 'healer', heal: 10, altarBias: 0.1,
  },

  // ── 보스: 용사 파티 ──────────────────────────────────────────
  silva: {
    name: '엘프 레인저 실바', title: '용사 파티 · 궁수', sprite: 'elf_f', scale: 2,
    hp: 1100, speed: 30, damage: 8, range: 140, attackCd: 1.0, radius: 9, xp: 60,
    ai: 'ranged', projectile: 'arrow', boss: true, knockResist: 1,
    abilities: [{ type: 'spread', cd: 2.4, count: 7, arc: 0.9, projectile: 'arrow', damage: 7 }],
    lines: ['어둠의 술사여, 숲의 이름으로 너를 쏘아 맞히겠다!'],
    fallenLine: '...화살은 이제 주인님을 위해.',
  },
  bron: {
    name: '드워프 장군 브론', title: '용사 파티 · 방패', sprite: 'dwarf_m', scale: 2.2,
    hp: 2600, speed: 26, damage: 18, range: 14, attackCd: 1.2, radius: 11, xp: 90,
    ai: 'melee', boss: true, knockResist: 1, altarBias: 0,
    abilities: [{ type: 'dash', cd: 5, speed: 230, duration: 0.55, damage: 22, radius: 16 }],
    lines: ['돌보다 단단한 이 방패, 해골 따위로 뚫을 수 있겠나!'],
    fallenLine: '방패를... 주인님께 바치나이다.',
  },
  serena: {
    name: '대마법사 세레나', title: '용사 파티 · 마법사', sprite: 'wizzard_f', scale: 2,
    hp: 2200, speed: 24, damage: 12, range: 150, attackCd: 1.6, radius: 9, xp: 120,
    ai: 'ranged', projectile: 'holy_orb', boss: true, knockResist: 1,
    abilities: [
      { type: 'ring', cd: 3.2, count: 16, projectile: 'holy_orb', damage: 10 },
      { type: 'summon', cd: 11, id: 'mage', count: 4 },
    ],
    lines: ['금지된 마법은 오늘로 끝이에요. 정화의 빛이여!'],
    fallenLine: '빛은 꺼졌어요. 이제 어둠을 노래하죠.',
  },
  elia: {
    name: '성녀 엘리아', title: '용사 파티 · 성녀', sprite: 'angel', scale: 2.6,
    hp: 3600, speed: 26, damage: 0, range: 170, attackCd: 2.5, radius: 10, xp: 150,
    ai: 'healer', heal: 30, boss: true, knockResist: 1, altarBias: 0,
    abilities: [
      { type: 'heal_wave', cd: 4, radius: 170, amount: 35 },
      { type: 'summon', cd: 9, id: 'priest', count: 3 },
      { type: 'ring', cd: 5, count: 10, projectile: 'holy_orb', damage: 9 },
    ],
    lines: ['여신이시여, 저 가엾은 망자들에게 안식을...'],
    fallenLine: '여신은... 응답하지 않았어요.',
  },
  leon: {
    name: '용사 레온', title: '빛의 용사', sprite: 'knight_m', scale: 2.8,
    hp: 9000, speed: 34, damage: 26, range: 16, attackCd: 1.0, radius: 12, xp: 300,
    ai: 'melee', boss: true, final: true, knockResist: 1, altarBias: 0,
    abilities: [
      { type: 'dash', cd: 4.5, speed: 260, duration: 0.5, damage: 30, radius: 18 },
      { type: 'slash', cd: 2.6, radius: 42, damage: 22 },
      { type: 'summon', cd: 12, id: 'lancer', count: 6 },
    ],
    lines: ['네크로맨서! 동료들의 원수, 이 성검으로 갚아주마!'],
  },
};
