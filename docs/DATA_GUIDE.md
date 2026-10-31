# 데이터 가이드: 콘텐츠를 추가하는 방법

대부분의 콘텐츠는 **`src/data/` 파일만 고쳐서** 추가할 수 있습니다. 엔진 코드를 건드리지 않아도 되므로
여러 사람과 AI가 동시에 작업해도 충돌이 적습니다.

사용할 수 있는 스프라이트 이름은 `assets/sprites/tile_list_v1.7.txt`에서 찾으세요.
캐릭터 base 이름 예시: `knight_m`, `knight_f`, `elf_m`, `elf_f`, `wizzard_m`, `wizzard_f`, `dwarf_m`, `dwarf_f`, `lizard_m`, `lizard_f`, `angel`, `doc`, `pumpkin_dude`,
`skelet`, `tiny_zombie`, `zombie`, `ice_zombie`, `goblin`, `imp`, `chort`, `wogol`, `orc_warrior`, `masked_orc`, `orc_shaman`, `muddy`, `swampy`, `big_zombie`, `ogre`, `big_demon`, `necromancer`

---

## 1. 새 용사(적) 추가: `src/data/heroes.js`

```js
paladin: {
  name: '성기사', sprite: 'knight_f',
  hp: 60, speed: 28, damage: 10, range: 9, attackCd: 1.1, radius: 6, xp: 4,
  ai: 'melee',          // 'melee' | 'ranged' | 'healer'
  altarBias: 0.3,       // 제단을 노릴 확률
  knockResist: 0.5,     // 0~1, 1이면 넉백 무시
},
```

그다음 `src/data/waves.js`의 `SPAWN_PHASES[].mix`에 `paladin: 3`처럼 가중치를 넣어야 실제로 등장합니다.

| 필드 | 필수 | 설명 |
|---|---|---|
| name | ✔ | 표시 이름 |
| sprite | ✔ | 아틀라스 base 이름 |
| hp, speed, damage | ✔ | 체력, px/s, 1회 피해 |
| range | | 근접은 8~16, 원거리는 90~150 |
| attackCd | | 공격 간격(초) |
| radius | | 충돌 반경. 일반 5, 큰 몸집 9~12 |
| xp | | 떨어뜨리는 영혼량 (1=청, 5+=녹, 25+=적 보석) |
| ai | | 기본값 melee |
| projectile | ranged | `data/projectiles.js`의 id |
| heal | healer | 1회 회복량 |
| scale | | 스프라이트 배율 (보스) |
| boss | | true면 하단 체력바, 등장 대사, 처치 후 타락 부활 |
| final | | true인 보스를 처치하면 승리 |
| abilities | | 보스 패턴 목록 (아래 4번) |
| lines / fallenLine | | 등장 대사 배열 / 타락 부활 대사 |

## 2. 새 마물(아군) 추가: `src/data/minions.js`

```js
ice_ghoul: {
  name: '서리 구울', sprite: 'ice_zombie', tier: 2,
  hp: 70, speed: 44, damage: 10, range: 8, attackCd: 0.9, radius: 5, ai: 'melee',
},
```

- `tier`(1~3)만 맞추면 `사령 소생`이 자동으로 그 티어 후보에 넣습니다.
- `cleave: 20`을 넣으면 근접 공격이 대상 주변 반경 20에 60% 광역 피해를 줍니다.
- 원거리 마물은 `ai: 'ranged', projectile: 'hellfire'`

## 3. 새 주문(스킬) 추가

**1단계: 데이터** `src/data/skills.js`의 `SKILLS`

```js
blood_nova: {
  name: '피의 파동',
  icon: 'flask_big_red',
  desc: '주기적으로 주변에 피의 파동을 일으킵니다.',
  levels: [
    { dmg: 15, radius: 40, cd: 4 },
    { dmg: 20, radius: 44, cd: 3.6 },
    // ... 최대 레벨 = 배열 길이
  ],
  note: [null, null, '파동이 두 번 퍼집니다'], // (선택) 레벨별 추가 설명
},
```

`STAT_LABELS`에 있는 키(dmg, count, cd, pierce, radius, cap, perCast, duration, range)는 레벨업 카드에
"피해 15 → 20"처럼 자동으로 표시됩니다. 새 키를 쓰면 `STAT_LABELS`에 한국어 라벨을 추가하세요.

**2단계: 동작** `src/systems/skills.js`의 `SKILL_IMPL`

