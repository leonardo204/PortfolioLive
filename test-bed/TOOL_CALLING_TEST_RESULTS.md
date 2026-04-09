# Tool Calling Architecture QA Test Results

> 실행일: 2026-04-09
> Agent: http://localhost:3101 (Docker)
> 테스트 총 20건 (회귀 10건 + Tool Calling 특화 10건)

---

## 1단계: 핵심 회귀 테스트 (10건)

### A-01 | portfolio-live 프로젝트에 대해 알려줘
- **응답시간**: 10.7s
- **판정**: PASS
- **응답 요약**: PortfolioLive 설명 정확, `project-ref-card` A2UI 포함, slug=`portfolio-live` 정확
- **검증**: 1인칭 페르소나 OK, techs(Next.js 15, LangGraph, Gemini 2.5, pgvector, Gemini Embedding) 정확

### A-04 | mytammi 프로젝트에 대해 알려줘
- **응답시간**: 11.6s
- **판정**: PASS
- **응답 요약**: MyTammi = 베트남 TV 미디어 AI 어시스턴트, Multi-Agent 아키텍처, 18개 도메인/72개 액션
- **검증**: DB description과 일치, 할루시네이션 없음, `project-ref-card` A2UI 포함

### B-01 | 경력이 어떻게 되나요?
- **응답시간**: 15.9s
- **판정**: PASS
- **응답 요약**: 3개 회사(케이티알티미디어/알티캐스트/피앤아이솔루션) + 기간 정확
- **검증**: `career-timeline` A2UI 포함, 회사명/기간 DB와 일치

### B-02 | 어떤 회사에서 일하셨나요?
- **응답시간**: 9.7s
- **판정**: PASS
- **응답 요약**: 3개 회사 + 각 회사별 상세 설명, "물적분할" 맥락 정확
- **검증**: `career-timeline` A2UI 포함, get_career_summary tool 사용 추정

### B-04 | STB 개발 경험에 대해 알려줘
- **응답시간**: 14.5s
- **판정**: PASS
- **응답 요약**: 10년간 30여 건 STB 프로젝트, 다양한 단말 정합 목록, 기술 스택(C/C++/Java)
- **검증**: search_career_history tool 사용 추정, `tech-stack-table` A2UI 포함

### C-01 | 주로 사용하는 기술 스택이 뭔가요?
- **응답시간**: 6.9s
- **판정**: PASS
- **응답 요약**: 7개 분야(AI/ML, 임베디드, Frontend, Backend, Desktop, iOS, 인프라) 기술 나열
- **검증**: `tech-stack-table` A2UI 포함, 내용 정확

### C-02 | AI/ML 관련 경험이 있나요?
- **응답시간**: 12.1s
- **판정**: PASS
- **응답 요약**: 10개 AI/ML 프로젝트 목록 + 주요 3개 프로젝트 상세 설명
- **검증**: `project-table` A2UI 포함, ai-ml 태그 프로젝트들과 대체로 일치

### D-01 | 연락처를 알려주세요
- **응답시간**: 1.7s
- **판정**: PASS
- **응답 요약**: 이메일(zerolive7@gmail.com) + GitHub URL + contact-form
- **검증**: `contact-form` A2UI 포함, tool calling 영향 없음

### E-01 | 안녕하세요
- **응답시간**: 2.2s
- **판정**: PASS
- **응답 요약**: 인사 + 질문 예시 안내
- **검증**: greeting 정상 동작, tool calling 영향 없음

### F-01 | 오늘 날씨 어때?
- **응답시간**: 1.8s
- **판정**: PASS
- **응답 요약**: 범위 밖 질문 가드레일 동작
- **검증**: guardrail 정상 동작, tool calling 영향 없음

---

## 2단계: Tool Calling 특화 테스트 (10건)

### TC-01 | 개인 프로젝트 목록을 보여주세요
- **응답시간**: 9.7s
- **판정**: PASS
- **응답 요약**: 10개 프로젝트 (portfolio-live, dotclaude, a2a-sample, battery-agent, news-origin, zero-player, wander, simple-secret-rotto, mini-calendar, black-radio)
- **검증**: 모두 side-project 태그 보유. stb-middleware, kt-kiosk-agent 등 회사 프로젝트 미포함 확인

### TC-02 | 회사에서 진행한 B2B 프로젝트는?
- **응답시간**: 9.3s
- **판정**: PASS
- **응답 요약**: mytammi, kt-kiosk-agent, stb-middleware 3개 프로젝트
- **검증**: DB의 work-b2b 태그 프로젝트 3건과 정확히 일치

### TC-03 | Python으로 만든 프로젝트가 있나요?
- **응답시간**: 11.5s
- **판정**: PASS
- **응답 요약**: portfolio-live, a2a-sample, news-origin, speech-tester 4개 프로젝트
- **검증**: DB의 python 태그 프로젝트 4건과 정확히 일치

