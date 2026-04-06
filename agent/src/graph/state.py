"""AgentState TypedDict for PortfolioLive LangGraph agent"""

from typing import TypedDict, Annotated, Optional
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """포트폴리오 에이전트 상태"""
    messages: Annotated[list, add_messages]
    thinking: str               # 현재 작업 상태 (UI에 표시)
    intent: str                 # CAREER | TECHNICAL | CONTACT | GREETING | OUT_OF_SCOPE | ABUSE
    guardrail_count: int        # 위반 횟수
    model_choice: str           # flash | pro
    rag_results: list           # RAG 검색 결과
    session_ended: bool         # 세션 종료 여부
    needs_grounding: bool       # Grounding 필요 여부
