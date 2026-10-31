// ───────────────────────────────────────────────────────────────
// 언데드/마물 군단 (아군 소환수) 데이터
//
//   tier   1~3. '사령 소생' 스킬 레벨이 오를수록 높은 티어가 나올 확률 ↑
//   cleave 근접 공격 시 대상 주변 광역 피해 반경 (선택)
//   나머지 필드는 heroes.js 와 동일
// ───────────────────────────────────────────────────────────────

export const MINIONS = {
  // ── 1티어 ────────────────────────────────────────────────────
  skeleton: {
    name: '해골 병사', sprite: 'skelet', tier: 1,
    hp: 28, speed: 52, damage: 6, range: 8, attackCd: 0.8, radius: 4, ai: 'melee',
  },
  tiny_zombie: {
    name: '꼬마 좀비', sprite: 'tiny_zombie', tier: 1,
    hp: 22, speed: 60, damage: 4, range: 7, attackCd: 0.55, radius: 4, ai: 'melee',
  },
  goblin: {
    name: '고블린 약탈자', sprite: 'goblin', tier: 1,
    hp: 20, speed: 66, damage: 5, range: 7, attackCd: 0.6, radius: 4, ai: 'melee',
  },
  imp: {
    name: '임프', sprite: 'imp', tier: 1,
    hp: 16, speed: 56, damage: 5, range: 90, attackCd: 1.3, radius: 4,
    ai: 'ranged', projectile: 'hellfire',
  },

  // ── 2티어 ────────────────────────────────────────────────────
  ghoul: {
    name: '구울', sprite: 'zombie', tier: 2,
    hp: 80, speed: 42, damage: 9, range: 8, attackCd: 0.9, radius: 5, ai: 'melee',
  },
  orc_warrior: {
    name: '오크 전사', sprite: 'orc_warrior', tier: 2,
    hp: 70, speed: 50, damage: 12, range: 9, attackCd: 1.0, radius: 5, ai: 'melee',
  },
  masked_orc: {
    name: '가면 오크', sprite: 'masked_orc', tier: 2,
    hp: 60, speed: 58, damage: 10, range: 9, attackCd: 0.8, radius: 5, ai: 'melee',
  },
  chort: {
    name: '초르트', sprite: 'chort', tier: 2,
    hp: 48, speed: 72, damage: 8, range: 8, attackCd: 0.45, radius: 5, ai: 'melee',
  },
  orc_shaman: {
    name: '오크 주술사', sprite: 'orc_shaman', tier: 2,
    hp: 40, speed: 46, damage: 11, range: 110, attackCd: 1.2, radius: 5,
    ai: 'ranged', projectile: 'hellfire',
  },

  // ── 3티어 ────────────────────────────────────────────────────
  big_ghoul: {
    name: '거대 구울', sprite: 'big_zombie', tier: 3,
    hp: 260, speed: 34, damage: 22, range: 12, attackCd: 1.2, radius: 9, ai: 'melee', cleave: 18,
  },
  ogre: {
    name: '오우거', sprite: 'ogre', tier: 3,
    hp: 220, speed: 40, damage: 28, range: 12, attackCd: 1.4, radius: 9, ai: 'melee', cleave: 22,
  },
  archdemon: {
    name: '대악마', sprite: 'big_demon', tier: 3,
    hp: 200, speed: 50, damage: 24, range: 12, attackCd: 1.0, radius: 9, ai: 'melee', cleave: 24,
  },
};
