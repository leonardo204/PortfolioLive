import re
from typing import Any


class MarkdownParser:
    """마크다운 README를 섹션별로 분할하고 메타데이터를 추출합니다."""

    # 관심 있는 섹션 헤더 패턴
    SECTION_PATTERNS = [
        r"개요|overview|소개|introduction|about",
        r"기능|features|주요 기능",
        r"기술|tech|stack|technologies|사용 기술",
        r"아키텍처|architecture|구조|design",
        r"도전|challenge|문제|해결|solution|lessons?",
        r"설치|install|setup|getting started|사용법|usage",
        r"결과|result|demo|성과|achievements?",
        r"배경|background|motivation|목적",
    ]

    def extract_metadata(self, readme: str, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
        """README에서 title, description, technologies 등 추출"""
        fallback = fallback or {}
        lines = [l for l in readme.split("\n") if l.strip()]

        # title: 첫 번째 # 헤더
        title = fallback.get("repo", "")
        for line in lines[:10]:
            h1 = re.match(r"^#\s+(.+)", line)
            if h1:
                title = h1.group(1).strip()
                break

        # description: 첫 번째 단락 (헤더 아닌 줄)
        description = fallback.get("description", "")
        if not description:
            for line in lines[:20]:
                if not line.startswith("#") and not line.startswith("|") and len(line) > 20:
                    description = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line).strip()
                    break

        # technologies: 코드 스팬 `` ` `` 또는 badge 이미지 alt 텍스트에서 추출
        techs: list[str] = list(fallback.get("technologies", []))
        if not techs:
            # 인라인 코드에서 기술명 추출
            code_matches = re.findall(r"`([^`]+)`", readme)
            # 기술명처럼 보이는 것 (짧고 알파벳)
            for m in code_matches:
                if re.match(r"^[A-Za-z][A-Za-z0-9\.\-+#]{0,20}$", m):
                    techs.append(m)
            techs = list(dict.fromkeys(techs))[:15]  # 중복 제거, 최대 15개

        return {
            "title": title,
            "description": description,
            "technologies": techs,
            "category": fallback.get("category", ""),
            "year": fallback.get("year", ""),
        }

    def split_into_chunks(
        self, readme: str, source_type: str, source_id: int, metadata: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """
        README를 ## 헤더 기준으로 섹션 청크로 분할합니다.
        청크가 너무 크면 단락 기준으로 추가 분할합니다.
        """
        chunks = []

        # ## 또는 # 헤더 기준으로 분할
        sections = re.split(r"\n(?=#{1,3}\s)", readme)

        # 섹션이 없는 경우 전체를 하나의 청크로
        if len(sections) <= 1:
            sections = [readme]

        # 첫 번째 섹션 (헤더 이전 내용) 처리
        valid_sections = []
        for sec in sections:
            sec = sec.strip()
            if len(sec) < 10:
                continue
            valid_sections.append(sec)

        if not valid_sections:
            valid_sections = [readme]

        total = len(valid_sections)

        for idx, section in enumerate(valid_sections):
            # 섹션 헤더 추출
            header_match = re.match(r"^(#{1,3})\s+(.+)", section)
            section_name = header_match.group(2).strip() if header_match else "intro"

            # 섹션 내용 (헤더 제거)
            if header_match:
                content = section[header_match.end():].strip()
            else:
                content = section.strip()

            if not content:
                continue

            # 너무 긴 섹션은 단락 기준으로 분할
            sub_chunks = self._split_by_paragraphs(content, max_chars=1500)

            for sub_idx, sub_content in enumerate(sub_chunks):
                if not sub_content.strip():
                    continue
                chunks.append({
                    "source_type": source_type,
                    "source_id": source_id,
                    "section": section_name,
                    "content": sub_content.strip(),
                    "metadata": {
                        **metadata,
                        "section_index": idx,
                        "sub_index": sub_idx,
                    },
                    "chunk_index": len(chunks),
                    "total_chunks": 0,  # 나중에 갱신
                })

        # total_chunks 갱신
        total_chunks = len(chunks)
        for chunk in chunks:
            chunk["total_chunks"] = total_chunks

        return chunks

    def _split_by_paragraphs(self, text: str, max_chars: int = 1500) -> list[str]:
        """텍스트를 단락 기준으로 분할 (max_chars 초과 시)"""
        if len(text) <= max_chars:
            return [text]

        paragraphs = re.split(r"\n\n+", text)
        chunks = []
        current = ""

        for para in paragraphs:
            if len(current) + len(para) + 2 <= max_chars:
                current = (current + "\n\n" + para).strip()
            else:
                if current:
                    chunks.append(current)
                # 단락 자체가 max_chars 초과하면 그냥 추가
                current = para

        if current:
            chunks.append(current)

        return chunks if chunks else [text]