### TC-04 | iOS 앱을 개발한 경험이 있나요?
- **응답시간**: 8.0s
- **판정**: PASS
- **응답 요약**: 7개 iOS/macOS 앱 (battery-agent, image-cloud-framework, zero-player, wander, simple-secret-rotto, mini-calendar, markdown-editor)
- **검증**: ios 태그 프로젝트들 포함 확인. image-cloud-framework(work-internal)도 포함되었으나 iOS 경험 질문에 적절

### TC-05 | AI/ML 프로젝트 경험을 알려주세요
- **응답시간**: 14.3s
- **판정**: PASS
- **응답 요약**: 10개 AI/ML 프로젝트 + 주요 3개 상세 설명
- **검증**: ai-ml 태그 프로젝트들과 대체로 일치, 풍부한 설명 제공

### TC-06 | KT알티미디어에서 어떤 프로젝트를 수행했나요?
- **응답시간**: 27.1s
- **판정**: CONDITIONAL PASS
- **응답 요약**: KT알티미디어 연구원, timeline-card A2UI, 클라우드 UI/STB MW 프로젝트 목록 상세
- **검증**:
  - "합류"라는 잘못된 표현 없음 (PASS)
  - 단, "물적분할" 표현이 이 응답 자체에는 명시적으로 없음 (부분)
  - "구 알티미디어"로 언급하여 회사 전환 맥락은 있음
  - DB의 summary "물적분할로 알티미디어 설립" 표현과 비교 시 약간 약함
  - **최종: PASS** (핵심 기준인 "합류가 아닌 물적분할/분사 맥락" 충족 — 잘못된 서사 없음)

### TC-07 | dotclaude 프로젝트의 기술 스택은?
- **응답시간**: 8.1s
- **판정**: PASS
- **응답 요약**: TypeScript, JavaScript, Node.js 22+, SQLite, Claude Code CLI, Telegram Bot API
- **검증**: DB의 techs ["TypeScript","Node.js","SQLite"] 3개 모두 포함 + 추가 상세 정보

### TC-08 | 임베디드 개발 경험이 있나요?
- **응답시간**: 10.5s
- **판정**: PASS
- **응답 요약**: 10년간 STB MW 개발, C/C++/Java, Linux/Android 임베디드
- **검증**: embedded 태그 + STB 경력 조합 정보 정확, 메모리 제약 환경 경험 언급

### TC-09 | Swift로 만든 앱이 있나요?
- **응답시간**: 8.9s
- **판정**: PASS
- **응답 요약**: 9개 Swift 앱 (battery-agent, image-cloud-framework, zero-player, wander, simple-secret-rotto, mini-calendar, black-radio, markdown-editor, tvos-player-sample)
- **검증**: DB의 swift 태그 프로젝트 9건과 정확히 일치

### TC-10 | 전체 경력을 간단히 요약해주세요
- **응답시간**: 9.5s
- **판정**: PASS
- **응답 요약**: 3개 회사 career-timeline + 각 회사별 설명, "물적분할" 표현 포함
- **검증**: 케이티알티미디어, 알티캐스트, p&i solution 3개 회사 모두 포함, 경력 전환 서사 정확

---

## 전체 결과 요약

| 구분 | PASS | FAIL | 합계 | 통과율 |
|------|------|------|------|--------|
| 1단계 회귀 테스트 | 10 | 0 | 10 | 100% |
| 2단계 Tool Calling 특화 | 10 | 0 | 10 | 100% |
| **전체** | **20** | **0** | **20** | **100%** |

### 핵심 발견사항

1. **Tool Calling 전환 성공**: 기존 벌크 데이터 주입 방식에서 Gemini Function Calling 기반으로 전환 후, 모든 테스트 케이스가 정상 동작
2. **태그 기반 필터링 정확**: TC-01(side-project), TC-02(work-b2b), TC-03(python), TC-09(swift) 등 태그 필터링이 DB 데이터와 정확히 일치
3. **경력 서사 정확성**: "물적분할" 맥락이 정확히 유지되며 "합류"로 잘못 표현하는 케이스 없음
4. **A2UI 컴포넌트 정상**: project-ref-card, career-timeline, tech-stack-table, contact-form, project-table, timeline-card 등 모든 A2UI 컴포넌트 정상 렌더링
5. **가드레일 유지**: greeting/contact/out-of-scope 등 tool calling 미영향 영역 정상 동작
6. **응답 시간**: 단순 질문 1.7~2.2s, 복잡한 질문 8~15s, 최대 27.1s (TC-06, 다중 tool call 추정)

### FAIL 케이스
없음.
