# Live Services 기능 수동 QA 체크리스트

> 대상 기능: "Currently Running Live Services" (liveUrl + "live" tag 기반)
> 적용 환경: Docker Compose (`docker-compose up`) 기동 후 확인

---

## 0. 사전 준비

- [ ] `docker-compose up` 정상 기동 확인 (web: 3100, agent: FastAPI)
- [ ] DB에 `live_url` / `tags` 컬럼 마이그레이션 적용됨 (`prisma migrate deploy` 완료)
- [ ] 테스트용 프로젝트 1개: `liveUrl` 값 있음, `tags`에 `"live"` 포함
- [ ] 테스트용 프로젝트 1개: `liveUrl` 없음, `tags`에 `"live"` 없음

---

## 1. 포트폴리오 카드 — Live 배지

| # | 체크 항목 | 기대 결과 | 통과 여부 |
|---|-----------|-----------|-----------|
| 1-1 | `liveUrl`이 있는 프로젝트 카드 렌더링 | 카드 우상단에 파란 점 + "LIVE" 텍스트 배지 표시 | |
| 1-2 | `liveUrl`이 null인 프로젝트 카드 렌더링 | Live 배지 미표시 (DOM에 aria-label="Currently running live service" 없음) | |
| 1-3 | Live 배지 aria-label 확인 (스크린 리더) | `aria-label="Currently running live service"` 속성 존재 | |
| 1-4 | Live 배지 내 점 (`aria-hidden="true"`) 확인 | 장식 요소는 스크린 리더에 노출되지 않음 | |
| 1-5 | `category`가 없고 `liveUrl`만 있는 카드 | 배지 행(flex row)이 렌더링되고 빈 `<span />`이 좌측에 위치함 | |

---

## 2. 필터바 — Live 토글 칩

| # | 체크 항목 | 기대 결과 | 통과 여부 |
|---|-----------|-----------|-----------|
| 2-1 | 포트폴리오 페이지 초기 렌더링 | 기존 카테고리 칩 + "Live" 칩이 함께 표시됨 | |
| 2-2 | "Live" 칩 클릭 | `liveUrl`이 있는 프로젝트만 그리드에 표시 | |
| 2-3 | "Live" 칩 재클릭 | `liveOnly` 토글 해제 → 전체 프로젝트 복귀 | |
| 2-4 | 카테고리 칩 + "Live" 칩 동시 활성 | 두 조건 AND 필터: 해당 카테고리 AND liveUrl 있음 | |
| 2-5 | "Live" 활성화 후 "All" 칩 클릭 | `liveOnly` 해제 + `activeFilter` 초기화 → 전체 목록 | |
| 2-6 | `liveUrl` 있는 프로젝트가 0개인 경우 | "Live" 칩 클릭 시 빈 그리드 + "표시할 프로젝트 없음" 메시지 | |

---

## 3. 상세 페이지 — Visit Live Site CTA

| # | 체크 항목 | 기대 결과 | 통과 여부 |
|---|-----------|-----------|-----------|
| 3-1 | `liveUrl` 있는 프로젝트 상세 페이지 접근 | 메타 영역에 "Visit Live Site" 파란 버튼 표시 | |
| 3-2 | "Visit Live Site" 버튼 클릭 | 새 탭(`target="_blank"`)으로 liveUrl 열림 | |
| 3-3 | `rel="noopener noreferrer"` 확인 | 외부 링크 보안 속성 존재 | |
| 3-4 | `liveUrl` 없는 프로젝트 상세 페이지 | "Visit Live Site" 버튼 미표시 | |
| 3-5 | `liveUrl`과 `githubUrl` 모두 있는 경우 | GitHub 버튼과 Visit Live Site 버튼 나란히 표시 | |

---

## 4. Admin 페이지 — liveUrl / tags 편집

