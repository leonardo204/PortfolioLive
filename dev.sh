#!/bin/bash
# PortfolioLive 개발 서버 (web + agent 동시 실행)
# 사용법: ./dev.sh
# 종료: Ctrl+C

trap 'kill 0; exit' SIGINT SIGTERM

# 이전 프로세스 정리
lsof -ti:3100 | xargs kill -9 2>/dev/null
lsof -ti:3101 | xargs kill -9 2>/dev/null
sleep 1

echo "[dev] PostgreSQL: localhost:5433"
echo "[dev] Agent:      http://localhost:3101"
echo "[dev] Web:        http://localhost:3100"
echo ""

cd agent && .venv/bin/uvicorn src.main:app --port 3101 --reload &
cd web && pnpm dev &

wait
