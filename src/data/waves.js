// ───────────────────────────────────────────────────────────────
// 웨이브(적 등장) 데이터
//
// SPAWN_PHASES: from(초)부터 다음 단계 전까지 적용되는 상시 스폰 규칙
//   interval  스폰 간격(초)   batch  한 번에 나오는 수
//   max       필드 최대 용사 수 mix   { heroId: 가중치 }
//
// EVENTS: 특정 시각에 1회 발생하는 이벤트
//   type 'swarm' : 플레이어를 원형으로 포위
//   type 'raid'  : 한 방향에서 제단으로 돌격하는 부대
//   type 'boss'  : 보스 등장 (처치 시 타락한 아군으로 부활)
//   type 'final' : 최종 보스 등장. final:true 보스를 처치하면 승리
// ───────────────────────────────────────────────────────────────

export const HERO_HP_GROWTH = 1 / 200; // 일반 용사 체력 배율 = 1 + 경과초 * 이 값

export const SPAWN_PHASES = [
  { from: 0, interval: 1.1, batch: 2, max: 30, mix: { squire: 8, scout: 3 } },
  { from: 30, interval: 0.9, batch: 3, max: 50, mix: { squire: 7, scout: 4, archer: 2 } },
  { from: 75, interval: 0.8, batch: 3, max: 70, mix: { squire: 6, lancer: 2, scout: 3, archer: 3 } },
  { from: 120, interval: 0.7, batch: 4, max: 100, mix: { squire: 5, lancer: 3, scout: 3, archer: 3, mage: 2, priest: 1 } },
  { from: 180, interval: 0.6, batch: 4, max: 130, mix: { squire: 3, lancer: 4, guardian: 2, paladin: 1, scout: 3, archer: 3, mage: 2, priest: 1 } },
  { from: 240, interval: 0.55, batch: 5, max: 170, mix: { lancer: 4, guardian: 2, paladin: 2, berserker: 2, scout: 2, archer: 3, mage: 3, priest: 1 } },
  { from: 300, interval: 0.5, batch: 5, max: 210, mix: { lancer: 4, guardian: 3, paladin: 2, berserker: 3, scout: 2, archer: 3, mage: 3, priest: 2 } },
  { from: 390, interval: 0.45, batch: 6, max: 260, mix: { lancer: 4, guardian: 3, paladin: 3, berserker: 4, archer: 4, mage: 4, priest: 2 } },
  { from: 480, interval: 0.4, batch: 6, max: 320, mix: { lancer: 4, guardian: 4, paladin: 3, berserker: 4, archer: 4, mage: 4, priest: 2 } },
  { from: 540, interval: 0.35, batch: 7, max: 380, mix: { lancer: 4, guardian: 4, paladin: 3, berserker: 5, archer: 5, mage: 5, priest: 3 } },
  { from: 600, interval: 0.4, batch: 6, max: 300, mix: { lancer: 5, guardian: 3, paladin: 2, berserker: 4, archer: 4, mage: 4, priest: 3 } },
];

export const EVENTS = [
  { at: 60, type: 'swarm', id: 'squire', count: 24, msg: '기사단의 포위 진형!' },
  { at: 100, type: 'raid', id: 'scout', count: 10, msg: '척후병들이 제단을 노립니다!' },
  { at: 150, type: 'boss', id: 'silva' },
  { at: 210, type: 'swarm', id: 'archer', count: 20, msg: '엘프 궁수대의 일제 사격!' },
  { at: 260, type: 'raid', id: 'guardian', count: 10, msg: '방패병이 제단으로 진격합니다!' },
  { at: 300, type: 'boss', id: 'bron' },
  { at: 360, type: 'swarm', id: 'lancer', count: 36, msg: '왕국 기사단 본대 도착!' },
  { at: 420, type: 'raid', id: 'berserker', count: 16, msg: '광전사들이 제단으로 돌진합니다!' },
  { at: 450, type: 'boss', id: 'serena' },
  { at: 510, type: 'swarm', id: 'mage', count: 24, msg: '마탑의 정화 의식!' },
  { at: 560, type: 'raid', id: 'guardian', count: 20, msg: '최후의 방패벽이 다가옵니다!' },
  { at: 600, type: 'final', ids: ['leon', 'elia'], msg: '용사 파티가 도착했다!' },
];
