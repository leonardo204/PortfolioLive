// AG-UI SSE 이벤트 파싱 + 메시지 관리

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 채팅 메시지를 DB에 저장
async function saveChatMessage(params: {
  sessionId: number | null
  role: 'user' | 'assistant'
  content: string
  modelUsed?: string
  latencyMs?: number
}): Promise<number | null> {
  try {
    const res = await fetch('/api/v1/chat/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: params.sessionId?.toString() ?? undefined,
        role: params.role,
        content: params.content,
        modelUsed: params.modelUsed,
        latencyMs: params.latencyMs,
      }),
    })
    if (!res.ok) return params.sessionId
    const data = await res.json()
    return data.sessionId ?? params.sessionId
  } catch {
    // 저장 실패는 무시 (채팅 기능 자체에 영향 없도록)
    return params.sessionId
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  threadId: string,
  pathname: string,
  onToken: (token: string) => void,
  onThinking: (text: string) => void,
  onDone: (sessionId: number | null) => void,
  onError: (error: string) => void,
  sessionId: number | null = null,
) {
  // 마지막 사용자 메시지 저장
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  let currentSessionId = sessionId
  if (lastUserMessage) {
    currentSessionId = await saveChatMessage({
      sessionId: currentSessionId,
      role: 'user',
      content: lastUserMessage.content,
    })
  }

  let res: Response

  try {
    res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, thread_id: threadId, page_context: pathname }),
    })
  } catch {
    onError('서버 연결에 실패했습니다.')
    return
  }

  if (!res.ok || !res.body) {
    onError('서버 연결에 실패했습니다.')
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let assistantContent = ''
  const startTime = Date.now()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') {
        // 어시스턴트 응답 저장 후 완료
        if (assistantContent) {
          currentSessionId = await saveChatMessage({
            sessionId: currentSessionId,
            role: 'assistant',
            content: assistantContent,
            latencyMs: Date.now() - startTime,
          })
        }
        onDone(currentSessionId)
        return
      }

      try {
        const event = JSON.parse(data)
        switch (event.type) {
          case 'TEXT_MESSAGE_CONTENT':
            if (!assistantContent) onThinking('') // 첫 토큰 도착 시 thinking 즉시 제거
            assistantContent += event.delta ?? ''
            onToken(event.delta ?? '')
            break
          case 'TEXT_MESSAGE_END':
            // 어시스턴트 응답 저장 후 완료
            if (assistantContent) {
              currentSessionId = await saveChatMessage({
                sessionId: currentSessionId,
                role: 'assistant',
                content: assistantContent,
                latencyMs: Date.now() - startTime,
              })
            }
            onDone(currentSessionId)
            return
          case 'STATE_DELTA':
            if (Array.isArray(event.delta)) {
              for (const op of event.delta) {
                if (op.path === '/thinking') onThinking(op.value ?? '')
              }
            }
            break
          case 'RUN_ERROR':
            onError(event.message ?? '오류가 발생했습니다.')
            return
        }
      } catch {
        // 파싱 실패한 이벤트는 무시
      }
    }
  }

  // 스트림 종료 후 저장되지 않은 응답이 있으면 저장
  if (assistantContent) {
    currentSessionId = await saveChatMessage({
      sessionId: currentSessionId,
      role: 'assistant',
      content: assistantContent,
      latencyMs: Date.now() - startTime,
    })
  }
  onDone(currentSessionId)
}
