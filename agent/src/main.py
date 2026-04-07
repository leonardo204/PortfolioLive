from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import pipeline as pipeline_router
from .db.connection import close_pool

try:
    from .routers import agent as agent_router
except ImportError:
    agent_router = None

app = FastAPI(
    title="PortfolioLive Agent",
    description="FastAPI + LangGraph Agent for PortfolioLive",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
if agent_router:
    app.include_router(agent_router.router)
app.include_router(pipeline_router.router)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await close_pool()


@app.get("/")
async def root():
    return {"message": "PortfolioLive Agent is running"}
