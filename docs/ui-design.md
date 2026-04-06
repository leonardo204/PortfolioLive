# PortfolioLive - UI 화면 설계 (Google Stitch)

> 최종 업데이트: 2026-04-06
> 도구: [Google Stitch](https://stitch.withgoogle.com/)

---

## 개요

Google Stitch를 사용하여 주요 화면의 UI/UX 프로토타입을 생성합니다.
각 화면별 Stitch 프롬프트를 아래에 정리합니다.

### 대상 화면

| # | 화면 | 목적 | 실제 개발 활용도 |
|---|------|------|----------------|
| 1 | 메인 페이지 (Hero + Career) | 전체 톤/무드/레이아웃 확정 | 높음 — 메인 레이아웃 기준 |
| 2 | 채팅 패널 (펼친 상태) | 채팅 UI/UX, 메시지 스타일 확정 | 높음 — 채팅 컴포넌트 기준 |
| 3 | Admin 대시보드 | 관리 화면 레이아웃 확정 | 중간 — 구조 참고용 |

### 디자인 방향

- **참고**: Anthropic console, Linear, Vercel 사이트의 깔끔한 느낌
- **톤**: Professional, minimal, confident. AI 느낌 나면 안 됨
- **색상**: 흰 배경, 어두운 텍스트, 최소한의 accent (blue-600)
- **타이포**: Sans-serif (Inter), 넉넉한 줄 간격
- **절대 안 됨**: 촌스러운 디자인, 과도한 그라데이션, 화려한 애니메이션, AI 챗봇 느낌

---

## 화면 1: 메인 페이지 (Desktop)

### 구성

```
Header → Hero → Career Timeline → Portfolio Grid → Footer
```

- Hero: 이름, 한 줄 소개, 경력 키워드
- Career: 수직 타임라인, 회사 카드 3개 (최신이 위)
- Portfolio: GitHub 산출물 카드 그리드
- 우하단에 채팅 트리거 바

### Stitch 프롬프트

```
Design a professional portfolio website for a senior software engineer.
The page should feel like Anthropic's or Linear's website — clean, minimal, 
confident, with lots of whitespace. NOT an AI-themed site.

Use Tailwind CSS. Color: white background (#ffffff), dark text (#111827), 
minimal blue accent (#2563eb). Font: Inter or system sans-serif.

Page structure (single page, scroll):

1. HEADER
   - Left: Name "Yongsub Lee" in semibold
   - Right: minimal nav links ("Career", "Portfolio", "Contact")
   - Sticky, white background with subtle border-bottom

2. HERO SECTION
   - Large heading: "Software Engineer"
   - Subheading: "Embedded · Cross-Platform · AI Services"
   - Brief one-liner: "16 years of experience across 3 companies, 
     from set-top box middleware to AI multi-agent systems."
   - Clean, no hero image, no gradients. Just typography and whitespace.

3. CAREER TIMELINE SECTION
   - Section title: "Career" with a thin horizontal rule
   - Vertical timeline on the left (thin gray line with dots)
   - 3 company cards stacked vertically (newest first):
   
   Card 1 (current):
     - Badge: "Enterprise" (small, muted blue)
     - Company: "KT Altimedia" 
     - Period: "2019.12 — Present" with "6+ years" tag
     - Role: "Product Innovation Team · Researcher · Seoul"
     - One-line summary: "STB Cloud → Cross-platform Players → AI Agents"
     - Expandable "Projects" accordion (collapsed by default, show "4 projects")
   
   Card 2:
     - Badge: "Mid-size" (small, muted gray)
     - Company: "Alticast"
     - Period: "2012.09 — 2019.12" with "7y 2m" tag  
     - Role: "Media Tech Team · Researcher · Seoul"
     - Summary: "STB UI/UX Development · Windmill Framework"
     - Collapsed accordion: "4 projects"
   
   Card 3:
     - Badge: "Other" (small, light gray)
     - Company: "P&I Solution"
     - Period: "2010.03 — 2012.07" with "2y 4m" tag
     - Role: "CAD/CAE · Assistant Manager · Suwon"
     - No accordion (no listed projects)

   Cards should have subtle border, rounded corners, hover shadow.
   The timeline dots should visually represent relative duration.

4. PORTFOLIO SECTION
   - Section title: "Portfolio" with thin horizontal rule
   - Filter bar: "All", "AI & Voice", "STB", "Side Project" tabs
   - 3-column card grid (2 on tablet, 1 on mobile)
   - Each card: title, one-line description, tech badges (small pills), 
     subtle border, no image
   - Show 6 sample cards with placeholder project names

5. FOOTER
   - Minimal: "© 2026 Yongsub Lee" left, GitHub icon link right
   - Light gray background (#f9fafb)

6. CHAT TRIGGER (bottom-right)
   - Slim horizontal bar at the very bottom of viewport
   - Text: "Have any questions?" 
   - Height: 48px, dark background (#111827), white text
   - Subtle, not a floating bubble. Feels like part of the page.

Overall feel: A recruiter lands on this page and immediately sees 
a well-organized, professional profile. No clutter. No gimmicks. 
Typography-driven design.
```

---

## 화면 1-M: 메인 페이지 (Mobile)

### Stitch 프롬프트

```
Design the mobile version (375px width) of the same portfolio website.

Same design language: clean, minimal, white background, Inter font, 
minimal blue accent.

Adaptations for mobile:
- Header: Name left, hamburger menu right
- Hero: Smaller heading, same content, more vertical padding
- Career Timeline: Full-width cards stacked vertically, 
  timeline line on the left edge, compact card layout
- Portfolio: Single column card grid
- Footer: Centered, stacked
- Chat trigger: Full-width bar at bottom, fixed position

The mobile version should feel just as polished as desktop. 
No cramped layouts. Generous touch targets (min 44px).
```

---

## 화면 2: 채팅 패널 (Desktop, 펼친 상태)

### 구성

채팅이 펼쳐진 상태의 메인 페이지. 오른쪽에 채팅 패널이 슬라이드인.

### Stitch 프롬프트

```
Design a portfolio website with an open chat panel on the right side.

Left side (main content, slightly dimmed/narrowed):
- The career timeline page from before, visible but secondary

Right side (chat panel, 400px wide):
- White background, left border (#e5e7eb)
- Header: "Chat" title left, close (X) button right, border-bottom
- Chat area with conversation:

  Message 1 (system, left-aligned):
    Light gray bubble (#f9fafb), rounded corners
    "안녕하세요! 이용섭님의 포트폴리오 에이전트입니다.
     경력, 기술, 프로젝트에 대해 자유롭게 질문해주세요."

  3 suggestion chips below the welcome message:
    Outlined pills, subtle border, clickable look
    "어떤 기술을 주로 사용하나요?"
    "AI 프로젝트 경험을 알려주세요"
    "최근 프로젝트는 무엇인가요?"

  Message 2 (user, right-aligned):
    Blue bubble (#2563eb), white text
    "AI 관련 경험이 어떻게 되나요?"

  Message 3 (agent, left-aligned):
    Gray bubble with markdown-rendered content:
    "2023년부터 AI/음성 서비스 개발에 집중하고 있습니다.
     
     - STT/TTS 기반 음성 인식 서비스
     - LLM 기반 멀티에이전트 시스템
     - Electron 기반 데스크톱 도구"
    
    Below the text, 2 small inline project reference cards:
      Each card: project title, one-line tech stack, subtle border
      "MyTammi — NestJS, Vue 3, Gemini"
      "SUMMA v2 — Tauri, Rust, Whisper"
    
    The response ends naturally with:
    "특히 LangGraph를 활용한 멀티에이전트 시스템도 구축했는데,
     이 부분이 더 궁금하시면 말씀해주세요."

  Thinking indicator (optional, show as a subtle state):
    Three animated dots or a subtle "Thinking..." text

- Input area at bottom:
  Text input with placeholder "메시지를 입력하세요..."
  Send button (arrow icon, blue)
  Clean border-top separator

Style: The chat should feel like a professional tool, not a chatbot widget.
Think Linear's command palette or Notion's sidebar — integrated, not bolted-on.
No robot icons. No chat bubbles with tails. Clean rounded rectangles.
```

---

## 화면 2-M: 채팅 패널 (Mobile, 펼친 상태)

### Stitch 프롬프트

```
Design the mobile chat view (375px width) as a bottom sheet overlay.

The chat panel slides up from the bottom, covering 80% of the screen.
A slight dimmed overlay on the content behind.

- Top: Drag handle (small gray bar), "Chat" title, close button
- Same conversation as desktop version
- Suggestion chips wrap to 2 lines on mobile
- Input area: full width, fixed at bottom with safe area padding
- Project reference cards stack vertically (full width)

Feel: native iOS bottom sheet behavior. Smooth, polished.
```

---

## 화면 3: Admin 대시보드

### 구성

```
Sidebar nav → Main content area (dashboard / CRUD pages)
```

### Stitch 프롬프트

```
Design an admin dashboard for a portfolio management system.
Clean, functional design. Reference: Linear or Vercel dashboard style.

Use Tailwind CSS. White background, dark sidebar (#111827).

Layout:
- Left sidebar (240px, dark):
  - Logo/title: "PortfolioLive Admin" at top
  - Nav items with icons (Lucide-style line icons):
    - Dashboard (chart icon) — active state
    - Career (briefcase icon)
    - Work Projects (folder icon)
    - Profile (user icon)
    - Chat Logs (message icon)
    - Contact Requests (mail icon)
    - Settings (gear icon)
  - Active item: white text, subtle highlight background
  - Inactive: gray-400 text

- Main content area:
  
  DASHBOARD VIEW showing:
  
  Top row - 4 stat cards in a grid:
    - "Total Visitors" — "1,247" with "+12% this week" in green
    - "Chat Sessions" — "89" with "+5 today"
    - "Questions Asked" — "342" 
    - "Contact Requests" — "7" with "3 unread" badge in red
  
  Middle row - 2 columns:
    Left: "Popular Questions" list
      - 5 items, each with question text and count badge
      - "AI 프로젝트 경험" (23)
      - "기술 스택" (19)
      - "최근 프로젝트" (15)
      - "경력 흐름" (12)
      - "팀에서의 역할" (8)
    
    Right: "Recent Chat Sessions" list
      - 5 items with visitor ID (anonymized), message count, time
      - "Visitor #1247 — 6 messages — 2 min ago"
      - "Visitor #1246 — 3 messages — 15 min ago"
      - etc.
  
  Bottom row:
    "Recent Contact Requests" table
      Columns: Name, Organization, Email, Message (truncated), Date, Status
      3 sample rows with "Read"/"Unread" status badges

Style: Data-dense but clean. No decorative elements. 
Monospace numbers for stats. Subtle borders between sections.
```

---

## 확정된 디자인 파일

`docs/screen-design/` 에 Stitch 결과물이 저장되어 있습니다.

| 화면 | 폴더 | 파일 | 상태 |
|------|------|------|------|
| 메인 페이지 (Desktop) | `yongsub_lee_portfolio_updated/` | `code.html`, `screen.png` | 확정 |
| 메인 페이지 (Mobile) | `mobile_portfolio_updated/` | `code.html`, `screen.png` | 확정 |
| 채팅 패널 (Desktop) | `portfolio_with_refined_chat_panel/` | `code.html`, `screen.png` | 확정 |
| 채팅 패널 (Mobile) | `mobile_portfolio_chat_overlay/` | `code.html`, `screen.png` | 확정 |
| Admin 대시보드 | `portfoliolive_admin_dashboard/` | `code.html`, `screen.png` | 확정 |
| 디자인 시스템 | `monolith_precision/` | `DESIGN.md` | 참고용 |

### 구현 시 참고사항

각 `code.html`은 Tailwind CSS 기반 HTML입니다. 구현 시:
1. HTML 구조/클래스를 참고하여 Next.js 컴포넌트로 변환
2. shadcn/ui 컴포넌트로 매핑 (Button, Card, Accordion, Badge 등)
3. 반응형 breakpoint 적용
4. 동적 데이터 바인딩 추가

**Stitch 코드를 그대로 쓰지 않습니다.** 디자인 레퍼런스 + 구조 참고로 활용합니다.

### 구현 시 수정 필요 항목

#### 전체 공통

| 항목 | Stitch 결과 | 구현 시 수정 |
|------|-----------|------------|
| CDN 폰트 | Google Fonts CDN | `next/font`로 로컬 로드 |
| Tailwind CDN | `<script>` 태그 | `tailwind.config.ts` 빌드 타임 |
| Material Symbols | CDN 로드 | Lucide Icons로 교체 (shadcn 호환) |
| 하드코딩 텍스트 | 영문/고정값 | 동적 데이터 바인딩 |

#### 화면별

| 화면 | 항목 | 수정 |
|------|------|------|
| Desktop 메인 | 채팅 트리거 위치 | `position: fixed; bottom: 0; z-index: 40` |
| Desktop 메인 | 우상단 터미널 아이콘 | 제거 |
| Desktop 메인 | Hero 키워드 "Core Engineering" | "AI Services" |
| Mobile 메인 | viewport 메타 `width=375` | `width=device-width` |
| Mobile 메인 | 타임라인 점 크기 `w-2 h-2` | Desktop과 통일 `w-3 h-3` |
| Desktop 채팅 | 환영 메시지 "포트폴리오 메신저" | "포트폴리오 에이전트" |
| Desktop 채팅 | 콘텐츠 `pr-[400px]` 고정값 | CSS Grid/Flex 레이아웃으로 변경 |
| Desktop 채팅 | 마크다운 렌더링 | `react-markdown` + `remark-gfm` 적용 |
| Mobile 채팅 | Bottom sheet `85vh` 고정 | `calc(min(85vh, 100svh) - env(safe-area-inset-bottom))` |
| Mobile 채팅 | Input area `absolute` | `sticky bottom-0` + safe area padding |
| Mobile 채팅 | Suggestion 칩 스타일 | Desktop과 통일 (border-slate-200, bg-white) |
| Admin | 사이드바 "Sovereign Engineer" | "PortfolioLive Admin" |
| Admin | Nav 아이콘 일부 부적합 | Career→briefcase, Work Projects→folder |
| Admin | Stat/Table 하드코딩 | API 동적 데이터 바인딩 |
| Admin | Grid `md:grid-cols-4` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` |

### 디자인 시스템 (monolith_precision/DESIGN.md)

Stitch가 생성한 디자인 시스템 문서. 핵심 원칙:
- **No-Line Rule**: 1px 보더 대신 배경색 변화로 섹션 구분
- **Tonal Layering**: 그림자 대신 배경색 계층으로 깊이 표현
- **Typography**: Inter, 극단적 스케일 대비, 라벨은 올캡+레터스페이싱
- **좌측 정렬**: 센터 정렬 지양 (템플릿 느낌 방지)
- **100% Black 금지**: `#2b3438` 사용 (잉크 느낌)
