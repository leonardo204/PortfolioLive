from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from ..pipeline.github_fetcher import GitHubFetcher
from ..pipeline.markdown_parser import MarkdownParser
from ..pipeline.store import PipelineStore
from ..pipeline.embedder import Embedder
from ..rag.retriever import RAGRetriever

router = APIRouter(prefix="/agent", tags=["pipeline"])


class SyncResult(BaseModel):
    success: int
    failed: int
    total_chunks: int
    total_embeddings: int
    details: list[dict[str, Any]] = []


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/pipeline/sync", response_model=SyncResult)
async def sync_pipeline() -> SyncResult:
    """
    GitHub Portfolio 리포지토리에서 프로젝트를 fetch하고
    파싱 → DB 저장 → 임베딩 생성까지 전체 파이프라인을 실행합니다.
    """
    fetcher = GitHubFetcher()
    parser = MarkdownParser()
    store = PipelineStore()
    embedder = Embedder()

    success_count = 0
    failed_count = 0
    total_chunks = 0
    total_embeddings = 0
    details: list[dict[str, Any]] = []

    try:
        # 1. GitHub에서 프로젝트 목록 fetch
        print("[Pipeline] Fetching projects from GitHub...")
        projects = await fetcher.fetch_portfolio_projects()
        print(f"[Pipeline] Fetched {len(projects)} projects")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub fetch failed: {e}")

    for project_data in projects:
        repo = project_data.get("repo", "unknown")
        try:
            # 2. 메타데이터 추출
            readme = project_data.get("readme", "")
            meta = parser.extract_metadata(readme, fallback={
                "repo": repo,
                "description": project_data.get("meta", {}).get("description", ""),
                "category": project_data.get("category", ""),
                "technologies": project_data.get("technologies", []),
                "year": project_data.get("year", ""),
            })

            repo_meta = project_data.get("meta", {})
            github_url = repo_meta.get("html_url", f"https://github.com/leonardo204/{repo}")

            # 3. DB에 upsert
            project_record = {
                "slug": project_data.get("slug", repo.lower()),
                "title": meta["title"] or repo,
                "description": meta["description"],
                "category": meta["category"],
                "technologies": meta["technologies"],
                "year": meta["year"],
                "github_url": github_url,
                "readme_raw": readme,
                "readme_raw_en": project_data.get("readme_en", "") or None,
            }
            project_id = await store.upsert_portfolio_project(project_record)

            # 4. 청크 분할
            chunks = parser.split_into_chunks(
                readme or f"# {repo}\n\n{meta['description']}",
                source_type="portfolio_project",
                source_id=project_id,
                metadata={
                    "title": meta["title"],
                    "slug": project_data.get("slug", ""),
                    "github_url": github_url,
                    "technologies": meta["technologies"],
                    "category": meta["category"],
                    "year": meta["year"],
                },
            )

            if not chunks:
                print(f"[Pipeline] No chunks for {repo}, skipping embedding")
                success_count += 1
                details.append({"repo": repo, "id": project_id, "chunks": 0, "embeddings": 0})
                continue

            # 5. 기존 임베딩 삭제 (재동기화)
            await store.delete_embeddings_for_source("portfolio_project", project_id)

            # 6. 임베딩 생성
            texts = [c["content"] for c in chunks]
            embeddings = await embedder.embed_texts(texts)

            # 7. 임베딩 저장
            saved = await store.save_embeddings(chunks, embeddings)

            total_chunks += len(chunks)
            total_embeddings += saved
            success_count += 1
            details.append({
                "repo": repo,
                "id": project_id,
                "chunks": len(chunks),
                "embeddings": saved,
            })
            print(f"[Pipeline] {repo}: {len(chunks)} chunks, {saved} embeddings saved")

        except Exception as e:
            failed_count += 1
            details.append({"repo": repo, "error": str(e)})
            print(f"[Pipeline] Failed for {repo}: {e}")

    return SyncResult(
        success=success_count,
        failed=failed_count,
        total_chunks=total_chunks,
        total_embeddings=total_embeddings,
        details=details,
    )


@router.post("/rag/search")
async def rag_search(request: SearchRequest) -> dict[str, Any]:
    """
    쿼리 텍스트로 RAG 검색을 수행합니다.
    임베딩 생성 후 pgvector에서 유사도 검색합니다.
    """
    retriever = RAGRetriever()
    try:
        results = await retriever.search(request.query, top_k=request.top_k)
        return {
            "query": request.query,
            "top_k": request.top_k,
            "results": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG search failed: {e}")
