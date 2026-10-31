# 협업 가이드 (3인 + AI)

세 사람이 각자 AI 에이전트를 써서 **동시에** 작업하는 것을 전제로 한 규칙입니다.

---

## 1. 처음 한 번만: 저장소 권한 설정 (저장소 주인이 할 일)

### 1.1 협업자 초대
1. GitHub 저장소 → **Settings → Collaborators and teams** (조직 저장소라면 **Settings → Collaborators and teams → Add people**)
2. 다른 두 사람의 GitHub 아이디를 입력하고 **Write** 권한으로 초대합니다.
3. 두 사람은 메일이나 GitHub 알림에서 초대를 수락합니다.

조직(`gaedsstudio`) 저장소라면 조직 Owner가 두 사람을 조직 멤버나 외부 협업자로 추가해도 됩니다.

### 1.2 각자의 AI가 저장소에 접근하게 하기
AI 에이전트는 **그 AI를 쓰는 사람의 GitHub 권한**으로 동작합니다. 그래서 1.1에서 초대를 수락해야 AI도 편집할 수 있습니다.

| AI | 설정 |
|---|---|
| **Claude Code (웹/앱)** | claude.ai → Settings → Connectors에서 GitHub 연결. 저장소(또는 조직)에 **Claude GitHub App** 설치가 필요합니다: https://github.com/apps/claude (조직 저장소면 조직 Owner가 설치 승인) |
| **Claude Code (터미널)** | `git clone` 후 저장소 폴더에서 `claude` 실행. `CLAUDE.md`를 자동으로 읽습니다 |
| **OpenAI Codex** | ChatGPT → Codex → GitHub 연결 → 저장소 선택. `AGENTS.md`를 자동으로 읽습니다 |
| **Gemini CLI / Code Assist** | 저장소 폴더에서 실행. `GEMINI.md` → `AGENTS.md` 순서로 읽습니다 |
| **GitHub Copilot (coding agent)** | 저장소 Settings → Copilot에서 활성화. `.github/copilot-instructions.md`를 읽습니다 |

### 1.3 main 브랜치 보호 (권장)
**Settings → Branches → Add branch ruleset**(또는 Branch protection rule) → `main`
- Require a pull request before merging (PR 없이 main에 push 금지)
- Require status checks to pass → `CI / test`
- (선택) Require approvals: 1. **AI끼리 자동으로 머지하지 않도록 사람이 승인**하는 것을 권장합니다

### 1.4 게임 웹 배포 (선택)
**Settings → Pages → Source: GitHub Actions**로 설정하면 `main`에 머지될 때마다 `.github/workflows/pages.yml`이 게임을 배포합니다.
주소: `https://<owner>.github.io/<repo>/`

---

## 2. 역할 레인 (충돌 방지)

파일을 영역별로 나누어 **각자 자기 레인 위주로** 작업합니다. 사람마다 레인 하나를 맡는 것을 권장합니다.

| 레인 | 주 담당 파일 | 하는 일 |
|---|---|---|
| **A: 시스템/엔진** | `src/systems/ai.js`, `abilities.js`, `projectiles.js`, `spawner.js`, `src/core/*`, `src/entities/*` | 새 메커니즘, AI, 보스 패턴 구현, 성능, 버그 |
| **B: 콘텐츠/밸런스** | `src/data/*`, `src/systems/skills.js`(SKILL_IMPL), `docs/GDD.md`, `docs/DATA_GUIDE.md` | 용사, 마물, 주문, 유물, 웨이브 추가와 수치 조정 |
| **C: 아트/UI/연출** | `src/ui/*`, `style.css`, `src/systems/effects.js`, `src/systems/world.js`(그리기), `assets/*`, `docs/ART_GUIDE.md`, `CREDITS.md` | 에셋 반입, HUD, 화면, 이펙트, 사운드 |

**공용 파일** (`src/game.js`, `src/config.js`, `index.html`, `src/main.js`)은 누구든 고칠 수 있지만,
**작게 고치고 PR 제목에 `[공용]`을 붙이세요.** 같은 날 두 사람이 공용 파일을 크게 고치면 충돌합니다.

> 레인 배정은 `docs/ROADMAP.md` 맨 위 표에 이름을 적어 정합니다.

---

## 3. 작업 흐름

```
1. ROADMAP에서 할 일 고르기 → 같은 항목의 GitHub 이슈에 "작업 시작" 댓글 (이슈가 없으면 만들기)
2. 최신 main 받기         git switch main && git pull
3. 브랜치 만들기           git switch -c 이름/작업명    (AI는 자기 규칙대로: claude/..., codex/...)
4. 작업 + 테스트           node tests/validate-data.mjs && node tests/smoke.mjs 240
5. 커밋                    [영역] 요약
6. PR 생성                 템플릿 채우기, 스크린샷 첨부
7. 다른 사람(1명) 리뷰 후 머지 → ROADMAP 항목 [x] (이 체크도 같은 PR에 포함)
```

- **PR은 하루 안에 머지할 수 있을 만큼 작게.** 오래 열려 있는 PR은 충돌 확률이 크게 올라갑니다.
- 머지 전에 main이 바뀌었으면 `git pull --rebase origin main`으로 내 브랜치를 최신으로 맞춘 뒤 테스트를 다시 돌립니다.
- 충돌이 나면 **데이터 파일은 양쪽 항목을 모두 살리는 것**이 기본입니다.

## 4. AI에게 일을 맡길 때 프롬프트 예시

```
AGENTS.md를 읽고 규칙을 따라줘.
docs/ROADMAP.md의 "성기사 용사 추가" 항목을 해줘. 나는 레인 B 담당이야.
브랜치를 만들어서 작업하고, 테스트를 통과시킨 뒤 PR을 만들어줘.
```

```
AGENTS.md와 docs/ART_GUIDE.md를 읽고, 레벨업 카드에 희귀도 테두리(일반/희귀/전설)를 넣어줘.
색은 기존 토큰을 쓰고, 새 토큰이 필요하면 ART_GUIDE 표에도 추가해줘.
```

## 5. 리뷰 체크리스트
- [ ] 데이터와 로직이 분리됐나? (수치가 `src/data`에 있나)
- [ ] `game.damage` 같은 공용 API를 거치나?
- [ ] 문서가 같이 갱신됐나?
- [ ] 아트 규칙(정수 스케일, 색 토큰, 아군 보라 표식)을 지켰나?
- [ ] 새 에셋의 라이선스와 CREDITS 기록이 있나?
- [ ] 스모크 로그에서 레벨, 처치 수, 업데이트 시간(ms)이 크게 나빠지지 않았나?
