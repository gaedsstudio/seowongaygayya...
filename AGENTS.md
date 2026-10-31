# AGENTS.md: AI 에이전트 작업 지침

이 저장소는 **사람 3명 + 각자의 AI 에이전트**(Claude Code, Codex, Gemini, Copilot 등)가 함께 작업합니다.
AI는 작업을 시작하기 전에 이 파일을 끝까지 읽고 따르세요. 사람이 직접 지시한 내용이 이 파일보다 우선합니다.

## 0. 프로젝트 한 줄 요약
**포제션 디펜스**: 용사 파티를 상대하는 네크로맨서가 되어 몬스터 군단을 만들고 용사 파티를 무찌르는
탑다운 서바이벌 + 거점 방어 웹게임. 순수 HTML5 Canvas와 ES Modules로 만들었고 **빌드 과정이 없다**.

## 1. 먼저 읽을 문서 (작업 종류별)
| 작업 | 읽을 문서 |
|---|---|
| 기획, 밸런스 | `docs/GDD.md` |
| 그래픽, UI, 이펙트, 에셋 | `docs/ART_GUIDE.md` |
| 용사, 마물, 스킬, 보스, 웨이브 추가 | `docs/DATA_GUIDE.md` |
| 엔진, 시스템 코드 | `docs/ARCHITECTURE.md` |
| 브랜치, PR, 역할 분담 | `docs/COLLABORATION.md` |
| 할 일 고르기 | `docs/ROADMAP.md` |

## 2. 반드시 지킬 규칙
1. **브랜치에서 작업한다.** `main`에 직접 push하지 않는다. 브랜치 이름: `<사람이름>/<작업>` 또는 에이전트 기본 규칙 (예: `claude/...`, `codex/...`)
2. **작업 시작 전에 `git pull origin main`**(또는 rebase)으로 최신 상태를 받는다.
3. **작은 PR**: PR 하나에는 주제 하나만. 관련 없는 리포맷이나 대량 이름 변경을 하지 않는다 (다른 사람 작업과 충돌함).
4. **PR 전 테스트**: 아래 두 명령이 모두 통과해야 한다.
   ```bash
   node tests/validate-data.mjs
   ```
   ```bash
   node tests/smoke.mjs 240
   ```
   Playwright가 없는 환경이면 `npm i` 후 `npx playwright install chromium`
5. **빌드 도구나 프레임워크를 추가하지 않는다** (React, Vite, TypeScript, Phaser 등). 런타임 npm 의존성은 0개를 유지한다.
6. **수치는 `src/data/`에** 둔다. 시스템 코드에 매직 넘버를 박지 않는다.
7. **`src/data/*.js`는 아무것도 import하지 않는다** (순수 데이터).
8. **기획이 바뀌면 문서도 같은 PR에서 고친다** (`docs/GDD.md`, `docs/ART_GUIDE.md`, `docs/DATA_GUIDE.md`).
9. **에셋**: 라이선스를 확인한 CC0/CC-BY 에셋만 쓴다. `CREDITS.md`에 기록한다. 재배포 금지 에셋은 커밋하지 않는다. 자세한 규칙은 `docs/ART_GUIDE.md` §7
10. **특정 상용 게임을 베끼지 않는다**: 이름, 캐릭터, UI 레이아웃, 고유 시스템을 그대로 가져오지 않는다. 장르의 공통 문법은 괜찮다.
11. **사용자에게 보이는 텍스트는 한국어**로 쓴다. 코드 식별자는 영어, 주석은 한국어를 권장한다.
12. 다른 사람이 **작업 중인 항목**(이슈에 "작업 시작" 댓글이 있거나 열린 PR이 있는 것)은 건드리지 않는다. 고쳐야 하면 이슈나 PR 코멘트로 알린다.

## 3. 담당 영역 (충돌 줄이기)
`docs/COLLABORATION.md`의 레인 표를 따른다. 내 레인 밖의 파일을 고쳐야 하면 **PR 설명에 이유를 쓴다**.
공용 파일(`src/game.js`, `src/config.js`, `style.css`)은 변경을 최소화하고 PR에 명시한다.

## 4. 코드 스타일
- ES2020+ 모듈, 들여쓰기 2칸, 세미콜론 사용, 작은따옴표
- 클래스는 PascalCase, 함수와 변수는 camelCase, 데이터 id는 snake_case
- 모든 피해는 `game.damage()`, 모든 생성은 `game.spawnHero()` / `game.raiseMinion()`을 거친다
- 근접 검색은 `game.heroesIn` / `enemiesOf` / `alliesOf` / 그리드를 쓴다 (전체 배열을 이중 루프로 돌지 않는다)
- 새 시각 요소는 `docs/ART_GUIDE.md`의 색 토큰과 픽셀 규칙을 따른다

## 5. 커밋과 PR
- 커밋 메시지: `[영역] 요약` 예: `[data] 성기사 용사 추가`, `[ui] 레벨업 카드 모바일 레이아웃 수정`, `[docs] GDD 보스 표 갱신`
  - 영역: `data` `system` `ui` `art` `docs` `test` `tool` `fix`
- PR 템플릿(`.github/pull_request_template.md`)을 채운다. **스크린샷**(`tests/out/*.png`)을 첨부하면 좋다.
- AI가 만든 PR에는 어떤 AI가 작성했는지 PR 본문에 적는다 (예: "작성: Claude Code / 요청자: ○○").
- ROADMAP의 해당 항목을 `[x]`로 바꾸고 PR 번호를 적는다.

## 6. 막혔을 때
- 기획 의도가 불분명하면 추측해서 크게 고치지 말고, **작은 버전으로 구현한 다음 PR에 질문을 남긴다**.
- 밸런스 변경은 `node tests/smoke.mjs 660` 로그(레벨, 처치 수, 군단, 제단 체력)를 PR 본문에 붙인다.
