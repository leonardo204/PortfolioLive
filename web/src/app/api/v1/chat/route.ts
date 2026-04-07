import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json() // { messages: [...], thread_id?: string, page_context?: string }

  const agentUrl = process.env.AGENT_URL ?? 'http://localhost:3101'

  // AG-UI 프로토콜 형식으로 agent에 요청
  const response = await fetch(`${agentUrl}/awp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      thread_id: body.thread_id ?? crypto.randomUUID(),
      run_id: crypto.randomUUID(),
      messages: body.messages,
      page_context: body.page_context,
    }),
  })

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Agent 연결에 실패했습니다.' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // SSE 스트림 relay
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
