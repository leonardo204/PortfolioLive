"""경력/업무 프로젝트 DB 조회 Tool 함수"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _format_date(date_str: Optional[str]) -> str:
    """ISO 날짜 문자열을 YYYY.MM 형식으로 변환"""
    if not date_str:
        return "현재"
    try:
        dt_str = str(date_str)
        parts = dt_str.split("-")
        if len(parts) >= 2:
            year = parts[0].strip()
            month = parts[1].strip()[:2]
            return f"{year}.{month.zfill(2)}"
    except Exception:
        pass
    return str(date_str)


def _format_career_entry(career: dict, projects: list[dict]) -> str:
    """단일 Career 레코드를 마크다운 텍스트로 변환 (career_loader._format_career_entry 재활용)"""
    company = career.get("company", "")
    company_type = career.get("company_type", "")
    department = career.get("department", "")
    position = career.get("position", "")
    location = career.get("location", "")
    started_at = _format_date(career.get("started_at"))
    ended_at = _format_date(career.get("ended_at"))
    is_current = career.get("is_current", False)
    tech_transition = career.get("tech_transition")
    summary = career.get("summary")

    period = f"{started_at} ~ {'현재' if is_current else ended_at}"

    lines = [
        f"### {company} ({company_type})",
        f"- **기간**: {period}",
        f"- **직무**: {department} / {position}",
        f"- **위치**: {location}",
    ]

    if tech_transition:
        lines.append(f"- **기술 전환**: {tech_transition}")

    if summary:
        lines.append(f"- **요약**: {summary}")

    if projects:
        lines.append("- **주요 프로젝트**:")
        for proj in sorted(projects, key=lambda p: p.get("year", ""), reverse=True):
            year = proj.get("year", "")
            title = proj.get("title", "")
            desc = proj.get("description", "")
            lines.append(f"  - [{year}] **{title}**: {desc}")

    return "\n".join(lines)


async def search_career_history(query: str) -> str:
    """회사명/키워드로 경력+업무프로젝트 검색.

    DB에서 careers + work_projects를 조회하여 매칭 결과를 마크다운 텍스트로 반환.

    Args:
        query: 검색 키워드 (예: 'AI', '알티캐스트', 'STB', '2022')

    Returns:
        매칭된 경력 정보 마크다운 텍스트
    """
    try:
        from ...db.connection import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            careers = await conn.fetch(
                """
                SELECT DISTINCT c.id, c.company, c.company_type, c.department,
                       c.position, c.location, c.started_at, c.ended_at,
                       c.is_current, c.tech_transition, c.summary, c.sort_order
                FROM careers c
                LEFT JOIN work_projects wp ON wp.career_id = c.id
                WHERE c.company ILIKE $1
                   OR c.department ILIKE $1
                   OR c.position ILIKE $1
                   OR c.summary ILIKE $1
                   OR c.tech_transition ILIKE $1
                   OR wp.title ILIKE $1
                   OR wp.description ILIKE $1
                   OR CAST(wp.year AS TEXT) ILIKE $1
                ORDER BY c.sort_order ASC, c.started_at DESC
                """,
                f"%{query}%",
            )

            if not careers:
                return f"해당 키워드로 경력 정보를 찾지 못했습니다. (키워드: {query})"

            career_ids = [c["id"] for c in careers]
            projects = await conn.fetch(
                """
                SELECT career_id, year, title, description
                FROM work_projects
                WHERE career_id = ANY($1)
                ORDER BY year DESC, id ASC
                """,
                career_ids,
            )

        projects_by_career: dict[int, list[dict]] = {}
        for proj in projects:
            cid = proj["career_id"]
            if cid not in projects_by_career:
                projects_by_career[cid] = []
            projects_by_career[cid].append(dict(proj))

        sections = []
        for career in careers:
            career_dict = dict(career)
            cid = career_dict["id"]
            career_projects = projects_by_career.get(cid, [])
            sections.append(_format_career_entry(career_dict, career_projects))

        logger.info(f"[CareerTools] search_career_history '{query}': {len(careers)} results")
        return "\n\n".join(sections)

    except Exception as e:
        logger.error(f"[CareerTools] search_career_history failed: {e}")
        return f"경력 검색 중 오류가 발생했습니다. (키워드: {query})"


async def get_career_summary() -> str:
    """전체 경력 타임라인 간략 요약.

    회사명 + 기간 + 역할 + 한 줄 요약만 반환 (work_projects 제외).

    Returns:
        경력 타임라인 마크다운 텍스트
    """
    try:
        from ...db.connection import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT company, company_type, department, position,
                       started_at, ended_at, is_current, summary
                FROM careers
                ORDER BY sort_order ASC, started_at DESC
                """
            )

        if not rows:
            return "경력 정보를 찾을 수 없습니다."

        lines = []
        for row in rows:
            company = row["company"]
            position = row["position"]
            started_at = _format_date(row["started_at"])
            ended_at = _format_date(row["ended_at"])
            is_current = row["is_current"]
            summary = row["summary"] or ""

            period = f"{started_at}~{'현재' if is_current else ended_at}"
            line = f"### {company} ({period}) — {position}"
            if summary:
                line += f"\n요약: {summary}"
            lines.append(line)

        logger.info(f"[CareerTools] get_career_summary: {len(rows)} entries")
        return "\n\n".join(lines)

    except Exception as e:
        logger.error(f"[CareerTools] get_career_summary failed: {e}")
        return "경력 요약 조회 중 오류가 발생했습니다."
