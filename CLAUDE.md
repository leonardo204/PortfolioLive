# Claude Code 개발 가이드

> 공통 규칙(Agent Delegation, 커밋 정책, Context DB 등)은 글로벌 설정(`~/.claude/CLAUDE.md`)을 따릅니다.
> 글로벌 미설치 시: `curl -fsSL https://raw.githubusercontent.com/leonardo204/dotclaude/main/install.sh | bash`

---

## Slim 정책

이 파일은 **100줄 이하**를 유지한다. 새 지침 추가 시:
1. 매 턴 참조 필요 → 이 파일에 1줄 추가
2. 상세/예시/테이블 → ref-docs/*.md에 작성 후 여기서 참조
3. ref-docs 헤더: `# 제목 — 한 줄 설명` (모델이 첫 줄만 보고 필요 여부 판단)

---

## PROJECT

> 아래 섹션을 프로젝트에 맞게 작성하세요.

### 개요

**PortfolioLive** — 포트폴리오 웹 소개 + 자연어 대화형 Q&A 서비스

| 항목 | 값 |
|------|-----|
| 기술 스택 | Next.js 15+, FastAPI, LangGraph, CopilotKit, Gemini, PostgreSQL, Docker |
| 빌드 방법 | `docker-compose up` |
| 상태 | 설계 단계 |

### 상세 문서

**프로젝트 문서**
- [서비스 계획서](docs/service-plan.md) — 아키텍처, 기술 스택, 구현 단계, DB 스키마
- [서비스 시나리오](docs/scenarios.md) — 8개 시나리오, UI 컴포넌트 매핑, 멀티턴 흐름

**시스템 문서**
- [Context DB](ref-docs/context-db.md) — SQLite 기반 세션/태스크/결정 저장소
- [Context Monitor](ref-docs/context-monitor.md) — HUD + compaction 감지/복구
- [Hooks](ref-docs/hooks.md) — 5개 자동 실행 Hook 상세
- [컨벤션](ref-docs/conventions.md) — 커밋, 주석, 로깅 규칙
- [셋업](ref-docs/setup.md) — 새 환경 초기 설정
- [Agent Delegation](ref-docs/agent-delegation.md) — 에이전트 위임/파이프라인 상세

### 핵심 규칙

- API 키는 `.env`에만 저장, 절대 커밋 금지
- 디자인: No AI feel, simple, tidy, 과도한 애니메이션 자제
- 대상 사용자: 인사담당자, 스카우터
- DB: PostgreSQL 단일 인스턴스 (pgvector, 체크포인터, 캐시 전부 포함)
- 배포: Docker Compose, private port (기존 서비스 공존)

---

*최종 업데이트: 2026-04-06*
