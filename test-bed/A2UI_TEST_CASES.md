# A2UI 컴포넌트 테스트 케이스

> 9개 A2UI 컴포넌트의 렌더링 여부를 검증하는 테스트
> 최종 실행: 2026-04-09

## 테스트 방법
- Agent에 질문을 보내고 응답에 `<!--a2ui:타입-->` 마커가 포함되는지 확인
- 마커가 있으면 PASS, 없으면 FAIL

## 테스트 결과: 9/9 PASS (100%)

| ID | 컴포넌트 | 질문 | 결과 | 응답시간 |
|----|----------|------|:----:|:--------:|
| A2UI-01 | project-table | 개인 프로젝트 목록을 보여주세요 | ✅ PASS | 8.4s |
| A2UI-02 | tech-stack-table | 기술 스택을 표로 정리해주세요 | ✅ PASS | 8.0s |
| A2UI-03 | career-timeline | 전체 경력을 타임라인으로 보여주세요 | ✅ PASS | 7.0s |
| A2UI-04 | comparison-table | React Native와 Flutter를 비교해주세요 | ✅ PASS | 26.9s |
| A2UI-05 | contact-form | 연락하고 싶어요 | ✅ PASS | 1.7s |
| A2UI-06 | project-ref-card | dotclaude 프로젝트에 대해 알려주세요 | ✅ PASS | 11.1s |
| A2UI-07 | diagram-card | 포트폴리오 서비스의 아키텍처를 다이어그램으로 보여주세요 | ✅ PASS | 27.8s |
| A2UI-08 | skill-matrix | AI/ML 기술 역량을 시각화해서 보여주세요 | ✅ PASS | 8.5s |
| A2UI-09 | timeline-card | KT 알티미디어에서의 경력을 상세히 알려주세요 | ✅ PASS | 24.8s |

## 1차 테스트 실패 → 수정 → 2차 테스트 통과 내역

| ID | 1차 결과 | 원인 | 수정 내용 |
|----|:--------:|------|-----------|
| A2UI-06 | ❌ FAIL | LLM이 project-table로 대체 | 프롬프트 타입 선택 규칙 강화: "특정 프로젝트 1-2개 → project-ref-card" 명시 |
| A2UI-07 | ❌ FAIL | LLM이 diagram-card를 사용하지 않음 | 프롬프트에 "아키텍처/다이어그램 키워드 → diagram-card 필수!" 명시 |
| A2UI-08 | ❌ FAIL | LLM이 tech-stack-table로 대체 | 프롬프트에 "역량/레벨/숙련도 키워드 → skill-matrix" 명시 |
| A2UI-09 | ❌ FAIL | LLM이 career-timeline으로 대체 | 프롬프트에 "특정 회사 1곳 상세 → timeline-card" 명시 |

## 컴포넌트 상세

| # | 타입 | 파일 | 데이터 구조 | 용도 |
|---|------|------|-------------|------|
| 1 | project-table | project-table.tsx | `[{slug, title, description, techs[]}]` | 프로젝트 목록 (3개+) |
| 2 | tech-stack-table | tech-stack-table.tsx | `{headers[], rows[][]}` | 기술 스택 테이블 |
| 3 | career-timeline | career-timeline.tsx | `[{company, period, role, highlight}]` | 전체 경력 타임라인 |
| 4 | comparison-table | comparison-table.tsx | `{title?, headers[], rows[][]}` | 범용 비교 테이블 |
| 5 | contact-form | contact-form.tsx | `{}` | 연락 요청 폼 |
| 6 | project-ref-card | project-ref-card.tsx | `[{slug, title, description, techs[]}]` | 관련 프로젝트 참조 카드 (1-2개) |
| 7 | diagram-card | diagram-card.tsx | `{title?, mermaidCode}` | Mermaid 아키텍처 다이어그램 |
| 8 | skill-matrix | skill-matrix.tsx | `{categories: [{name, skills: [{name, level}]}]}` | 기술 역량 매트릭스 |
| 9 | timeline-card | timeline-card.tsx | `{company, period, role, department?, highlights[]}` | 경력 하이라이트 카드 |
