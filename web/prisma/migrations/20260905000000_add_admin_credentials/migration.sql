-- 관리자 패스키 등록 정보
-- 비밀번호를 대신하는 로그인 수단이며, 기기 여러 대를 등록해 둘 수 있다.
-- id        : 기기가 발급한 자격 증명 ID (base64url)
-- public_key: 공개키. 유출돼도 로그인에 쓰이지 않는다(서명은 기기 안 개인키가 한다).
-- counter   : 서명 횟수. 값이 되돌아가면 복제된 기기로 보고 거절한다.

CREATE TABLE IF NOT EXISTS "admin_credentials" (
  "id"           TEXT PRIMARY KEY,
  "public_key"   BYTEA        NOT NULL,
  "counter"      BIGINT       NOT NULL DEFAULT 0,
  "transports"   TEXT[]       NOT NULL DEFAULT '{}',
  "device_type"  TEXT         NOT NULL DEFAULT '',
  "backed_up"    BOOLEAN      NOT NULL DEFAULT false,
  "label"        TEXT         NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_used_at" TIMESTAMP(3)
);
