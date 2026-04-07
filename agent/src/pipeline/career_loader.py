"""DB에서 careers + work_projects를 로드하여 프롬프트용 텍스트로 포맷팅"""

import logging
from typing import Optional

from ..db.connection import get_pool

logger = logging.getLogger(__name__)

# 하드코딩 fallback (DB가 비어있거나 오류 시 사용)
CAREER_FALLBACK = """### 1. 알티캐스트 → 알티미디어 → KT 알티미디어 (2012 ~ 현재, 13년+)
- **직무**: 케이블 TV 셋톱박스(STB) 미들웨어 개발 및 신규 단말 정합
- **알티캐스트** (2012-2019): DVB-MHP/OCAP 기반 미들웨어 세계 최초 상용화 기업, 전 세계 25개+ 유료방송사 5,000만 대+ 디바이스 공급
- **알티미디어** (2019-2025): 알티캐스트에서 물적분할, 미디어 플랫폼 사업 승계, KT 그룹사 편입
- **KT 알티미디어** (2025-현재): 사명 변경
- **프로젝트 규모**: 약 10년간 30여 건의 공식 프로젝트 수행
- **대상 MSO(방송사)**: TBroad, 제주방송, LGHV, 딜라이브, 충북방송, KCTV, HCN, JCN 등
- **업무 범위**: 신규 단말 정합(Humax/Samsung/LG/MIRAE), UI/UX 서비스 개발, CAS/XCAS 전환, 클라우드 서비스 구축
- **UI/UX 플랫폼 진화**: Windmill(2D/3D 그래픽스 엔진) → Wind3/Command Cloud(클라우드 커맨드 기반) → Image Cloud(클라우드 렌더링)
- **핵심 성과**: 다종 제조사 단말 플랫폼 추상화, 다수 MSO 서비스 커스터마이징, CAS→XCAS 무중단 전환, UI 세대 전환 아키텍처 설계

### 2. AI/음성 서비스 전환 (2022 ~ 현재)
- **KT 키오스크 음성 에이전트**: KT STT 기반 Windows 키오스크 음성 에이전트 시스템
- **VTT 미디어 AI**: 실시간 STT/TTS, AI 회의록 자동 생성 (SUMMA Electron → SUMMA2 Tauri)
- **MyTammi**: 베트남 TV 미디어 AI 어시스턴트 (Multi-Agent 아키텍처)
- **PortfolioLive**: 포트폴리오 웹 + LangGraph RAG 대화형 Q&A (본 서비스)

### 3. 개인 프로젝트 / iOS·macOS 앱
- **ZeroPlayer**: YouTube 플레이리스트 음악 스트리밍 앱 (App Store 출시)
- **SimpleSecretRotto**: AI 로또 번호 분석 앱 (App Store 출시)
- **CalendarMiniBar**: macOS 메뉴바 캘린더 앱 (App Store 출시)
- **Wander**: 여행 사진 타임라인 + AI 스토리 생성 앱
- **Black Radio**: watchOS 한국 라디오 스트리밍 앱"""

TECH_TRANSITION_FALLBACK = """C/C++ 임베디드 10년+ 경험 위에 Python/TypeScript 기반 AI 서비스 풀스택으로 확장. 저수준 시스템 이해가 AI 서비스 성능 최적화와 아키텍처 설계에 강점으로 작용."""


def _format_date(date_str: Optional[str]) -> str:
    """ISO 날짜 문자열을 YYYY.MM 형식으로 변환"""
    if not date_str:
        return "현재"
    try:
        # asyncpg는 datetime 객체로 반환하므로 문자열 변환
        dt_str = str(date_str)
        # "2012-03-01 00:00:00" 또는 "2012-03-01" 형태 처리
        parts = dt_str.split("-")
        if len(parts) >= 2:
            year = parts[0].strip()
            month = parts[1].strip()[:2]
            return f"{year}.{month.zfill(2)}"
    except Exception:
        pass
    return str(date_str)


def _format_career_entry(career: dict, projects: list[dict]) -> str:
    """단일 Career 레코드를 마크다운 텍스트로 변환"""
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


async def load_career_context() -> str:
    """DB에서 careers + work_projects를 로드하여 프롬프트용 텍스트 반환.

    DB 데이터가 있으면 DB 데이터를 우선 사용하고,
    없거나 오류 시 하드코딩 fallback을 반환한다.
    """
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            careers = await conn.fetch(
                """
                SELECT id, company, company_type, department, position, location,
                       started_at, ended_at, is_current, tech_transition, summary, sort_order
                FROM careers
                ORDER BY sort_order ASC, started_at DESC
                """
            )

            if not careers:
                logger.info("[CareerLoader] No careers in DB, using fallback")
                return CAREER_FALLBACK

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

        # career_id별로 projects 그룹화
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

        result = "\n\n".join(sections)
        logger.info(f"[CareerLoader] Loaded {len(careers)} careers from DB")
        return result

    except Exception as e:
        logger.warning(f"[CareerLoader] DB load failed, using fallback: {e}")
        return CAREER_FALLBACK


async def load_tech_transition_context() -> str:
    """DB에서 기술 전환 관련 컨텍스트 로드 (TECHNICAL 프롬프트용).

    careers 테이블의 tech_transition 필드 + summary를 조합하여 반환.
    """
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT company, tech_transition, summary
                FROM careers
                WHERE tech_transition IS NOT NULL AND tech_transition != ''
                ORDER BY sort_order ASC
                """
            )

        if not rows:
            return TECH_TRANSITION_FALLBACK

        lines = []
        for row in rows:
            company = row["company"]
            tech = row["tech_transition"]
            summary = row["summary"]
            entry = f"- **{company}**: {tech}"
            if summary:
                entry += f" — {summary}"
            lines.append(entry)

        return "\n".join(lines)

    except Exception as e:
        logger.warning(f"[CareerLoader] Tech transition load failed, using fallback: {e}")
        return TECH_TRANSITION_FALLBACK
