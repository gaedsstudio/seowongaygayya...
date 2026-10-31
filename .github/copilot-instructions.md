# Copilot 지침

이 저장소의 AI 공통 규칙은 루트의 `AGENTS.md`에 있습니다. 요약:

- 순수 HTML5 Canvas와 ES Modules 웹게임 "포제션 디펜스"입니다. 빌드 도구나 프레임워크를 추가하지 마세요.
- 밸런스와 콘텐츠는 `src/data/*.js`(import 없는 순수 데이터)에, 동작은 `src/systems/`에 둡니다.
- 모든 피해는 `game.damage()`, 근접 검색은 `game.heroesIn()` / `enemiesOf()` / `alliesOf()`를 씁니다.
- 사용자에게 보이는 텍스트는 한국어, 주석은 한국어를 권장합니다.
- PR 전에 `node tests/validate-data.mjs`와 `node tests/smoke.mjs 240`을 실행하세요.
- 색, 스케일, 폰트는 `docs/ART_GUIDE.md`의 토큰과 규칙을 따릅니다.
