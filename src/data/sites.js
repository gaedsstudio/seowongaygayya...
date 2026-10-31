// ───────────────────────────────────────────────────────────────
// 유적(맵 오브젝트) 데이터. 동작은 systems/sites.js
//
// SITE_TYPES: 유적 종류
//   kind 'capture' : 근처에 머물러 점령. 점령하면 아군 거점 (자동 영혼 화살 + 회복)
//   kind 'destroy' : 용사 편 구조물. 부수면 보상. 플레이어가 다가오면 용사를 부르고 주변 용사를 회복
//   kind 'loot'    : 다가가면 정예 수호대가 깨어남. 수호대를 모두 처치하고 열면 보상
//
// reward 키 (systems/sites.js 의 giveReward)
//   xp        영혼 보석 총량 (gems 개로 나눠 떨어뜨림)
//   ult       대빙의 게이지 +%
//   heal      플레이어 체력 회복
//   levelUps  즉시 레벨업 카드 선택 횟수
//
// SITE_LAYOUT: 아레나 안 배치. x, y 는 아레나 크기에 대한 비율 (0~1)
// ───────────────────────────────────────────────────────────────

export const SITE_TYPES = {
  obelisk: {
    name: '사령 오벨리스크', kind: 'capture',
    radius: 8,
    captureRadius: 40, // 이 안에 서 있으면 점령이 진행됨
    captureTime: 4, // 점령에 걸리는 시간(초). 용사가 범위 안에 있으면 멈춤
    decayPerSec: 0.5, // 범위를 벗어나면 초당 줄어드는 진행도(초 단위)
    // 점령한 뒤
    boltRange: 110, boltDamage: 9, boltCd: 0.8,
    healRadius: 40, healPerSec: 3,
    reward: { ult: 10 },
  },
  holy_spire: {
    name: '성광 첨탑', kind: 'destroy',
    hp: 900, radius: 12,
    activeRadius: 220, // 플레이어가 이 안에 들어오면 깨어남
    summonCd: 7, summonMix: { lancer: 3, archer: 2, priest: 1 }, summonCount: 3,
    healCd: 2.5, healRadius: 90, healAmount: 8, // 주변 용사 회복
    reward: { xp: 60, gems: 10, ult: 20 },
  },
  relic_vault: {
    name: '봉인된 보물고', kind: 'loot',
    radius: 8,
    triggerRadius: 90, // 플레이어가 이 안에 들어오면 수호대가 깨어남
    openRadius: 18, // 수호대를 모두 처치한 뒤 이 거리까지 다가가면 열림
    guards: { guardian: 2, berserker: 1, priest: 1 },
    guardHpMul: 3, guardDmgMul: 1.4, // 정예 배율 (시간에 따른 체력 증가에 곱해짐)
    reward: { levelUps: 1, ult: 15, heal: 40 },
  },
};

export const SITE_LAYOUT = [
  { type: 'obelisk', x: 0.3, y: 0.3 },
  { type: 'obelisk', x: 0.7, y: 0.3 },
  { type: 'obelisk', x: 0.3, y: 0.7 },
  { type: 'obelisk', x: 0.7, y: 0.7 },
  { type: 'holy_spire', x: 0.5, y: 0.13 },
  { type: 'holy_spire', x: 0.5, y: 0.87 },
  { type: 'relic_vault', x: 0.13, y: 0.5 },
  { type: 'relic_vault', x: 0.87, y: 0.5 },
];