| # | 체크 항목 | 기대 결과 | 통과 여부 |
|---|-----------|-----------|-----------|
| 4-1 | Admin > 프로젝트 목록 진입 | 테이블에 각 프로젝트의 liveUrl/tags 컬럼 표시 (또는 편집 UI) | |
| 4-2 | 프로젝트 "수정" 버튼 클릭 → liveUrl 입력 | 유효한 URL 입력 후 저장 → `liveUrl` DB 반영 | |
| 4-3 | liveUrl 입력 후 빈 문자열로 저장 | `liveUrl`이 `null`로 저장됨 (빈 문자열 아님) | |
| 4-4 | tags에 "live" 추가 후 저장 | `tags` 배열에 "live" 항목 반영 | |
| 4-5 | tags에 "live" 제거 후 저장 | `tags` 배열에서 "live" 삭제됨 | |
| 4-6 | Admin API PUT — 인증 없이 요청 | HTTP 401 반환 | |
| 4-7 | Admin API PUT — `id` 누락 요청 | HTTP 400 반환 | |

---

## 5. Agent Tool — `search_portfolio_projects(tags=["live"])`

| # | 체크 항목 | 기대 결과 | 통과 여부 |
|---|-----------|-----------|-----------|
| 5-1 | 챗 UI에서 "현재 운영 중인 서비스 알려줘" 질문 | Gemini가 `search_portfolio_projects` 호출 with `tags=["live"]` | |
| 5-2 | "live" 태그 프로젝트가 있을 때 | 해당 프로젝트 목록 마크다운으로 응답 | |
| 5-3 | "live" 태그 프로젝트가 없을 때 | "프로젝트를 찾지 못했습니다 (태그: live)" 응답 | |
| 5-4 | `search_portfolio_projects` 스키마 description 확인 | "개인/회사/AI/iOS 등" 설명 문구에 live 태그 안내 포함 여부 (향후 업데이트 필요) | |

---

## 6. 회귀 체크 — 기존 기능 유지 확인

| # | 체크 항목 | 기대 결과 | 통과 여부 |
|---|-----------|-----------|-----------|
| 6-1 | `liveUrl`/`tags` 없는 기존 프로젝트 카드 | 기존 레이아웃 동일, 배지 없음 | |
| 6-2 | 기존 카테고리 필터 (AI & Voice 등) 동작 | 기존과 동일하게 필터링 | |
| 6-3 | 포트폴리오 상세 페이지 — `liveUrl` 없는 프로젝트 | "Visit Live Site" 없이 기존 레이아웃 동일 | |
| 6-4 | Admin API GET — 기존 프로젝트 목록 조회 | 응답에 `liveUrl`, `tags` 필드 추가되었으나 기존 필드 유지 | |
| 6-5 | Agent `search_portfolio_projects` 기존 태그 필터 | `tags=["side-project"]` 등 기존 태그 필터 정상 동작 | |
| 6-6 | `docker-compose build && up` 빌드 에러 없음 | Next.js build 성공, TypeScript 에러 없음 (`tsc --noEmit`) | |

---

## 7. Docker 재배포 후 확인 순서

```bash
# 1. 빌드 + 마이그레이션
docker-compose build web
docker-compose run --rm web npx prisma migrate deploy

# 2. 서비스 기동
docker-compose up -d

# 3. 타입 체크 (로컬)
cd web && pnpm type-check

# 4. 포트폴리오 페이지 접근
curl -s http://localhost:3100/ko/portfolio | grep -c "Live"
# → liveUrl 있는 프로젝트 수만큼 "Live" 문자열 등장해야 함

# 5. Admin API 동작 확인
curl -s -w "%{http_code}" http://localhost:3100/api/v1/admin/projects
# → 인증 없이 401 반환 확인
```

---

## 8. 엣지 케이스 체크

| 케이스 | 테스트 방법 | 기대 결과 |
|--------|-------------|-----------|
| `liveUrl`이 빈 문자열(`""`) | DB에 직접 `""` 삽입 후 카드 확인 | 배지 미표시 (falsy 처리) |
| `tags`가 `["live", "side-project"]` (복수 태그) | Live 칩 + 카테고리 필터 AND | 두 조건 모두 만족하는 프로젝트만 표시 |
| `liveUrl`이 `http://` (invalid URL) | Admin에서 입력 후 저장 | 저장은 되나, 브라우저에서 링크 클릭 시 접근 오류 — UX 개선 필요(별도 이슈) |
| 프로젝트 전체가 "live" 태그 | 모든 프로젝트에 "live" 추가 | Live 칩 클릭 시 전체 프로젝트 표시 (정상) |
