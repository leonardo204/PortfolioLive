-- 대표작 표시 + App Store 출시 링크
-- featured        : 첫 화면 맨 위에 크게 보여줄 프로젝트 여부
-- featured_order  : 대표작끼리의 노출 순서 (작은 값이 먼저)
-- app_store_url   : App Store 제품 페이지 주소. 동기화할 때 README에서 찾아 채운다.

ALTER TABLE "portfolio_projects" ADD COLUMN IF NOT EXISTS "app_store_url" TEXT;
ALTER TABLE "portfolio_projects" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "portfolio_projects" ADD COLUMN IF NOT EXISTS "featured_order" INTEGER NOT NULL DEFAULT 0;

-- 대표작만 빠르게 뽑기 위한 인덱스
CREATE INDEX IF NOT EXISTS "idx_portfolio_featured"
  ON "portfolio_projects" ("featured", "featured_order");
