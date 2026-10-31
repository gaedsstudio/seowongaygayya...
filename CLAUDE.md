# CLAUDE.md

이 프로젝트의 AI 작업 지침은 모든 에이전트가 공유하는 `AGENTS.md`에 있습니다. 반드시 먼저 읽고 따르세요.

@AGENTS.md

## Claude Code 전용 메모
- 게임 실행 확인: `node tools/serve.mjs`를 실행한 뒤 Playwright로 http://localhost:8080 열기 (또는 `node tests/smoke.mjs`가 만든 `tests/out/*.png` 스크린샷 확인)
- 콘솔 디버그: `window.__game` (docs/ARCHITECTURE.md의 "디버그" 절)
