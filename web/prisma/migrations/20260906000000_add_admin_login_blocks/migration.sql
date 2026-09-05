-- 관리자 로그인 실패 기록과 차단 목록
-- 비밀번호를 연달아 틀린 주소를 막는다. 패스키 로그인은 여기에 걸리지 않는다.

CREATE TABLE IF NOT EXISTS "admin_login_blocks" (
  "ip"              TEXT NOT NULL,
  "failed_count"    INTEGER NOT NULL DEFAULT 0,
  "blocked"         BOOLEAN NOT NULL DEFAULT false,
  "first_failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_failed_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blocked_at"      TIMESTAMP(3),
  "last_user_agent" TEXT,
  "note"            TEXT,

  CONSTRAINT "admin_login_blocks_pkey" PRIMARY KEY ("ip")
);

CREATE INDEX IF NOT EXISTS "admin_login_blocks_blocked_last_failed_at_idx"
  ON "admin_login_blocks" ("blocked", "last_failed_at");
