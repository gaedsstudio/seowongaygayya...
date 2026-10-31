// ───────────────────────────────────────────────────────────────
// 발사체 외형/속도 데이터
//   sprite 가 있으면 아틀라스 이미지를 회전시켜 그림 (이미지는 '위쪽'을 향한다고 가정)
//   sprite 가 없으면 color/glow 로 빛나는 구체를 그림
// ───────────────────────────────────────────────────────────────

export const PROJECTILES = {
  // 적(용사)
  arrow: { sprite: 'weapon_arrow', speed: 150, radius: 3, life: 1.6, scale: 0.8 },
  holy_orb: { color: '#fff3c4', glow: 'rgba(255, 214, 102, 0.55)', size: 3, speed: 85, radius: 4, life: 2.6 },

  // 아군
  soul_bolt: { color: '#b8f6ff', glow: 'rgba(80, 180, 255, 0.6)', size: 3, speed: 175, radius: 4, life: 1.8, trail: '#5ac8ff' },
  bone_spear: { sprite: 'weapon_spear', speed: 210, radius: 5, life: 1.3 },
  hellfire: { color: '#d8ff8a', glow: 'rgba(110, 220, 70, 0.55)', size: 2.5, speed: 120, radius: 3, life: 1.6 },
};
