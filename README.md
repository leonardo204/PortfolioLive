# PortfolioLive

포트폴리오 웹 소개 + 자연어 대화형 Q&A 서비스

> **Live**: https://me.zerolive.co.kr

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Next.js 15  │────▶│  FastAPI      │────▶│ PostgreSQL │
│  (web)       │◀────│  (agent)      │◀────│ + pgvector │
│  :3100       │     │  :3101        │     │  :5433     │
└─────────────┘     └──────────────┘     └────────────┘
      │                    │
      │  CopilotKit        │  LangGraph + Gemini
      │  React UI          │  RAG Pipeline
      └────────────────────┘
```

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15, Tailwind CSS, CopilotKit |
| Agent | FastAPI, LangGraph, Gemini, pgvector RAG |
| Database | PostgreSQL 16 (pgvector) |
| Infra | Docker Compose, Cloudflare |

## Features

- **Portfolio Showcase** -- GitHub 자동 동기화, 카테고리 필터, README 렌더링
- **AI Chat** -- LangGraph 기반 대화형 Q&A (경력/프로젝트 RAG 검색)
- **Admin Dashboard** -- 경력/프로젝트/설정 관리, 채팅 로그, 방문 통계
- **GitHub Webhook** -- push 이벤트 시 포트폴리오 자동 업데이트

## Quick Start

### Prerequisites

- Docker & Docker Compose
- GitHub Personal Access Token (repo read)
- Gemini API Key

### Setup

```bash
# 1. Clone
git clone https://github.com/leonardo204/PortfolioLive.git
cd PortfolioLive

# 2. Environment
cp .env.example .env
# .env 파일을 열어 필수 값 입력

# 3. Deploy
chmod +x deploy.sh
./deploy.sh
```

### Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `SMTP_USER` | Yes | Gmail address |
| `SMTP_PASS` | Yes | Gmail app password |
| `GITHUB_TOKEN` | No | GitHub PAT (repo read) |
| `GITHUB_WEBHOOK_SECRET` | No | Webhook signature secret |

### Development

```bash
# PostgreSQL이 localhost:5433에서 실행 중이어야 함
./dev.sh
```

## Project Structure

```
PortfolioLive/
├── web/                    # Next.js frontend + API routes
│   ├── src/app/            # Pages & API endpoints
│   ├── src/components/     # React components
│   ├── src/lib/            # Prisma client, queries
│   └── prisma/             # Schema, migrations, seed
├── agent/                  # FastAPI backend
│   ├── src/pipeline/       # GitHub sync pipeline
│   ├── src/graph/          # LangGraph agent
│   ├── src/rag/            # RAG retriever
│   └── src/routers/        # API routes
├── docker-compose.yml
├── deploy.sh               # Production deploy script
└── dev.sh                  # Development server
```

## Endpoints

| URL | Description |
|-----|-------------|
| `/` | Portfolio main page |
| `/portfolio/:slug` | Project detail |
| `/admin` | Admin dashboard |
| `/api/v1/github/webhook` | GitHub webhook receiver |
| `/api/v1/github/sync` | Manual sync trigger |

## License

Private
