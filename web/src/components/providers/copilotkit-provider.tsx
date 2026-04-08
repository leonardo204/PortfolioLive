'use client'

import { CopilotKit } from '@copilotkit/react-core'

interface CopilotKitProviderProps {
  children: React.ReactNode
}

// A2UI용 CopilotKit 래퍼 — ChatPanel 내부에서만 사용
export function CopilotKitProvider({ children }: CopilotKitProviderProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="echo_agent">
      {children}
    </CopilotKit>
  )
}
