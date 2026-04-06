import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

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
  // Rate limit 체크: 채팅 분당 20회
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(ip, "chat", RATE_LIMIT_PRESETS.chat);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new EmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
