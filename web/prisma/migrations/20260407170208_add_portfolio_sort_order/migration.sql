-- AlterTable
ALTER TABLE "portfolio_projects" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;
