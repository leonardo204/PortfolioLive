"""PortfolioLive LangGraph Agent — StateGraph 빌드 + 컴파일"""

import logging
from typing import Literal

from langgraph.graph import StateGraph, END

from .state import AgentState
from .nodes.supervisor import supervisor_node
from .nodes.career import career_node
from .nodes.technical import technical_node
from .nodes.grounding import grounding_node

logger = logging.getLogger(__name__)


# ────────────────────────────────────────────
# 라우팅 함수
# ────────────────────────────────────────────

def route_after_supervisor(
    state: AgentState,
) -> Literal["career", "technical", "grounding", END]:
    """Supervisor 실행 후 다음 노드 결정

    - CAREER → career
    - TECHNICAL → technical
    - CONTACT / GREETING / OUT_OF_SCOPE / ABUSE → END (supervisor가 이미 응답)
    - session_ended → END
    """
    if state.get("session_ended", False):
        return END

    intent = state.get("intent", "OUT_OF_SCOPE")

    if intent == "CAREER":
        return "career"
    if intent == "TECHNICAL":
        return "technical"

    # CONTACT, GREETING, OUT_OF_SCOPE, ABUSE: supervisor가 직접 응답 완료
    return END


def route_after_career(state: AgentState) -> Literal["grounding", END]:
    """Career 노드 후 라우팅"""
    if state.get("needs_grounding", False):
        return "grounding"
    return END


def route_after_technical(state: AgentState) -> Literal["grounding", END]:
    """Technical 노드 후 라우팅"""
    if state.get("needs_grounding", False):
        return "grounding"
    return END


# ────────────────────────────────────────────
# 그래프 빌드
# ────────────────────────────────────────────

def build_portfolio_graph() -> StateGraph:
    """PortfolioLive LangGraph 빌드 + 컴파일"""
    graph = StateGraph(AgentState)

    # 노드 등록
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("career", career_node)
    graph.add_node("technical", technical_node)
    graph.add_node("grounding", grounding_node)

    # 진입점
    graph.set_entry_point("supervisor")

    # 조건부 엣지: supervisor → (career | technical | END)
    graph.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        {
            "career": "career",
            "technical": "technical",
            "grounding": "grounding",
            END: END,
        },
    )

    # career → (grounding | END)
    graph.add_conditional_edges(
        "career",
        route_after_career,
        {
            "grounding": "grounding",
            END: END,
        },
    )

    # technical → (grounding | END)
    graph.add_conditional_edges(
        "technical",
        route_after_technical,
        {
            "grounding": "grounding",
            END: END,
        },
    )

    # grounding → END
    graph.add_edge("grounding", END)

    return graph.compile()


# 모듈 로드 시 한 번만 컴파일
portfolio_graph = build_portfolio_graph()
logger.info("[PortfolioAgent] Graph compiled successfully")
