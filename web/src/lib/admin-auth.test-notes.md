# admin-auth 수동 검증 시나리오

HMAC 서명 세션 토큰 구현에 대한 수동 curl 테스트 케이스입니다.
vitest 자동화 테스트 대신 이 문서의 시나리오를 수동으로 실행하여 검증합니다.

## 사전 조건

```bash
# .env에 ADMIN_SESSION_SECRET 설정 확인 (32자 이상)
grep ADMIN_SESSION_SECRET .env

# web 컨테이너 기동 확인
docker compose ps web

# 로그인하여 유효한 쿠키 획득
ADMIN_PW=$(grep '^ADMIN_PASSWORD=' .env | cut -d'=' -f2)
COOKIE_JAR=$(mktemp)
curl -sS -c "$COOKIE_JAR" -X POST http://localhost:3100/api/v1/admin/auth \
  -H 'Content-Type: application/json' \
  -d "{\"password\":\"$ADMIN_PW\"}" -i | head -20
```

---

## 시나리오 1: 유효한 토큰으로 정상 요청 — 200 기대

```bash
curl -i -b "$COOKIE_JAR" http://localhost:3100/api/v1/admin/careers
```

**기대**: `HTTP/1.1 200 OK` + JSON 배열 응답

---

## 시나리오 2: 만료된 토큰 — 401 기대

`exp`를 과거 시각으로 조작한 토큰을 직접 생성합니다.
(아래는 예시 — 실제로는 서버의 secret 없이 유효한 서명을 만들 수 없으므로,
만료 토큰 테스트는 서버 측 TTL을 1초로 단축하거나, 테스트 환경에서 시계를 조작하는 방식을 권장)

```bash
# 방법: exp=1 (1970-01-01T00:00:01Z, 과거)으로 수동 구성 + 임의 서명 → 서명 불일치로 401
# 실용적인 방법: 로그인 직후 짧은 TTL(1초) 토큰 발급 테스트용 엔드포인트 임시 활성화
curl -i -b 'admin-session=eyJpc3MiOiJhZG1pbiIsImlhdCI6MSwi[...만료_토큰...]' \
  http://localhost:3100/api/v1/admin/careers
```

**기대**: `HTTP/1.1 401 Unauthorized` + `{"error":"인증이 필요합니다."}`

※ 실제로는 서명 불일치로 401 반환. exp 검증 로직 자체는 단위 테스트로 검증 필요.

---

## 시나리오 3: 변조된 토큰 (마지막 1자 변경) — 401 기대

```bash
# 유효한 토큰 추출
VALID_TOKEN=$(grep -o 'admin-session=[^;]*' "$COOKIE_JAR" | head -1 | cut -d'=' -f2-)

# 마지막 1자를 변조
TAMPERED="${VALID_TOKEN%?}X"

curl -i -b "admin-session=$TAMPERED" http://localhost:3100/api/v1/admin/careers
```

**기대**: `HTTP/1.1 401 Unauthorized` + `{"error":"인증이 필요합니다."}`

---

## 시나리오 4: 빈 쿠키 — 401 기대

```bash
curl -i http://localhost:3100/api/v1/admin/careers
```

**기대**: `HTTP/1.1 401 Unauthorized` + `{"error":"인증이 필요합니다."}`

---

## 시나리오 5: 잘못된 base64 (`!!!`) — 401 기대

```bash
curl -i -b 'admin-session=!!!' http://localhost:3100/api/v1/admin/careers
```

**기대**: `HTTP/1.1 401 Unauthorized` + `{"error":"인증이 필요합니다."}`

---

## 시나리오 6: 잘못된 iss (`user` 등) — 401 기대

```bash
# iss="user"로 payload 구성 (서명은 임의값)
# base64url({"iss":"user","iat":1,...}).임의서명
curl -i -b 'admin-session=eyJpc3MiOiJ1c2VyIiwiaWF0IjoxNzQ0MzMwMDAwLCJleHAiOjk5OTk5OTk5OTksImp0aSI6ImFiYyJ9.INVALIDSIG' \
  http://localhost:3100/api/v1/admin/careers
```

**기대**: `HTTP/1.1 401 Unauthorized` + `{"error":"인증이 필요합니다."}`

※ 실제로는 서명 불일치로 401 반환. iss 검증 로직 자체는 단위 테스트로 검증 필요.

---

## 대표 API 3개 Smoke Test

```bash
curl -sS -b "$COOKIE_JAR" http://localhost:3100/api/v1/admin/dashboard -i | head -3 | grep HTTP
curl -sS -b "$COOKIE_JAR" http://localhost:3100/api/v1/admin/settings -i | head -3 | grep HTTP
curl -sS -b "$COOKIE_JAR" http://localhost:3100/api/v1/admin/chat-logs -i | head -3 | grep HTTP
```

**기대**: 모두 `HTTP/1.1 200 OK`

---

## 정리

```bash
rm -f "$COOKIE_JAR"
```

---

---

## 커버리지 한계 (후속 TODO)

시나리오 2(만료 토큰)와 시나리오 6(잘못된 iss)는 서버 secret 없이 curl로는 실제 해당 분기(`exp < now`, `iss !== 'admin'`)에 도달할 수 없습니다. 현재 위조 서명으로 테스트하므로 사실상 서명 검증 단계(step 2)에서 조기 종료됩니다.

완전한 분기 커버리지는 다음 중 하나로 달성 가능:
1. vitest 도입 후 `verifyAdminSession` 단위 테스트 작성 (유효 서명 + 조작된 payload)
2. dev-only 디버그 엔드포인트 `/api/v1/admin/_debug/sign?ttl=1&iss=user` (프로덕션 배포 금지, NODE_ENV 가드 필수)

본 문서의 시나리오는 "서명 검증 + 일반 실패 경로"를 수동으로 확인하는 용도로 사용합니다.

---

*이 문서는 HMAC 서명 세션 검증 구현(web/src/lib/admin-auth.ts)의 수동 QA 가이드입니다.*
