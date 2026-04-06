// AG-UI SSE 이벤트 파싱 + 메시지 관리

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function sendChatMessage(
  messages: ChatMessage[],
  threadId: string,
  onToken: (token: string) => void,
  onThinking: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
) {
  let res: Response

  try {
    res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, thread_id: threadId }),
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
        onDone()
        return
      }

      try {
        const event = JSON.parse(data)
        switch (event.type) {
          case 'TEXT_MESSAGE_CONTENT':
            onToken(event.delta ?? '')
            break
          case 'TEXT_MESSAGE_END':
            onDone()
            break
          case 'STATE_DELTA':
            if (event.delta?.thinking) onThinking(event.delta.thinking)
            break
          case 'RUN_ERROR':
            onError(event.message ?? '오류가 발생했습니다.')
            break
        }
      } catch {
        // 파싱 실패한 이벤트는 무시
      }
    }
  }

  onDone()
}
