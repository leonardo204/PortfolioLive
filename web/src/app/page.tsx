"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="echo_agent">
      <main className="flex min-h-screen flex-col">
        <header className="p-4 border-b">
          <h1 className="text-2xl font-bold">PortfolioLive - CopilotKit PoC</h1>
        </header>
        <div className="flex-1 p-4">
          <CopilotChat
            labels={{
              title: "Echo Agent",
              initial: "Echo 에이전트입니다. 메시지를 입력하면 반복해서 돌려드립니다.",
            }}
            className="h-full"
          />
        </div>
      </main>
    </CopilotKit>
  );
}
