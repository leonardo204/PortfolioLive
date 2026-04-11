#!/bin/bash
# check-ports.sh — 포트 인벤토리 점검
# 외부 노출된 포트 중 allowlist 외 항목을 검출합니다.
# Exit 0: 이상 없음 / Exit 1: 위반 포트 발견

set -euo pipefail

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
ALLOWLIST_FILE="$SCRIPT_DIR/check-ports.allowlist"

log()  { echo -e "${GREEN}[check-ports]${NC} $1"; }
warn() { echo -e "${YELLOW}[check-ports]${NC} $1"; }
err()  { echo -e "${RED}[check-ports]${NC} $1"; }

# ─── .env에서 WEB_PORT, AGENT_PORT 로드 ─────────────────────────────────────
WEB_PORT=3100
AGENT_PORT=3101
if [ -f "$ENV_FILE" ]; then
    _WEB=$(grep -E '^WEB_PORT=[0-9]+' "$ENV_FILE" | cut -d'=' -f2 | tr -d '[:space:]') || true
    _AGENT=$(grep -E '^AGENT_PORT=[0-9]+' "$ENV_FILE" | cut -d'=' -f2 | tr -d '[:space:]') || true
    [ -n "$_WEB" ]   && WEB_PORT="$_WEB"
    [ -n "$_AGENT" ] && AGENT_PORT="$_AGENT"
fi

# ─── allowlist 구성 ───────────────────────────────────────────────────────────
# WEB_PORT, AGENT_PORT 자동 포함
declare -A ALLOWED
ALLOWED["$WEB_PORT"]=1
ALLOWED["$AGENT_PORT"]=1

# allowlist 파일에서 추가 허용 포트 로드
if [ -f "$ALLOWLIST_FILE" ]; then
    while IFS= read -r line; do
        # 주석(#)과 빈 줄 무시
        line="${line%%#*}"
        line="$(echo "$line" | tr -d '[:space:]')"
        [ -z "$line" ] && continue
        ALLOWED["$line"]=1
    done < "$ALLOWLIST_FILE"
fi

# ─── ss / netstat 선택 ───────────────────────────────────────────────────────
if command -v ss &>/dev/null; then
    PORT_LIST=$(ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}')
elif command -v netstat &>/dev/null; then
    PORT_LIST=$(netstat -tln 2>/dev/null | awk 'NR>2 {print $4}')
else
    err "ss 또는 netstat을 찾을 수 없습니다. net-tools 또는 iproute2를 설치하세요."
    exit 1
fi

# ─── 포트 분석 ───────────────────────────────────────────────────────────────
VIOLATIONS=0

while IFS= read -r addr; do
    [ -z "$addr" ] && continue

    # IPv6 bracket 처리: [::]:3100 형태
    if [[ "$addr" == \[*\]:* ]]; then
        host="${addr%%\]:*}"
        host="${host#\[}"
        port="${addr##*\]:}"
    elif [[ "$addr" == *:* ]]; then
        host="${addr%:*}"
        port="${addr##*:}"
    else
        continue
    fi

    [ -z "$port" ] && continue

    # loopback은 자동 안전 — 건너뜀 (127.0.0.0/8 전체 + ::1)
    if [[ "$host" == "::1" ]] || [[ "$host" =~ ^127\. ]]; then
        continue
    fi

    # 외부 노출 바인딩 (0.0.0.0, ::, *, 공인 IP)
    # '*' = 일부 ss 버전의 와일드카드 = 외부 노출로 분류
    if [[ "$host" == "0.0.0.0" || "$host" == "::" || "$host" == "*" || "$host" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        if [ "${ALLOWED[$port]+_}" ]; then
            log "  OK  $addr (허용 목록: 포트 $port)"
        else
            err "  위반 $addr — 포트 $port 가 allowlist에 없습니다 (외부 노출 위험)"
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    fi
done <<< "$PORT_LIST"

# ─── 결과 ────────────────────────────────────────────────────────────────────
if [ "$VIOLATIONS" -gt 0 ]; then
    err "포트 인벤토리 위반 $VIOLATIONS 건 발견."
    err "  허용 포트: WEB_PORT=$WEB_PORT, AGENT_PORT=$AGENT_PORT + $([ -f "$ALLOWLIST_FILE" ] && echo "$ALLOWLIST_FILE 참조" || echo "allowlist 없음")"
    exit 1
else
    log "포트 인벤토리 OK (WEB=$WEB_PORT, AGENT=$AGENT_PORT)"
    exit 0
fi
