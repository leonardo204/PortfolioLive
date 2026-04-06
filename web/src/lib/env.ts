// 환경변수 타입 검증

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  // Database
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // Agent
  NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:3101",

  // Node
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
