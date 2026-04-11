# PortfolioLive - 개발/서비스 계획서

> 최종 업데이트: 2026-04-06

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **프로젝트명** | PortfolioLive |
| **목적** | 포트폴리오 웹 소개 + 자연어 대화형 Q&A |
| **대상 사용자** | 인사담당자, 스카우터 |
| **데이터 소스** | [leonardo204/Portfolio](https://github.com/leonardo204/Portfolio) (29개 프로젝트, 마크다운) |
| **배포 환경** | Linux PC (기존 서비스 공존, private port) |
| **상태** | 설계 단계 |

### 1.1 핵심 가치

- **인사담당자 관점**: 이력서 너머의 깊이 있는 정보를 자연어로 즉시 확인
- **차별화**: 정적 포트폴리오가 아닌, 대화로 탐색하는 라이브 포트폴리오

---

## 2. 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| **Frontend** | Next.js 15+ (App Router) | SSR + ISR, React Server Components |
| **Backend** | Next.js API Routes + FastAPI | Next.js: 웹/BFF, FastAPI: Agent 런타임 |
| **Agent Framework** | LangChain + LangGraph | 멀티 에이전트 오케스트레이션 |
| **Agent-UI 연동** | CopilotKit + AG-UI 프로토콜 | 에이전트 상태 실시간 동기화 |
| **Generative UI** | Google A2UI | 에이전트 → 선언형 UI 컴포넌트 생성 |
| **LLM** | Gemini 2.5/3.0 Pro & Flash | Smart 라우팅 (복잡도 기반 자동 선택) |
| **LLM 도구** | Gemini Web Search (Grounding) | 필요 시 실시간 웹 검색으로 최신 정보 보강 |
| **DB** | PostgreSQL (단일) | pgvector, 체크포인터, 채팅 로그, 세션, 캐시, 분석 전부 |
| **UI 컴포넌트** | shadcn/ui + Radix UI | 검증된 컴포넌트 셋 (직접 구현 금지) |
| **스타일링** | Tailwind CSS | 반응형, 모바일 우선 |
| **배포** | Docker Compose | private port, Linux PC |
| **Markdown 렌더링** | MDX + react-markdown | 채팅 내 마크다운 지원 |
| **i18n** | next-intl | 메인: 한국어, 서브: English |

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────────────────┐   ┌────────────────────────┐ │
│  │   Next.js (Web)      │   │  FastAPI (Agent)       │ │
│  │   :3100              │   │  :3101                 │ │
│  │                      │   │                        │ │
│  │  ┌─ Pages ────────┐  │   │  ┌─ LangGraph ──────┐ │ │
│  │  │ / (Portfolio)   │  │   │  │ Supervisor       │ │ │
│  │  │ /projects/[id]  │  │   │  │   ├─ Career     │ │ │
│  │  │ /admin          │  │   │  │   ├─ Technical  │ │ │
│  │  └────────────────┘  │   │  │   └─ (확장)      │ │ │
│  │                      │   │  └──────────────────┘ │ │
│  │  ┌─ API Routes ───┐  │   │                        │ │
│  │  │ /api/copilotkit │──│──▶│  CopilotKit Runtime   │ │
│  │  │ /api/github     │  │   │  (AG-UI + A2UI)       │ │
│  │  │ /api/admin      │  │   │                        │ │
│  │  └────────────────┘  │   └────────────────────────┘ │
│  └──────────────────────┘                               │
│                                                         │
│  ┌─────────────────────────────────┐                    │
│  │ PostgreSQL (pgvector)           │                    │
│  │ :5433 (private port)            │                    │
│  │ - pgvector (RAG 임베딩)          │                    │
│  │ - checkpoint (LangGraph 상태)    │                    │
│  │ - chat logs / sessions          │                    │
│  │ - analytics / cache             │                    │
│  └─────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
         ▲
         │ GitHub Webhook / Polling
         │
┌────────┴────────┐
│ leonardo204/     │
│ Portfolio        │
│ (29 projects)    │
└─────────────────┘
```

---

## 4. 에이전트 아키텍처

### 4.1 멀티 에이전트 구조 (LangGraph)

```
[사용자 메시지]
      │
      ▼
┌─────────────┐
│  Supervisor  │ ← Smart Router: 쿼리 복잡도 → 모델 선택
│  (Gemini     │   단순 → Flash, 복잡 → Pro
│   Flash)     │
└──────┬──────┘
       │ 의도 분류 + 라우팅
       ├──────────────────┐
       ▼                  ▼
┌─────────────┐   ┌──────────────┐
│ Career Agent│   │Technical Agent│
│ (Gemini Pro)│   │(Gemini Pro)  │
│             │   │              │
│ - 경력 궤적 │   │ - 기술 스택  │
│ - 역할/기여 │   │ - 아키텍처   │
│ - 성과/강점 │   │ - 코드 설명  │
│ - 문화 적합 │   │ - 문제 해결  │
└─────────────┘   └──────────────┘
       │                  │
       ▼                  ▼
┌─────────────────────────────┐
│     Portfolio RAG Tool      │
│  (pgvector + 마크다운 청크)  │
└─────────────────────────────┘
```

### 4.2 Smart 모델 라우팅

| 쿼리 유형 | 모델 | 이유 |
|-----------|------|------|
| 의도 분류 / 라우팅 | Flash | 빠른 응답, 저비용 |
| 단순 사실 질문 ("기술 스택은?") | Flash | 검색 결과 요약 |
| 복합 질문 ("왜 이 아키텍처를?") | Pro | 추론 필요 |
| 멀티턴 맥락 유지 | Pro | 깊은 맥락 이해 |
| 제안 생성 | Flash | 빠른 응답 |
| 웹 검색 보강 | Flash + Grounding | 최신 기술 트렌드 등 RAG 범위 밖 질문 |

에이전트 내부에서 `complexity_score`를 산출하여 모델을 자동 선택합니다.
Gemini Web Search (Grounding)는 RAG에서 충분한 컨텍스트를 찾지 못할 때 자동 활성화됩니다.

### 4.3 RAG 파이프라인

```
GitHub Portfolio → 마크다운 파싱 → 청크 분할 → 임베딩 → pgvector 저장
                                                         │
사용자 쿼리 → 쿼리 재작성 (멀티턴) → 임베딩 → 유사도 검색 ─┘
                                                         │
                                             컨텍스트 + 프롬프트 → LLM → 응답
```

**청크 전략:**
- 프로젝트별 섹션 단위 분할 (개요, 기능, 기술, 아키텍처, 도전/해결)
- 메타데이터 태깅: `{project, section, technologies, year, category}`
- 메인 README 테이블 → 프로젝트 인덱스 별도 저장

---

## 5. 서비스 시나리오

### 5.1 시나리오 분류

| # | 시나리오 | 에이전트 | UI 컴포넌트 |
|---|---------|---------|------------|
| S1 | 포트폴리오 둘러보기 | - | HeroSection, CareerTimeline, CompanyCard, PortfolioGrid |
| S2 | Portfolio 산출물 확인 | - | PortfolioCard, TechBadge, FilterBar |
| S3 | 채팅 시작 (인사/소개) | Supervisor | ChatPanel, WelcomeMessage, PreSuggestion |
| S4 | 경력 질문 | Career | ChatPanel, TimelineCard, SkillMatrix |
| S5 | 기술 질문 | Technical | ChatPanel, CodeBlock, DiagramCard |
| S6 | 프로젝트 심화 질문 | Career/Technical | ChatPanel, ProjectRefCard, A2UI Components |
| S7 | 비교/추천 질문 | Supervisor → Multi | ChatPanel, ComparisonTable |
| S8 | 연락처/채용 문의 | Supervisor | ChatPanel, ContactCard |
| S9 | 가드레일 (범위 밖/오남용) | Supervisor | FallbackMessage, SessionEndCard |

### 5.2 상세 시나리오 흐름

#### S3: 채팅 시작

```
[사용자가 채팅 패널 열기]
      │
      ▼
┌─ WelcomeMessage ──────────────────────────┐
│ "안녕하세요! 이용섭님의 포트폴리오           │
│  에이전트입니다.                             │
│  궁금한 점을 자유롭게 질문해주세요."          │
└───────────────────────────────────────────┘
      │
      ▼
┌─ PreSuggestion (3개) ─────────────────────┐
│ "어떤 기술 스택을 주로 사용하나요?"           │
│ "AI 프로젝트 경험을 알려주세요"               │
│ "최근 진행한 프로젝트는 무엇인가요?"          │
└───────────────────────────────────────────┘
```

#### S4: 경력 질문 (멀티턴)

```
[User] "AI 관련 경험이 어떻게 되나요?"
      │
      ▼
[Supervisor] → 의도: 경력 질문 → Career Agent
      │
      ▼
[Career Agent]
  1. 쿼리 → RAG 검색 (AI & Voice 프로젝트 6개)
  2. 경력 흐름 컨텍스트 결합
  3. 응답 생성
      │
      ▼
┌─ 응답 메시지 ─────────────────────────────┐
│ "2023년부터 AI/음성 서비스 개발에 집중하고   │
│  있습니다. STT/TTS 기반 음성 인식부터       │
│  LLM 멀티에이전트 시스템까지..."             │
│                                           │
│  [MyTammi 프로젝트 카드]  [SUMMA 카드]     │  ← A2UI 생성
│                                           │
│  혹시 특정 AI 기술(예: LangGraph, RAG)에   │  ← Post-suggestion
│  대해 더 자세히 알고 싶으신가요?             │    (응답에 자연스럽게 녹임)
└───────────────────────────────────────────┘

[User] "LangGraph로 뭘 만들었나요?"           ← 멀티턴 이어짐
      │
      ▼
[Career Agent]
  1. 쿼리 재작성: "AI 경험 맥락에서 LangGraph 활용 프로젝트"
  2. RAG 검색 → MyTammi, A2A Sample
  3. 이전 맥락 + 새 검색 결과 결합
```

#### S6: Thinking State 제공

```
[User] 복잡한 질문 입력
      │
      ▼
┌─ ThinkingIndicator ───────────────────────┐
│  ● 질문을 분석하고 있습니다...               │
│  ● 관련 프로젝트 3건을 검토 중입니다...       │
│  ● 답변을 정리하고 있습니다...               │
└───────────────────────────────────────────┘
      │
      ▼
[응답 스트리밍 시작]
```

CopilotKit의 `isRunning` + LangGraph `copilotkit_emit_state`로 중간 상태를 실시간 전달합니다.

---

## 6. UI/UX 설계

### 6.1 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **절대 촌스러우면 안 됨** | 개인 포트폴리오는 첫인상이 전부. 촌스러우면 즉시 이탈 |
| **검증된 UI 컴포넌트 사용** | 직접 만들지 않음. shadcn/ui, Radix 등 검증된 라이브러리 사용 |
| **No AI Feel** | AI 기술이 전면에 드러나지 않음. 자연스러운 도우미 느낌 |
| **Simple & Tidy** | 최소 색상 (3-4), 최소 폰트 (2), 넉넉한 여백 |
| **No Excessive Animation** | 트랜지션 150-200ms, ease-in-out. 장식적 애니메이션 배제 |
| **Responsive** | 모바일 우선 설계. 320px ~ 1440px |
| **Professional** | Anthropic, Linear, Vercel 수준의 깔끔한 레이아웃 |

### 6.2 UI 라이브러리 / 컴포넌트 셋

| 도구 | 용도 |
|------|------|
| **shadcn/ui** | 기본 UI 컴포넌트 (Button, Card, Accordion, Badge, Dialog 등) |
| **Radix UI** | 접근성 보장된 headless 컴포넌트 (shadcn 내부 사용) |
| **Tailwind CSS** | 스타일링 |
| **Framer Motion** | 최소한의 트랜지션/인터랙션 (과하지 않게) |
| **Lucide Icons** | 아이콘 셋 (일관된 선 굵기) |
| **react-markdown + remark-gfm** | 채팅 내 마크다운 렌더링 |

직접 CSS로 컴포넌트를 만들지 않습니다. 검증된 라이브러리의 컴포넌트를 조합합니다.

### 6.2 색상 팔레트

```
Background:  #ffffff (white)
Text:        #111827 (gray-900)
Secondary:   #6b7280 (gray-500)
Border:      #e5e7eb (gray-200)
Surface:     #f9fafb (gray-50)
Accent:      #2563eb (blue-600)  ← 최소 사용
```

### 6.3 페이지 구조

```
┌─────────────────────────────────────────┐
│  Header (이름, 네비게이션)                 │
├─────────────────────────────────────────┤
│                                         │
│  Hero Section                           │
│  - 간결한 소개                            │
│  - 경력 키워드 (16년, 3사)                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Career Section                         │
│  - 수직 타임라인 (회사별)                  │
│  - 회사 카드 (펼침/접힘)                   │
│  - 경력 흐름 시각화                       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Portfolio Section                      │
│  - GitHub 산출물 카드 그리드               │
│  - 카테고리 필터                          │
│  (leonardo204/Portfolio 서브프로젝트)      │
│                                         │
├─────────────────────────────────────────┤
│  Footer                                │
└─────────────────────────────────────────┘

┌─ Chat Panel (우측/하단) ─────────────────┐
│  [접힌 상태] 작은 트리거 바                 │
│  [펼친 상태] 채팅 UI (페이지 내 자연스럽게)  │
└─────────────────────────────────────────┘
```

**데이터 소스 및 노출 정책:**

| 데이터 | 소스 | 정적 페이지 | 채팅 | 관리 |
|--------|------|-----------|------|------|
| Portfolio 산출물 | GitHub `leonardo204/Portfolio` | O | O | GitHub Webhook/ISR |
| 경력 (회사/기간/부서/직급) | Admin 입력 | O | O | Admin CRUD |
| 회사 수행 프로젝트 (제목/설명) | Admin 입력 | **X** | O (채팅만) | Admin CRUD |
| 이메일 | Admin 설정 | O (표시 가능) | O | Admin |
| 연봉/전화번호 등 민감정보 | Admin 설정 | **X** | **X** | Admin |

### 6.4 Career Section 상세

인사담당자가 가장 먼저 확인하는 정보이므로 Projects보다 위에 배치합니다.

#### 레이아웃: 수직 타임라인 + 회사 카드

```
데스크톱 (좌: 타임라인 축 / 우: 카드)
─────────────────────────────────────────────

          ●  현재
          │
  ┌───────┴──────────────────────────────┐
  │  케이티알티미디어         2019.12 ~ 현재  │
  │  대기업 · 제품혁신팀 · 연구원 · 서울      │
  │                                      │
  │  ┌─ 기술 전환 ───────────────────┐    │
  │  │ STB 클라우드 → 플레이어 →       │    │
  │  │ AI 에이전트                    │    │
  │  └──────────────────────────────┘    │
  │                                      │
  │  [프로젝트 보기 ▼]  ← 클릭 시 펼침     │
  │  ┌──────────────────────────────┐    │
  │  │ · LGHV 일체화 (2021-2022)     │    │
  │  │ · InAppTV iOS (2022)         │    │
  │  │ · Tizen inApp-TV (2022-2023) │    │
  │  │ · KT AI 키오스크 (2023)       │    │
  │  └──────────────────────────────┘    │
  └──────────────────────────────────────┘
          │
          │  6년+
          │
  ┌───────┴──────────────────────────────┐
  │  알티캐스트               2012.09 ~ 2019.12 │
  │  중견기업 · 미디어기술팀 · 연구원 · 서울    │
  │                                      │
  │  ┌─ 핵심 역할 ───────────────────┐    │
  │  │ STB UI/UX 개발 · Windmill     │    │
  │  │ 프레임워크 · 다수 방송사 정합     │    │
  │  └──────────────────────────────┘    │
  │                                      │
  │  [프로젝트 보기 ▼]                     │
  └──────────────────────────────────────┘
          │
          │  7년 2개월
          │
  ┌───────┴──────────────────────────────┐
  │  p&i solution          2010.03 ~ 2012.07  │
  │  CAD/CAE · 대리 · 수원                    │
  └──────────────────────────────────────┘
          │
          ●  시작
```

#### 모바일 레이아웃

```
모바일 (풀 너비 카드, 세로 스택)
─────────────────────────

  ● 현재
  │
  ┌─────────────────────┐
  │ 케이티알티미디어       │
  │ 2019.12 ~ 현재       │
  │ 제품혁신팀 · 연구원    │
  │ ─────────────────── │
  │ STB → 플레이어 → AI  │
  │ [프로젝트 4건 ▼]      │
  └─────────────────────┘
  │
  ┌─────────────────────┐
  │ 알티캐스트            │
  │ 2012.09 ~ 2019.12   │
  │ 미디어기술팀 · 연구원  │
  │ ─────────────────── │
  │ STB UI/UX 개발       │
  │ [프로젝트 4건 ▼]      │
  └─────────────────────┘
  │
  ┌─────────────────────┐
  │ p&i solution        │
  │ 2010.03 ~ 2012.07   │
  │ CAD/CAE · 대리       │
  └─────────────────────┘
  │
  ● 시작
```

#### UI 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| `CareerTimeline` | 수직 타임라인 축 (점 + 선) |
| `CompanyCard` | 회사 정보 카드 (회사명, 기간, 부서, 직급, 지역) |
| `CompanyBadge` | 기업 분류 배지 (대기업/중견/기타) — 색상 구분 |
| `TechTransition` | 기술 전환 흐름 태그 (CAD→STB→AI) |
| `ProjectAccordion` | 회사별 프로젝트 목록 (접힘/펼침) |
| `DurationBar` | 근속 기간 시각화 바 |

#### 디자인 원칙

- **최신 경력이 위**: 인사담당자는 최근 경력부터 확인
- **기업 분류 배지**: 대기업(accent), 중견기업(secondary), 기타(muted) — 색상은 미니멀하게
- **프로젝트 접힘 기본**: 카드는 간결하게, 관심 있으면 펼쳐서 확인
- **기술 전환 강조**: 각 회사에서의 핵심 역할/기술 변화를 한 줄로 표현
- **근속 기간**: 타임라인 축에 기간 표시 (시각적 비중 = 실제 기간 비례)
- **연봉 정보 미표시**: 절대 UI에 노출하지 않음

### 6.4 Chat UI/UX 동작

| 상태 | 동작 | 구현 |
|------|------|------|
| **접힌 상태** | 하단에 슬림 바 ("궁금한 점이 있으신가요?") | height: 48px, 클릭/터치로 확장 |
| **펼침** | 아래에서 위로 슬라이드 (모바일) / 우측 패널 (데스크톱) | transition 200ms |
| **대화 중** | 메시지 스트리밍, thinking 표시, suggestion chips | CopilotKit ChatView |
| **사라짐** | 외부 클릭 또는 닫기 버튼 → 부드럽게 축소 | opacity + height transition |

**모바일**: 하단 시트(bottom sheet) 형태로 올라옴 (높이 60-80%)
**데스크톱**: 우측 사이드 패널 (width: 400px) 또는 인라인 확장

---

## 7. GitHub 데이터 동기화

### 7.1 동기화 전략

```
┌─ 방법 1: GitHub Webhook (권장) ───────────┐
│                                           │
│  Portfolio push → Webhook → /api/github   │
│       → 마크다운 재파싱                      │
│       → 임베딩 업데이트                      │
│       → ISR 재검증                          │
└───────────────────────────────────────────┘

┌─ 방법 2: 주기적 Polling (폴백) ─────────────┐
│                                             │
│  Cron (매 시간) → GitHub API → 변경 감지     │
│       → 변경된 프로젝트만 업데이트              │
└─────────────────────────────────────────────┘
```

### 7.2 데이터 파이프라인

```
GitHub API (마크다운 fetch)
    │
    ▼
마크다운 파싱 (섹션별 분리)
    │
    ├─ 프로젝트 메타데이터 → PostgreSQL (projects 테이블)
    ├─ 섹션 청크 → 임베딩 → pgvector (embeddings 테이블)
    └─ 원본 마크다운 → 캐시 (렌더링용)
```

Portfolio 레포의 마크다운 구조가 일관적(개요/기능/기술/아키텍처/도전해결)이므로 섹션 단위 파싱이 효과적입니다.

---

## 8. Admin 기능

| 기능 | 설명 | 우선순위 |
|------|------|---------|
| **경력 관리** | 회사 CRUD (회사명, 기간, 부서, 직급, 지역, 분류) | P0 |
| **회사 프로젝트 관리** | 회사별 수행 프로젝트 CRUD (연도, 제목, 간단 설명) — 채팅 전용 RAG 소스 | P0 |
| **프로필/연락처** | 이름, 이메일, LinkedIn, GitHub URL, 면접 가능 여부 등 | P0 |
| **연락 요청 관리** | 수신된 연락 요청 목록, 읽음 처리, 메일 발송 로그 | P0 |
| **대시보드** | 방문자 수, 채팅 수, 인기 질문 통계 | P0 |
| **채팅 로그** | 전체 대화 이력 조회/검색 | P0 |
| **콘텐츠 동기화** | GitHub Portfolio 수동 동기화 트리거, 상태 확인 | P0 |
| **질문 분석** | 자주 묻는 질문 TOP N, 미답변 질문 | P1 |
| **방문자 추적** | 리퍼러, 체류 시간, 페이지별 조회 | P1 |
| **에이전트 모니터링** | 응답 시간, 모델 사용량, 에러율 | P1 |
| **응답 품질 관리** | 답변 정확도 리뷰, 피드백 수집 | P2 |

**인증**: 환경변수 기반 암호 (`ADMIN_PASSWORD`) + 서버사이드 세션 쿠키
- 암호: `.env`에 설정
- 메인 페이지 Footer에 Admin 링크 (눈에 띄지 않게)
- `/admin/login` → 암호 입력 → 세션 쿠키 발급 → `/admin` 접근

### 8.1 개인정보 관리 (Admin)

에이전트가 참조하는 프로필 정보를 Admin에서 관리합니다.

| 항목 | 소스 | 에이전트 노출 방식 |
|------|------|-------------------|
| 이름, bio | Admin 설정 | 공개 (정적 페이지 + 채팅) |
| 이메일 | Admin 설정 | 공개 (민감개인정보 아님) |
| LinkedIn, GitHub URL | Admin 설정 | 공개 (링크 제공) |
| 면접 가능 여부 | Admin 설정 (토글) | 공개 (채팅 응답) |
| 전화번호 | Admin 설정 | **비공개 (민감개인정보)** |
| 연봉 | Admin 설정 | **비공개 (민감개인정보)** |

### 8.2 연락 요청 (Contact Request)

사용자가 "연락하고 싶다", "이메일을 알려달라" 등 요청 시:

```
[User] "연락처를 알 수 있나요?" / "연락하고 싶어요"
    │
    ▼
[에이전트: 직접 노출 대신 연락 폼 제시]
"직접 메시지를 남겨주시면 이용섭님께 전달해드릴게요."
    │
    ▼
[A2UI: ContactForm]
┌────────────────────────────────┐
│  이름:     [____________]      │
│  소속:     [____________]      │
│  이메일:   [____________]      │
│  메시지:   [____________]      │
│           [전달하기]            │
└────────────────────────────────┘
    │
    ▼
[서버 사이드]
  1. Admin 설정의 이메일로 대리 발송
  2. contact_requests 테이블에 저장
  3. 사용자에게: "전달해드렸습니다. 감사합니다."
```

**오남용 방지:**

| 제한 | 값 | 처리 |
|------|-----|------|
| 세션당 발송 | 최대 1회 | 2회째부터: "이미 메시지를 전달해드렸어요. 확인 후 연락드릴 거예요." |
| IP당 일일 발송 | 최대 3회 | 초과 시: "오늘은 메시지 전달이 어렵습니다. 내일 다시 시도해주세요." |
| 내용 검증 | 최소 길이 10자 | 빈 내용/스팸 방지 |

Admin에서 수신된 연락 요청을 확인하고 읽음 처리할 수 있습니다.

---

## 9. 데이터베이스 스키마 (개요)

```sql
-- PostgreSQL (단일 인스턴스)

-- ═══ Admin 관리 데이터 ═══

-- 경력 (Admin CRUD)
careers (id, company, company_type, department, position, location, started_at, ended_at, is_current, tech_transition, summary, sort_order)

-- 회사 수행 프로젝트 (Admin CRUD, 채팅 전용 — 정적 페이지 미노출)
work_projects (id, career_id, year, title, description, created_at)

-- 프로필 설정 (Admin)
admin_settings (key, value, is_public, updated_at)
-- is_public=true:  owner_name, owner_email, bio, linkedin_url, github_url, available_for_interview
-- is_public=false: owner_phone, salary 등 민감정보

-- ═══ GitHub 연동 데이터 ═══

-- Portfolio 산출물 (GitHub 자동 동기화)
portfolio_projects (id, slug, title, description, category, technologies[], year, github_url, readme_raw, last_synced_at, updated_at)

-- ═══ RAG ═══

-- 임베딩 (Portfolio + 회사 프로젝트 + 경력 데이터)
embeddings (id, source_type, source_id, section, content, embedding vector(768), metadata jsonb, chunk_index, total_chunks)
-- source_type: 'portfolio' | 'work_project' | 'career'

-- ═══ 채팅 ═══

chat_sessions (id, visitor_id, ip_address, user_agent, referrer, started_at, ended_at, message_count)
chat_messages (id, session_id, role, content, model_used, tokens_used, cost, latency_ms, created_at)

-- ═══ 분석/보안 ═══

page_views (id, path, referrer, visitor_id, created_at)
chat_analytics (id, session_id, question_intent, satisfaction, created_at)
guardrail_events (id, session_id, ip_address, violation_type, message, created_at)
contact_requests (id, session_id, name, organization, email, message, ip_address, is_read, created_at)

-- ═══ 시스템 ═══

checkpoints (thread_id, checkpoint_id, state jsonb, created_at)
cache_store (key, value jsonb, expires_at)
```

---

## 10. Docker Compose 구성

```yaml
# docker-compose.yml
services:
  web:                    # Next.js (standalone) + CopilotKit Runtime
    build: ./web
    ports: ["3100:3000"]
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    networks: [app]

  agent:                  # FastAPI + LangGraph
    build: ./agent
    ports: ["3101:8000"]
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    networks: [app]

  postgres:
    image: pgvector/pgvector:pg16
    ports: ["127.0.0.1:5433:5432"]  # loopback 전용 바인딩 (외부 노출 금지)
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks: [app]

networks:
  app:
    driver: bridge

volumes:
  pgdata:
```

**배포 스크립트:**
- `deploy.sh` — 원샷 배포: `down → build → up`
- `.env`는 `docker-compose.yml`과 동일 디렉토리에 위치, `env_file`로 각 컨테이너에 주입
- 개발: `pnpm dev` (Next.js) + `uvicorn` (FastAPI)
- 프로덕션: `./deploy.sh` 실행

**서비스 간 통신:**
- `web` → `agent`: `http://agent:8000` (Docker 내부 네트워크)
- `web` → `postgres`: `postgres:5432`
- `agent` → `postgres`: `postgres:5432`
- 외부 접근: `localhost:3100` (개발), 추후 Cloudflare Tunnel로 HTTPS 제공

**CopilotKit Runtime 위치:** Next.js 측 (`/api/copilotkit` → FastAPI의 LangGraph 에이전트 연결)

---

## 11. 구현 단계

### Phase 1: 기반 (1주차)

- [ ] **PoC: CopilotKit + LangGraph + A2UI 최소 동작 검증** (핵심 리스크)
- [ ] 프로젝트 구조 생성 (Next.js + FastAPI)
- [ ] Docker Compose 기본 구성 (healthcheck, private ports)
- [ ] PostgreSQL + pgvector 세팅 (Prisma 마이그레이션)
- [ ] GitHub 데이터 파이프라인 (fetch → parse → store)
- [ ] 기본 RAG 파이프라인 (Gemini Embedding 768dim + 검색)

### Phase 2: 포트폴리오 웹 (2주차)

- [ ] shadcn/ui + Tailwind 디자인 시스템 세팅
- [ ] 메인 페이지 (Hero + Career Timeline + Portfolio 산출물 그리드)
- [ ] 반응형 레이아웃 + 모바일 최적화
- [ ] GitHub Portfolio 데이터 연동 (ISR)
- [ ] Admin: 회사 수행 프로젝트 CRUD (채팅 에이전트 RAG 소스)

### Phase 3: 채팅 서비스 (3주차)

- [ ] LangGraph 에이전트 구현 (Supervisor + Career + Technical)
- [ ] Smart 모델 라우팅
- [ ] CopilotKit 연동 (AG-UI)
- [ ] Chat UI 컴포넌트 (펼침/접힘, 스트리밍)
- [ ] Thinking state 표시
- [ ] Pre-suggestion / Post-suggestion
- [ ] 가드레일 (서비스 범위 판정 + fallback 응답 + 세션 종료 정책)
- [ ] Gemini Web Search (Grounding) 연동

### Phase 4: 고도화 (4주차)

- [ ] A2UI 통합 (에이전트 생성 UI 컴포넌트)
- [ ] 멀티턴 쿼리 재작성
- [ ] GitHub Webhook 연동
- [ ] Admin 대시보드
- [ ] 방문자 분석

### Phase 5: 안정화

- [ ] 성능 최적화 (캐싱, lazy loading)
- [ ] 에러 핸들링 / 폴백
- [ ] 모니터링 / 로깅
- [ ] 보안 검토 (rate limiting, input validation)

---

## 12. 핵심 기술 결정 사항

| 결정 | 선택 | 이유 |
|------|------|------|
| Agent-UI 프로토콜 | CopilotKit (AG-UI) | LangGraph 네이티브 통합, 상태 실시간 동기화 |
| Generative UI | Google A2UI | CopilotKit 공식 지원, 선언형 안전 렌더링 |
| 벡터 DB | pgvector (PostgreSQL 내장) | 별도 서비스 불필요, 단순 구조 원칙 |
| 체크포인터 | PostgreSQL (단일 DB) | 메모리/영구 DB 1개 공통 사용 원칙 |
| 세션/캐시 | PostgreSQL (cache_store 테이블) | 단일 DB 원칙, Redis 제거 |
| 웹 검색 | Gemini Grounding (Web Search) | RAG 범위 밖 질문 보강 |
| 가드레일 | Supervisor 내장 + 사전 정의 fallback | 서비스 범위 보호, 오남용 방지 |
| 이미지 최적화 | Next.js Image | 자동 최적화, WebP 변환 |
| 마크다운 렌더링 | react-markdown + remark-gfm | 채팅 내 마크다운 지원 |

---

## 13. 가드레일 (Guardrail)

### 13.1 서비스 범위 정의

| 범위 | 허용 | 차단 |
|------|------|------|
| **포트폴리오 관련** | 경력, 기술, 프로젝트, 역할, 강점 | - |
| **채용 관련** | 연락처, 면접 가능 여부, 협업 스타일 | - |
| **일반 대화** | 인사, 감사 | 잡담, 일상 질문 |
| **기술 일반** | 포트폴리오 기술 맥락 내 설명 | 코딩 과외, 디버깅 요청 |
| **차단** | - | 개인정보 요구, 해킹/악용, 정치/종교, 부적절 콘텐츠 |

### 13.2 처리 방식

```
[사용자 메시지]
      │
      ▼
[Supervisor: 가드레일 판정]
      │
      ├─ ALLOW → 정상 에이전트 라우팅
      │
      ├─ SOFT_BLOCK → 사전 정의 fallback 응답 (LLM 미사용)
      │   "포트폴리오와 경력에 관한 질문에 답변드리고 있어요.
      │    다른 궁금한 점이 있으시면 말씀해주세요."
      │
      └─ HARD_BLOCK → 사전 정의 fallback 응답 (LLM 미사용)
          "죄송합니다. 해당 요청은 처리할 수 없습니다."
```

**핵심**: 가드레일 판정 시 LLM을 사용하지 않고 사전 정의된 응답을 반환합니다. 비용 절감 + 일관된 응답.

### 13.3 반복 위반 시 세션 종료 정책

| 위반 횟수 | 대응 |
|-----------|------|
| 1회 | 부드러운 안내 + 서비스 범위 재안내 |
| 2회 | 명확한 경고 + pre-suggestion으로 유도 |
| 3회 | "도움이 필요하신 부분이 있으시면 이메일로 연락 부탁드립니다." + 입력 비활성화 |

세션 종료 시에도 공격적이지 않은 톤을 유지합니다. `guardrail_events` 테이블에 기록하여 Admin에서 모니터링합니다.

### 13.4 Fallback 응답 풀

```python
FALLBACK_RESPONSES = {
    "out_of_scope": [
        "포트폴리오와 경력에 관한 질문에 답변드리고 있어요. 궁금한 점이 있으시면 말씀해주세요.",
        "저는 이용섭님의 포트폴리오 에이전트예요. 경력이나 프로젝트에 대해 물어봐주세요.",
    ],
    "abuse": [
        "죄송합니다. 해당 요청은 처리할 수 없습니다.",
    ],
    "session_limit": [
        "추가 문의 사항이 있으시면 이메일로 연락 부탁드립니다. 감사합니다.",
    ],
}
```

---

## 14. API 엔드포인트

모든 API는 `/api/v1/` 접두사를 사용합니다.

### Public API (Next.js)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/copilotkit` | CopilotKit Runtime (AG-UI SSE → FastAPI LangGraph) |
| POST | `/api/v1/contact` | 연락 폼 제출 (rate limit: 세션 1회, IP 일 3회) |
| POST | `/api/v1/github/webhook` | GitHub Webhook 수신 (서명 검증) |
| GET | `/api/v1/portfolio` | Portfolio 프로젝트 목록 (ISR 캐시) |
| GET | `/api/v1/careers` | 경력 데이터 (공개 정보만) |

### Admin API (Next.js, 인증 필수)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/admin/login` | 암호 검증 → 세션 쿠키 발급 |
| POST | `/api/v1/admin/logout` | 세션 삭제 |
| CRUD | `/api/v1/admin/careers` | 경력 관리 |
| CRUD | `/api/v1/admin/work-projects` | 회사 수행 프로젝트 관리 |
| CRUD | `/api/v1/admin/settings` | 프로필/연락처 설정 |
| GET | `/api/v1/admin/chat-logs` | 채팅 로그 조회 |
| GET | `/api/v1/admin/contacts` | 연락 요청 목록 |
| PATCH | `/api/v1/admin/contacts/:id` | 연락 요청 읽음 처리 |
| GET | `/api/v1/admin/dashboard` | 통계 데이터 |
| POST | `/api/v1/admin/sync` | GitHub 수동 동기화 트리거 |

### Agent API (FastAPI, 내부 전용)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/agent/invoke` | LangGraph 에이전트 실행 (CopilotKit에서 호출) |
| GET | `/agent/health` | 에이전트 헬스체크 |

---

## 15. 기술 결정 상세

### 15.1 임베딩 모델

- **모델**: Gemini Text Embedding (`text-embedding-004`, 768 dim)
- **이유**: LLM과 동일 벤더, DB 스키마 `vector(768)`과 일치

### 15.2 이메일 발송

- **수단**: Gmail SMTP (`smtp.gmail.com:587`)
- **발신**: 본인 Gmail 계정 (앱 비밀번호 사용)
- **환경변수**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `ADMIN_EMAIL`

### 15.3 배포/네트워크

- **개발**: `localhost:3100` (Next.js), `localhost:3101` (FastAPI)
- **프로덕션**: Cloudflare Tunnel → `localhost:3100`
- **HTTPS**: Cloudflare가 자동 제공

### 15.4 DB 마이그레이션

- **도구**: Prisma (Next.js 측에서 스키마 관리 단일화)
- **이유**: Next.js + FastAPI 양쪽에서 같은 DB 사용 → 마이그레이션 주체를 하나로

### 15.5 에이전트 에러 핸들링

| 상황 | 대응 |
|------|------|
| Gemini API 타임아웃 (30s) | 재시도 1회 → 실패 시 "잠시 후 다시 시도해주세요" |
| Gemini 할당량 초과 | "현재 요청이 많습니다. 잠시 후 다시 시도해주세요" |
| RAG 검색 결과 0건 | Gemini Grounding으로 보강 → 그래도 없으면 "관련 정보를 찾지 못했습니다" |
| LangGraph 노드 예외 | 해당 노드 스킵 → Supervisor가 직접 응답 |

### 15.6 MVP 언어 정책

- MVP는 **한국어 단일**로 구현
- English i18n은 Phase 5 이후 (next-intl 적용)
- Stitch 디자인의 영문은 레이아웃 참고용

### 15.7 PoC 우선 검증 (Phase 1 초기)

CopilotKit + A2UI + LangGraph 통합이 프로젝트 핵심 리스크.
Phase 1 첫 주에 **최소 동작 PoC** 구성:
- CopilotKit Runtime (Next.js) → LangGraph (FastAPI) 연결
- 단순 echo 에이전트로 AG-UI SSE 스트리밍 확인
- A2UI 미지원 시 폴백: CopilotKit `useCopilotAction` 기본 렌더링

---

## 16. 보안 고려사항

- API 키는 `.env`에만 저장, 절대 커밋 금지
- Admin 인증 필수
- GitHub Webhook 서명 검증
- Rate limiting (채팅 API, PostgreSQL 기반 카운터)
- Input sanitization (XSS 방지)
- CORS 설정 (허용 도메인 제한)
- 가드레일로 LLM 오남용 방지 (섹션 13 참조)

---

## 참고 자료

### 핵심 기술 문서
- [CopilotKit 공식 문서](https://docs.copilotkit.ai) — AG-UI 프로토콜, CoAgent, LangGraph 통합
- [Google A2UI](https://a2ui.org/) — 에이전트 기반 선언형 UI 프로토콜 (v0.8)
- [LangGraph 문서](https://docs.langchain.com/oss/python/langgraph) — 멀티 에이전트, 체크포인터
- [Next.js App Router](https://nextjs.org/docs) — SSR, ISR, Server Components

### 프로토콜 / 표준
- [AG-UI 프로토콜](https://github.com/ag-ui-protocol/ag-ui) — 17개 이벤트 타입, SSE 기반 실시간 통신
- CopilotKit v1.50+: A2UI 전체 지원, useAgent 훅

### 에이전트 패턴
- LangGraph Supervisor: 중앙 라우팅 + 전문 에이전트 위임
- Smart Routing: complexity_score 기반 모델 자동 선택 (Flash/Pro)
- Agentic RAG: 쿼리 재작성 → 검색 → 품질 평가 → 응답
