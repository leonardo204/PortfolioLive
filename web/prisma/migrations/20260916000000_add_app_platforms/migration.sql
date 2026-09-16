-- 앱이 어느 기기용인지 — App Store 조회 결과를 그대로 담는다.
-- README 태그(ios 등)는 저장소 분류용이라 실제와 어긋나는 일이 있어,
-- 동기화할 때 스토어에 물어 받은 값을 따로 둔다. 조회에 실패하면 빈 배열이
-- 오는데, 그때는 저장 쪽에서 기존 값을 그대로 둔다(store.py upsert 참고).

ALTER TABLE "portfolio_projects"
  ADD COLUMN IF NOT EXISTS "app_platforms" TEXT[] NOT NULL DEFAULT '{}';
