#!/bin/bash
set -euo pipefail

# PortfolioLive 배포 스크립트
# 사용법: ./deploy.sh [--no-cache]

COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1"; exit 1; }

# .env 파일 확인
[ -f "$ENV_FILE" ] || err ".env 파일이 없습니다. .env.example을 참고하여 생성하세요."

# 필수 환경변수 검증
check_env() {
    local missing=()
    for var in GEMINI_API_KEY POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD ADMIN_PASSWORD SMTP_USER SMTP_PASS; do
        grep -q "^${var}=.\+" "$ENV_FILE" || missing+=("$var")
    done
    if [ ${#missing[@]} -gt 0 ]; then
        err "필수 환경변수 누락: ${missing[*]}"
    fi
}
check_env

# 빌드 옵션
BUILD_OPTS=""
if [ "${1:-}" = "--no-cache" ]; then
    BUILD_OPTS="--no-cache"
    log "캐시 없이 빌드합니다."
fi

# Step 1: Down
log "기존 컨테이너 중지..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

# Step 1.5: pnpm-lock.yaml 자동 생성
if [ ! -f "web/pnpm-lock.yaml" ]; then
    log "web/pnpm-lock.yaml 없음 — 자동 생성 중..."
    (cd web && npx pnpm install --lockfile-only) || err "pnpm-lock.yaml 생성 실패"
fi

# Step 2: Build
log "이미지 빌드 중..."
docker compose -f "$COMPOSE_FILE" build $BUILD_OPTS

# Step 3: Up
log "컨테이너 시작..."
docker compose -f "$COMPOSE_FILE" up -d

# Step 4: DB 초기화 (migration + seed)
log "PostgreSQL 대기 중..."
for i in $(seq 1 30); do
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-portfoliolive}" -q 2>/dev/null && break
    sleep 1
done

log "DB 마이그레이션 실행..."
docker compose -f "$COMPOSE_FILE" exec -T web npx prisma migrate deploy 2>&1 | tail -3 || warn "마이그레이션 스킵 (이미 최신이거나 prisma 미포함)"

log "DB 시드 데이터 투입..."
docker compose -f "$COMPOSE_FILE" exec -T web npx prisma db seed 2>&1 | tail -3 || warn "시드 스킵 (이미 데이터 존재하거나 seed 미포함)"

# Step 5: Health check
log "서비스 상태 확인 중..."
sleep 3

check_service() {
    local name=$1 url=$2
    if curl -sf "$url" > /dev/null 2>&1; then
        log "  $name: ${GREEN}OK${NC}"
    else
        warn "  $name: 아직 시작 중... (잠시 후 확인하세요)"
    fi
}

if command -v pg_isready &> /dev/null; then
    pg_isready -h localhost -p "${POSTGRES_PORT:-5433}" &> /dev/null && log "  PostgreSQL: ${GREEN}OK${NC}" || warn "  PostgreSQL: 아직 시작 중..."
else
    nc -z localhost "${POSTGRES_PORT:-5433}" 2>/dev/null && log "  PostgreSQL: ${GREEN}OK${NC}" || warn "  PostgreSQL: 아직 시작 중..."
fi
check_service "Web (Next.js)" "http://localhost:${WEB_PORT:-3100}" || true
check_service "Agent (FastAPI)" "http://localhost:${AGENT_PORT:-3101}/agent/health" || true

echo ""
log "배포 완료!"
log "  Web:   http://localhost:${WEB_PORT:-3100}"
log "  Agent: http://localhost:${AGENT_PORT:-3101}"
log "  Admin: http://localhost:${WEB_PORT:-3100}/admin"
echo ""
log "로그 확인: docker compose logs -f"
