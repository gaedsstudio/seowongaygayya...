# 코드 구조 (Architecture)

## 원칙

1. **빌드 없음**: 순수 ES Modules. `index.html`이 `src/main.js`를 불러온다. 번들러, 프레임워크, npm 런타임 의존성을 넣지 않는다.
2. **데이터와 로직 분리**: 숫자와 콘텐츠는 `src/data/`에, 동작은 `src/systems/`에 둔다.
3. **파일 하나에 책임 하나**: 여러 사람이 동시에 작업할 때 충돌이 나지 않도록 파일을 작게 나눈다.
4. **게임 상태는 `Game` 인스턴스 하나에**: 전역 변수를 만들지 않는다. 모든 시스템 함수는 `game`을 첫 인자로 받는다.

## 모듈 의존 관계

```
main.js ──▶ core/assets, core/input, ui/screens, game.js
game.js ──▶ entities/*, systems/*, data/*, ui/hud
systems/* ──▶ data/*, core/*, (서로는 최소한만: skills→projectiles, ai→abilities→projectiles)
data/* ──▶ (아무것도 import 하지 않음. 순수 데이터)
```

`data/`가 다른 모듈을 import하면 안 됩니다. 순환 참조를 막고, 기획자나 AI가 데이터만 보고 수정할 수 있게 하기 위해서입니다.

## 한 프레임의 흐름 (`Game.update`, 60Hz 고정 스텝)

1. 공간 그리드 재구성: `heroGrid`(용사), `allyGrid`(플레이어, 제단, 아군), `unitGrid`(전체)
2. 플레이어 이동 (입력)
3. 제단: 재생, 근처 플레이어 회복, 자동 영혼 화살
4. 대빙의 입력 처리 (SPACE)
5. `spawner.update`: 상시 스폰과 이벤트
6. `updateSkills`: 플레이어 주문 자동 시전
7. `updateUnits`: 모든 유닛의 AI (대상 선택 → 이동 → 공격, 보스 패턴)
8. `separate`: 유닛 겹침 해소, 아레나 경계
9. 발사체, 장판, 보석, 시체 업데이트
10. 타락 부활 대기열, 죽은 유닛 정리, 이펙트, 카메라
11. 승리 타이머, 레벨업 대기 → `state = 'levelup'`이 되면 DOM 카드 표시

## 그리기 순서 (`Game.draw`)

바닥 (미리 그려 둔 오프스크린 캔버스) → 제단 마법진 → 역병 웅덩이 → 주문 바닥 효과 → 시체 → 보석 →
그림자와 아군 발광 → **y 정렬된 엔티티** (유닛, 플레이어, 제단) → 발사체 → 파티클과 링 →
(화면 좌표) 비네트 → 데미지 숫자와 말풍선 → HUD → 화면 플래시

## 핵심 API (`Game`)

| 메서드 | 설명 |
|---|---|
| `spawnHero(id, x, y, {goal})` | 용사 생성. goal은 'player' 또는 'altar' |
| `raiseMinion(corpse, tiers)` | 시체를 마물로 |
| `possess(unit, temporary)` | 용사를 아군으로 전환 |
| `damage(target, amount, {source, fromPlayer, knockX, knockY})` | **모든 피해는 이 함수를 거친다** |
| `heal(target, amount)` | 회복 |
| `kill(unit)` | 사망 처리 (보석, 시체, 타락 부활) |
| `heroesIn(x, y, r)` | 반경 안의 용사 목록 |
| `enemiesOf(side, x, y, r)` / `alliesOf(side, x, y, r)` | 편을 기준으로 한 검색 |
| `nearestHeroes(x, y, r, n)` | 가까운 순서로 n명 |
| `banner(text, color, sub)` | 화면 가운데 배너 |
| `fx.burst / rise / ring / text / bubble / shake / flash` | 이펙트 |

## 엔티티

- `Unit` (`entities/unit.js`): 용사, 마물, 빙의 용사, 타락 보스를 **하나의 클래스로** 다룬다.
  - `side`: `'hero'`(적) / `'evil'`(아군)
  - `kind`: `'hero' | 'minion' | 'possessed' | 'fallen'`
  - 빙의는 `side`와 `kind`만 바꾸는 방식이라, 용사의 AI와 능력이 그대로 아군 편에서 동작한다.
- `Player`, `Altar`: 각각 하나씩만 있다. `allyGrid`에 들어가 용사의 공격 대상이 된다.

## 디버그

- 브라우저 콘솔에서 `__game`으로 현재 게임 인스턴스에 접근할 수 있다.
  - `__game.godMode = true`: 무적
  - `__game.addXp(500)`: 레벨업
  - `__game.time = 590`: 시간 점프 (이미 지난 이벤트는 그 다음 프레임에 한꺼번에 발생)
  - `__game.spawnHero('leon', __game.player.x + 100, __game.player.y)`
- `src/config.js`의 `DEBUG: true`: HUD에 엔티티 수 표시

## 성능 메모

- 근접 검색은 모두 `SpatialGrid`(셀 32px)를 쓴다. 전체 순회(O(n²))를 하지 말 것.
- 틴트 스프라이트는 `(프레임, 색, 알파)` 조합마다 캐시된다. 색을 무작위로 만들면 캐시가 터지므로 고정 팔레트를 쓴다.
- 바닥은 시작할 때 한 번만 그린다. 화면에 보이는 영역만 `drawImage`로 잘라서 그린다.
- 화면 밖 유닛은 그리지 않는다 (업데이트는 한다).
