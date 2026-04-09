"""포트폴리오 프로젝트 DB 조회 Tool 함수"""

import logging

logger = logging.getLogger(__name__)


async def search_portfolio_projects(
    tags: list[str] | None = None,
    limit: int = 10,
) -> str:
    """포트폴리오 프로젝트를 태그로 필터링.

    tags가 없으면 전체 목록(간략) 반환.

    Args:
        tags: 필터할 태그 목록. 예: ['side-project'], ['ai-ml', 'python'], ['work-b2b']
              태그 종류: side-project, work-b2b, work-internal / web, ios, android,
              desktop, embedded, cloud, watch, tv / c, cpp, java, python, swift,
              typescript, javascript, csharp, rust / ai-ml, voice-stt-tts,
              stb-middleware, devtools, media, productivity
        limit: 반환할 최대 프로젝트 수 (기본 10)

    Returns:
        프로젝트 목록 마크다운 텍스트
    """
    try:
        from ...db.connection import get_pool
        pool = await get_pool()

        if tags:
            rows = await pool.fetch(
                """
                SELECT slug, title, description, technologies, tags
                FROM portfolio_projects
                WHERE tags @> $1
                ORDER BY sort_order, slug
                LIMIT $2
                """,
                tags,
                limit,
            )
        else:
            rows = await pool.fetch(
                """
                SELECT slug, title, description, technologies, tags
                FROM portfolio_projects
                ORDER BY sort_order, slug
                LIMIT $1
                """,
                limit,
            )

        if not rows:
            tag_info = f" (태그: {', '.join(tags)})" if tags else ""
            return f"프로젝트를 찾지 못했습니다{tag_info}."

        lines = []
        for row in rows:
            slug = row["slug"]
            title = row["title"]
            desc = (row["description"] or "")[:100]
            techs = list(row["technologies"]) if row["technologies"] else []
            row_tags = list(row["tags"]) if row["tags"] else []
            techs_str = ", ".join(techs[:5]) if techs else ""
            tags_str = ", ".join(row_tags) if row_tags else ""
            lines.append(
                f"- **{title}** (slug: `{slug}`)\n"
                f"  설명: {desc}\n"
                f"  기술: [{techs_str}] | 태그: [{tags_str}]"
            )

        tag_header = f" (태그 필터: {', '.join(tags)})" if tags else ""
        logger.info(f"[PortfolioTools] search_portfolio_projects{tag_header}: {len(rows)} results")
        return f"## 포트폴리오 프로젝트{tag_header}\n\n" + "\n\n".join(lines)

    except Exception as e:
        logger.error(f"[PortfolioTools] search_portfolio_projects failed: {e}")
        return "포트폴리오 프로젝트 검색 중 오류가 발생했습니다."


async def get_project_detail(slug: str) -> str:
    """특정 프로젝트의 상세 정보.

    description, technologies, tags, readme 요약(500자) 반환.

    Args:
        slug: 프로젝트 slug (예: dotclaude, mytammi)

    Returns:
        프로젝트 상세 정보 마크다운 텍스트
    """
    try:
        from ...db.connection import get_pool
        pool = await get_pool()

        row = await pool.fetchrow(
            """
            SELECT slug, title, description, technologies, tags,
                   readme_raw, github_url, demo_url, sort_order
            FROM portfolio_projects
            WHERE slug = $1
            """,
            slug,
        )

        if not row:
            return f"프로젝트를 찾지 못했습니다. (slug: {slug})"

        title = row["title"]
        desc = row["description"] or ""
        techs = list(row["technologies"]) if row["technologies"] else []
        tags = list(row["tags"]) if row["tags"] else []
        readme_raw = row["readme_raw"] or ""
        github_url = row["github_url"] or ""
        demo_url = row["demo_url"] or ""

        techs_str = ", ".join(techs) if techs else "(없음)"
        tags_str = ", ".join(tags) if tags else "(없음)"

        lines = [
            f"## {title} (slug: `{slug}`)",
            f"**설명**: {desc}",
            f"**기술 스택**: {techs_str}",
            f"**태그**: {tags_str}",
        ]

        if github_url:
            lines.append(f"**GitHub**: {github_url}")
        if demo_url:
            lines.append(f"**데모**: {demo_url}")

        if readme_raw:
            readme_excerpt = readme_raw[:500]
            lines.append(f"\n**README 요약**:\n{readme_excerpt}")
            if len(readme_raw) > 500:
                lines.append("_(이하 생략)_")

        logger.info(f"[PortfolioTools] get_project_detail '{slug}': found")
        return "\n".join(lines)

    except Exception as e:
        logger.error(f"[PortfolioTools] get_project_detail failed: {e}")
        return f"프로젝트 상세 조회 중 오류가 발생했습니다. (slug: {slug})"
