"""Echo agent using LangGraph StateGraph for CopilotKit PoC"""

from typing import TypedDict, Annotated, List
from langchain_core.messages import BaseMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages


class EchoState(TypedDict):
    """State for echo agent"""
    messages: Annotated[List[BaseMessage], add_messages]


def echo_node(state: EchoState) -> EchoState:
    """Echo the last user message with 'Echo: ' prefix"""
    messages = state.get("messages", [])
    if not messages:
        return state

    last_message = messages[-1]
    # Extract content from the last message
    content = ""
    if hasattr(last_message, "content"):
        if isinstance(last_message.content, str):
            content = last_message.content
        elif isinstance(last_message.content, list):
            # Handle multi-part content
            for part in last_message.content:
                if isinstance(part, dict) and part.get("type") == "text":
                    content += part.get("text", "")
                elif isinstance(part, str):
                    content += part

    echo_content = f"Echo: {content}"
    response = AIMessage(content=echo_content)
    return {"messages": [response]}


def build_echo_graph():
    """Build and compile the echo graph"""
    graph = StateGraph(EchoState)
    graph.add_node("echo", echo_node)
    graph.set_entry_point("echo")
    graph.add_edge("echo", END)
    return graph.compile()


# Compile once at module load
echo_graph = build_echo_graph()
