import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

const AGENT_URL =
  process.env.AGENT_URL ?? "http://localhost:3101";

const runtime = new CopilotRuntime({
  agents: {
    echo_agent: new LangGraphHttpAgent({
      url: `${AGENT_URL}/awp`,
    }),
  },
});

export const POST = async (req: NextRequest) => {
  // CopilotKit 내부 프로토콜이므로 rate limit 미적용
  // 사용자 남용 방지는 에이전트 가드레일에서 처리

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new EmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
