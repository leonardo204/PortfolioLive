import base64
import asyncio
import httpx
from typing import Any
from ..config import settings

GITHUB_API = "https://api.github.com"
REPO_OWNER = "leonardo204"
MAIN_REPO = "Portfolio"
PROJECTS_DIR = "projects"


class GitHubFetcher:
    def __init__(self) -> None:
        self.headers = {
            "Authorization": f"Bearer {settings.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def fetch_portfolio_projects(self) -> list[dict[str, Any]]:
        """
        leonardo204/Portfolio 리포지토리의 projects/ 디렉토리에서
        29개 프로젝트 폴더를 fetch하고 각 README를 가져옵니다.
        """
        async with httpx.AsyncClient(headers=self.headers, timeout=30) as client:
            # projects/ 디렉토리 목록 가져오기
            project_dirs = await self._list_project_dirs(client)
            print(f"[GitHubFetcher] Found {len(project_dirs)} project directories")

            # 메인 README도 가져오기 (카테고리/기술 정보용)
            main_readme = await self._fetch_file_content(
                client, REPO_OWNER, MAIN_REPO, "README.md"
            )
            meta_map = self._parse_main_readme_metadata(main_readme)

            # 각 프로젝트 README fetch (병렬)
            tasks = [
                self._fetch_project(client, d, meta_map)
                for d in project_dirs
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            projects = []
            for result in results:
                if isinstance(result, Exception):
                    print(f"[GitHubFetcher] Error: {result}")
                elif result is not None:
                    projects.append(result)

            return projects

    async def _list_project_dirs(self, client: httpx.AsyncClient) -> list[str]:
        """projects/ 디렉토리 내의 폴더 목록 반환"""
        url = f"{GITHUB_API}/repos/{REPO_OWNER}/{MAIN_REPO}/contents/{PROJECTS_DIR}"
        resp = await client.get(url)
        resp.raise_for_status()
        items = resp.json()
        return [item["name"] for item in items if item["type"] == "dir"]

    async def _fetch_project(
        self,
        client: httpx.AsyncClient,
        dir_name: str,
        meta_map: dict[str, dict[str, Any]],
    ) -> dict[str, Any] | None:
        """단일 프로젝트 디렉토리에서 README를 가져옵니다."""
        # README.md 우선, 없으면 README.md 대소문자 변형 시도
        readme = ""
        for filename in ["README.md", "readme.md", "Readme.md"]:
            try:
                readme = await self._fetch_file_content(
                    client, REPO_OWNER, MAIN_REPO,
                    f"{PROJECTS_DIR}/{dir_name}/{filename}"
                )
                break
            except Exception:
                continue

        # 메인 README의 메타 정보 병합
        meta = meta_map.get(dir_name, {})

        return {
            "repo": dir_name,
            "slug": dir_name,
            "readme": readme,
            "category": meta.get("category", ""),
            "technologies": meta.get("technologies", []),
            "year": meta.get("year", ""),
            "description": meta.get("description", ""),
            "github_url": f"https://github.com/{REPO_OWNER}/{MAIN_REPO}/tree/main/{PROJECTS_DIR}/{dir_name}",
        }

    async def _fetch_file_content(
        self, client: httpx.AsyncClient, owner: str, repo: str, path: str
    ) -> str:
        """GitHub Contents API로 파일 내용을 텍스트로 반환"""
        url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        content = data.get("content", "")
        encoding = data.get("encoding", "base64")
        if encoding == "base64":
            return base64.b64decode(content).decode("utf-8", errors="replace")
        return content

    def _parse_main_readme_metadata(self, readme: str) -> dict[str, dict[str, Any]]:
        """
        메인 README의 테이블에서 각 프로젝트의 메타데이터를 추출합니다.
        링크 형식: [이름](./projects/dir-name/)
        반환: {dir_name: {description, category, technologies, year}}
        """
        import re

        meta_map: dict[str, dict[str, Any]] = {}
        lines = readme.split("\n")

        # 현재 섹션 카테고리 추적
        current_category = ""

        for line in lines:
            # 헤더에서 카테고리 추출
            h_match = re.match(r"^#{1,4}\s+(.+)", line)
            if h_match:
                header_text = h_match.group(1).strip()
                if any(kw in header_text for kw in ["AI", "Voice", "STB", "Middleware", "Personal", "Side", "Work", "Portfolio"]):
                    current_category = header_text
                continue

            if not line.strip().startswith("|"):
                continue

            # 구분선 스킵
            if re.match(r"^\|[\s:\-|]+\|$", line.strip()):
                continue

            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) < 2:
                continue

            # 각 셀에서 프로젝트 링크 찾기
            for cell_idx, cell in enumerate(cells):
                # ./projects/dir-name/ 형식 링크 찾기
                link_match = re.search(
                    r"\[([^\]]+)\]\(\./projects/([^/)]+)/?[^)]*\)",
                    cell,
                )
                if not link_match:
                    continue

                display_name = link_match.group(1).strip()
                dir_name = link_match.group(2).strip()

                # description은 다음 셀
                description = ""
                if cell_idx + 1 < len(cells):
                    desc_cell = cells[cell_idx + 1]
                    description = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", desc_cell)
                    description = re.sub(r"[*_`]", "", description)
                    # 비고 제거 (회사 프로젝트 등)
                    description = re.sub(r"\(.*?\)", "", description).strip()

                # 기술 스택: 백틱으로 감싸진 텍스트 찾기
                techs = []
                for c in cells:
                    backtick_matches = re.findall(r"`([^`]+)`", c)
                    for t in backtick_matches:
                        if re.match(r"^[A-Za-z][A-Za-z0-9\.\-+#\s]{0,25}$", t):
                            techs.append(t.strip())

                # 연도 추출 (헤더에서)
                year_match = re.search(r"\((\d{4}(?:-\d{4})?)\)", current_category)
                year = year_match.group(1) if year_match else ""

                meta_map[dir_name] = {
                    "title": display_name,
                    "description": description,
                    "category": current_category,
                    "technologies": list(dict.fromkeys(techs)),
                    "year": year,
                }

        return meta_map
