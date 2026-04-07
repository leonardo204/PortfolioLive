'use client'

import { useState, useEffect, Fragment } from 'react'
import { FolderKanban, RefreshCw, Pencil, Check, X, GitFork, Clock } from 'lucide-react'

type Project = {
  id: number
  slug: string
  title: string
  description: string | null
  category: string | null
  technologies: string[]
  year: string | null
  githubUrl: string | null
  lastSyncedAt: string | null
  updatedAt: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const CATEGORY_OPTIONS = [
  'AI/ML',
  'Backend',
  'Frontend',
  'Fullstack',
  'DevOps',
  'Mobile',
  'Embedded',
  'Open Source',
  'Other',
]

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState<string>('')
  const [editCategory, setEditCategory] = useState<string>('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState<string>('')
  const [syncMessage, setSyncMessage] = useState<string>('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      } else {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      }
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMessage('')
    setError('')
    try {
      const res = await fetch('/api/v1/github/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-event': 'push',
        },
        body: JSON.stringify({ ref: 'refs/heads/main', forced: false }),
      })

      if (res.ok) {
        setSyncMessage('GitHub 동기화가 시작되었습니다. 잠시 후 새로고침하세요.')
        setTimeout(() => {
          setSyncMessage('')
          fetchProjects()
        }, 3000)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'GitHub 동기화 요청 실패')
      }
    } catch {
      setError('GitHub 동기화 요청 중 오류가 발생했습니다.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSave(project: Project) {
    setSavingId(project.id)
    setError('')
    try {
      const res = await fetch('/api/v1/admin/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          description: editDesc,
          category: editCategory,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '저장 실패')
        return
      }

      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? { ...p, description: editDesc, category: editCategory || null }
            : p
        )
      )
      setEditingId(null)
    } catch {
      setError('프로젝트 저장 중 오류가 발생했습니다.')
    } finally {
      setSavingId(null)
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id)
    setEditDesc(project.description ?? '')
    setEditCategory(project.category ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDesc('')
    setEditCategory('')
  }

  // 카테고리 목록 (DB에 있는 것 + 기본값)
  const allCategories = Array.from(
    new Set([
      ...CATEGORY_OPTIONS,
      ...projects.map((p) => p.category).filter(Boolean) as string[],
    ])
  ).sort()

  const filtered = projects.filter((p) => {
    const matchCat = filterCategory ? p.category === filterCategory : true
    const matchSearch = searchQuery
      ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.technologies.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
    return matchCat && matchSearch
  })

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#abb3b9] text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-[#586065] mb-4">
          <span className="uppercase tracking-widest">Admin</span>
          <span className="text-[#abb3b9]">/</span>
          <span className="text-[#0053db] uppercase tracking-widest">프로젝트</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2b3438]">프로젝트 관리</h1>
            <p className="text-sm text-[#586065] mt-1">
              {projects.length}개 프로젝트 · GitHub에서 자동 동기화됩니다
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#f1f4f7] hover:bg-[#eaeef2] disabled:bg-[#eaeef2] text-[#2b3438] text-sm font-medium rounded-md transition-colors"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '동기화 중...' : 'GitHub Sync'}
          </button>
        </div>
      </div>

      {/* 알림 */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {syncMessage && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-600">{syncMessage}</p>
        </div>
      )}

      {/* 필터/검색 */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="제목, 설명, 기술스택 검색..."
          className="flex-1 px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#586065] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
        >
          <option value="">전체 카테고리</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#586065] whitespace-nowrap">
          {filtered.length}개 표시
        </span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-[#eaeef2] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FolderKanban className="mx-auto mb-3 text-[#abb3b9]" size={40} />
            <p className="text-[#586065] text-sm">표시할 프로젝트가 없습니다.</p>
            <p className="text-[#abb3b9] text-xs mt-1">
              GitHub Sync 버튼을 클릭하거나 검색 조건을 변경하세요.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaeef2] bg-[#f1f4f7]/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#586065] uppercase tracking-wider w-[30%]">
                  제목
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#586065] uppercase tracking-wider w-[15%]">
                  카테고리
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#586065] uppercase tracking-wider w-[25%]">
                  기술 스택
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#586065] uppercase tracking-wider w-[10%]">
                  연도
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#586065] uppercase tracking-wider w-[12%]">
                  마지막 동기화
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#586065] uppercase tracking-wider w-[8%]">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <Fragment key={project.id}>
                  <tr
                    className="border-b border-[#eaeef2] hover:bg-[#f1f4f7]/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="text-sm font-medium text-[#2b3438]">
                            {project.title}
                          </p>
                          {editingId !== project.id && project.description && (
                            <p className="text-xs text-[#586065] mt-0.5 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          {editingId !== project.id && !project.description && (
                            <p className="text-xs text-[#abb3b9] mt-0.5 italic">
                              설명 없음
                            </p>
                          )}
                        </div>
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 text-[#abb3b9] hover:text-[#586065] transition-colors shrink-0"
                            title="GitHub에서 보기"
                          >
                            <GitFork size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {editingId !== project.id ? (
                        project.category ? (
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                            {project.category}
                          </span>
                        ) : (
                          <span className="text-xs text-[#abb3b9] italic">미분류</span>
                        )
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] px-1.5 py-0.5 bg-[#eaeef2] text-[#586065] rounded"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 4 && (
                          <span className="text-[10px] text-[#abb3b9]">
                            +{project.technologies.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#586065]">
                      {project.year ?? '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs text-[#abb3b9]">
                        <Clock size={11} />
                        <span>{formatDate(project.lastSyncedAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {editingId !== project.id && (
                        <button
                          onClick={() => startEdit(project)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f4f7] hover:bg-[#eaeef2] text-[#586065] text-xs font-medium rounded-md transition-colors ml-auto"
                        >
                          <Pencil size={12} />
                          수정
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* 인라인 편집 행 */}
                  {editingId === project.id && (
                    <tr
                      key={`edit-${project.id}`}
                      className="bg-[#dbe1ff]/10 border-b border-[#0053db]/10"
                    >
                      <td colSpan={6} className="px-4 py-4">
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-[#0053db] uppercase tracking-wider">
                            {project.title} 편집
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
                                카테고리
                              </label>
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
                              >
                                <option value="">미분류</option>
                                {allCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
                              설명
                            </label>
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="프로젝트 설명을 입력하세요"
                              rows={3}
                              className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db] resize-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(project)}
                              disabled={savingId === project.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#0053db] hover:bg-[#0048bf] disabled:bg-[#eaeef2] text-white text-sm font-medium rounded-md transition-colors"
                            >
                              <Check size={14} />
                              {savingId === project.id ? '저장 중...' : '저장'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#f1f4f7] hover:bg-[#eaeef2] text-[#586065] text-sm font-medium rounded-md transition-colors"
                            >
                              <X size={14} />
                              취소
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
