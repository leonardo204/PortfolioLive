"""Agent router: AG-UI protocol endpoint for CopilotKit + health check"""

import uuid
import asyncio
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from ag_ui.core.events import (
    EventType,
    RunStartedEvent,
    RunFinishedEvent,
    TextMessageStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
)
from ag_ui.core.types import RunAgentInput
from ag_ui.encoder import EventEncoder

from ..graph.echo_agent import echo_graph

router = APIRouter(tags=["agent"])


@router.get("/agent/health")
async def health_check():
    return {"status": "ok"}


async def run_echo_agent(body: dict) -> AsyncGenerator[str, None]:
    """Run echo agent and stream AG-UI events"""
    encoder = EventEncoder()
    thread_id = body.get("threadId", str(uuid.uuid4()))
    run_id = str(uuid.uuid4())
    messages = body.get("messages", [])

    # RUN_STARTED
    yield encoder.encode(RunStartedEvent(
        type=EventType.RUN_STARTED,
        thread_id=thread_id,
        run_id=run_id,
    ))

    # Extract last user message content
    last_user_content = ""
    for msg in reversed(messages):
        role = msg.get("role", "")
        if role == "user":
            content = msg.get("content", "")
            if isinstance(content, str):
                last_user_content = content
            elif isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        last_user_content += part.get("text", "")
            break

    # Generate echo response via LangGraph
    from langchain_core.messages import HumanMessage
    result = await echo_graph.ainvoke(
        {"messages": [HumanMessage(content=last_user_content)]}
    )

    # Get the AI response
    response_messages = result.get("messages", [])
    echo_text = ""
    for msg in response_messages:
        if hasattr(msg, "type") and msg.type == "ai":
            echo_text = msg.content
            break

    if not echo_text:
        echo_text = f"Echo: {last_user_content}"

    # Stream text message events
    message_id = str(uuid.uuid4())

    yield encoder.encode(TextMessageStartEvent(
        type=EventType.TEXT_MESSAGE_START,
        message_id=message_id,
        role="assistant",
    ))

    # Stream word by word for visible streaming effect
    words = echo_text.split(" ")
    for i, word in enumerate(words):
        chunk = word if i == 0 else f" {word}"
        yield encoder.encode(TextMessageContentEvent(
            type=EventType.TEXT_MESSAGE_CONTENT,
            message_id=message_id,
            delta=chunk,
        ))
        await asyncio.sleep(0.05)

    yield encoder.encode(TextMessageEndEvent(
        type=EventType.TEXT_MESSAGE_END,
        message_id=message_id,
    ))

    # RUN_FINISHED
    yield encoder.encode(RunFinishedEvent(
        type=EventType.RUN_FINISHED,
        thread_id=thread_id,
        run_id=run_id,
    ))


@router.post("/awp")
async def agent_run_endpoint(request: Request):
    """AG-UI protocol endpoint for CopilotKit LangGraphHttpAgent"""
    body = await request.json()
    return StreamingResponse(
        run_echo_agent(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
