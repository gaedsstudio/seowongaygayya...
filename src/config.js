// ───────────────────────────────────────────────────────────────
// 전역 설정값. 밸런스 숫자는 src/data/* 에, 엔진 상수는 여기에.
// ───────────────────────────────────────────────────────────────
export const CONFIG = {
  // 화면에 보이는 세로 게임 픽셀 수 (줌 = 화면 높이 / VIEW_H 를 정수로 반올림)
  VIEW_H: 300,
  MIN_ZOOM: 2,

  // 아레나(던전) 크기 (게임 픽셀). 타일 1칸 = 16px
  TILE: 16,
  ARENA_W: 1600,
  ARENA_H: 1600,

  // 한 판 길이(초). 이 시간에 최종 보스(용사 파티)가 등장
  FINAL_WAVE_AT: 600,

  // 성능 상한
  MAX_HEROES: 450,
  MAX_PROJECTILES: 600,
  MAX_PARTICLES: 900,
  MAX_DAMAGE_TEXTS: 160,

  // 시체가 남아 있는 시간(초)
  CORPSE_LIFETIME: 25,
  MAX_CORPSES: 220,

  // 플레이어 기본 능력치
  PLAYER: {
    sprite: 'necromancer',
    maxHp: 120,
    speed: 62,
    radius: 5,
    pickupRadius: 28,
  },

  // 제단(지켜야 하는 거점)
  ALTAR: {
    maxHp: 1000,
    radius: 14,
    regen: 2, // 초당 회복
    healAuraRadius: 56, // 이 안에서 플레이어 HP 회복
    healAuraPerSec: 4,
    // 제단의 자동 방어 (영혼 화살)
    boltDamage: 12,
    boltRange: 120,
    boltCd: 0.5,
    // 용사가 제단에 주는 피해 배율
    damageTakenMul: 0.5,
  },

  // 고정 업데이트 간격
  STEP: 1 / 60,

  DEBUG: false,
};