```js
blood_nova: {
  update(game, s, L, dt) {
    if ((s.t -= dt) > 0) return;          // s.t = 쿨다운 타이머
    s.t = L.cd * game.mods.cdMul;         // 유물 '시간 왜곡' 반영
    const P = game.player;
    const r = L.radius * game.mods.areaMul;      // '심연 확장' 반영
    for (const e of game.heroesIn(P.x, P.y, r)) {
      game.damage(e, L.dmg * game.mods.dmgMul, { fromPlayer: true }); // '금단의 지식' 반영
    }
    game.fx.ring(P.x, P.y - 6, 4, r, '#ff4a6a', 0.4, 3);
  },
  // (선택) 바닥에 깔리는 그림
  drawGround(ctx, game, s, L) {},
},
```

**규칙**: 쿨다운에는 `game.mods.cdMul`, 범위에는 `areaMul`, 피해에는 `dmgMul`을 반드시 곱하세요.

## 4. 보스 패턴 추가: `src/systems/abilities.js`

```js
// heroes.js:  abilities: [{ type: 'meteor', cd: 6, count: 5, damage: 20, radius: 24 }]
meteor(game, u, a) {
  for (let i = 0; i < a.count; i++) {
    const x = game.player.x + (Math.random() - 0.5) * 120;
    const y = game.player.y + (Math.random() - 0.5) * 80;
    for (const e of game.enemiesOf(u.side, x, y, a.radius)) game.damage(e, a.damage, { source: u });
    game.fx.ring(x, y, 2, a.radius, '#ffb347', 0.5, 3);
  }
},
```

- `u.side`가 `'hero'`면 용사 편, `'evil'`이면 타락해서 아군이 된 상태입니다. `enemiesOf(u.side, …)`를 쓰면 타락한 뒤에도 알아서 반대편을 공격합니다.
- 지금 있는 패턴: `spread`(부채꼴), `ring`(원형 탄막), `dash`(돌진), `slash`(광역 베기), `heal_wave`(회복), `shield_aura`(같은 편 보호막: `radius`, `duration`, `damageTakenMul`), `summon`(부하 소환. 용사 편일 때만)
- `abilities`는 보스가 아닌 일반 용사에게도 붙일 수 있습니다 (예: 성기사의 `shield_aura`).

## 5. 유물(패시브) 추가: `src/data/skills.js`의 `PASSIVES`

```js
bone_armor: {
  name: '뼈 갑옷', icon: 'skull', maxLevel: 5,
  desc: '받는 피해 -6%',
  apply: (m, lv) => { m.damageTakenMul = (m.damageTakenMul ?? 1) * Math.pow(0.94, lv); },
},
```

새 mods 키를 만들었다면 `src/systems/skills.js`의 `computeMods` 초기값에 추가하고, 그 값을 실제로 쓰는 코드(예: `game.damage`)도 고치세요.

## 6. 웨이브와 이벤트: `src/data/waves.js`

- `SPAWN_PHASES`: `from`초부터 적용. `interval`(초), `batch`(마리), `max`(필드 최대), `mix`(가중치)
- `EVENTS`: `{ at, type, ... }`. `at` 순서대로 정렬해 두세요.
  - `swarm` `{ id, count, msg }`: 플레이어를 원형으로 포위
  - `raid` `{ id, count, msg }`: 아레나 가장자리에서 제단으로 돌격
  - `boss` `{ id }`
  - `final` `{ ids: [...], msg }`
- 새 이벤트 타입은 `src/systems/spawner.js`의 `runEvent`에 `case`를 추가합니다.

## 7. 발사체 외형: `src/data/projectiles.js`

```js
ice_shard: { sprite: 'weapon_knife', speed: 160, radius: 3, life: 1.5 },          // 스프라이트형
dark_orb:  { color: '#e0b0ff', glow: 'rgba(160,80,255,0.5)', size: 3, speed: 90, radius: 4, life: 2 }, // 구체형
```

## 8. 확인

데이터를 고친 뒤에는 반드시:

```bash
node tests/validate-data.mjs
```

```bash
node tests/smoke.mjs 240
```

- `validate-data.mjs`는 브라우저 없이 1초 만에 끝납니다. 틀린 스프라이트 이름, 없는 용사 id, 구현이 없는 스킬이나 패턴, 정렬되지 않은 웨이브를 잡아냅니다.
- `smoke.mjs`는 실제로 게임을 돌립니다. 실행 중에 콘솔 에러나 경고(`[assets] 없는 프레임:` 등)가 나오면 실패합니다.
