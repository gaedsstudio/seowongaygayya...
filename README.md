# 포제션 디펜스 (Possession Defense)

> **용사 파티를 토벌하라. 네가 바로 마왕군의 네크로맨서다.**

용사가 주인공인 게임은 많습니다. 이 게임에서는 반대로 **악역인 네크로맨서**가 되어
던전으로 쳐들어오는 용사 파티를 맞아 싸웁니다. 쓰러진 용사의 시체로 **언데드 군단**을 만들고,
살아있는 용사에게 **빙의**해 내 편으로 돌려세우고, 마지막에는 **빛의 용사 레온**을 무너뜨립니다.

- 장르: 탑다운 서바이벌 액션 + 거점 방어 (자동 공격, 레벨업할 때마다 3개 중 1개 선택)
- 플랫폼: 웹 브라우저 (PC 키보드 / 모바일 터치)
- 한 판: 약 10분
- 엔진: 없음. 순수 HTML5 Canvas와 JavaScript(ES Modules)로 만들어 **빌드 과정이 없습니다**

| 문서 | 내용 |
|---|---|
| [docs/GDD.md](docs/GDD.md) | 게임 기획서: 콘셉트, 핵심 루프, 시스템, 밸런스 |
| [docs/ART_GUIDE.md](docs/ART_GUIDE.md) | 아트와 UI 디자인 가이드: 색, 스케일, 폰트, 이펙트, 에셋 규칙 |
| [docs/DATA_GUIDE.md](docs/DATA_GUIDE.md) | 용사, 마물, 스킬, 보스 패턴, 웨이브를 추가하는 방법 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 코드 구조, 실행 순서, 핵심 API |
| [docs/COLLABORATION.md](docs/COLLABORATION.md) | 3인 + AI 협업 규칙: 브랜치, PR, 담당 영역 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 작업 보드 (할 일 목록과 담당 레인) |
| [AGENTS.md](AGENTS.md) | **AI 에이전트용 작업 지침** (Claude, Codex, Gemini, Copilot 공통) |
| [CREDITS.md](CREDITS.md) | 에셋 출처와 라이선스 |

## 실행 방법

ES 모듈을 쓰기 때문에 `index.html`을 더블클릭(file://)하면 **동작하지 않습니다**. 로컬 서버로 여세요.

```bash
node tools/serve.mjs
```

브라우저에서 http://localhost:8080 을 엽니다. Node가 없으면 `python3 -m http.server 8080`을 써도 됩니다.

## 조작

| 입력 | 동작 |
|---|---|
| WASD / 방향키 / 화면 드래그 | 이동 |
| (자동) | 스킬 자동 시전 |
| 1 / 2 / 3 또는 클릭 | 레벨업 선택 |
| SPACE (모바일: 우하단 버튼) | **대빙의**: 게이지가 차면 주변 용사를 15초 동안 지배 |
| ESC / P | 일시정지 |

## 테스트

```bash
node tests/smoke.mjs 240
```

헤드리스 브라우저(Playwright)로 게임을 띄워 봇이 240초를 플레이합니다.
콘솔 에러가 있으면 실패하고, 스크린샷은 `tests/out/`에 저장됩니다.
**PR을 올리기 전에 반드시 실행하세요.**

## 폴더 구조

```
index.html, style.css     진입 HTML과 DOM UI 스타일
src/
  main.js                 부팅과 게임 루프
  config.js               엔진 상수와 플레이어/제단 기본값
  game.js                 Game 클래스 (상태, 전투, 생성, 그리기 순서)
  core/                   에셋 로더, 입력, 공간 그리드, 유틸
  entities/               Unit(용사/마물 공용), Player, Altar
  systems/                AI, 스킬, 발사체, 보스 패턴, 웨이브, 월드, 이펙트
  data/                   ★ 밸런스 데이터 (용사, 마물, 스킬, 웨이브, 발사체)
  ui/                     캔버스 HUD와 DOM 화면 (타이틀, 레벨업, 결과)
assets/                   스프라이트 아틀라스와 폰트
tools/                    아틀라스 빌드 스크립트, 로컬 서버
tests/                    스모크 테스트
docs/                     기획/디자인/협업 문서
```

## 에셋

- 그래픽: [0x72 — 16x16 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii) (itch.io, **CC0**)
- 폰트: [Galmuri](https://github.com/quiple/galmuri) (SIL OFL 1.1)

자세한 내용은 [CREDITS.md](CREDITS.md)에 있습니다.
