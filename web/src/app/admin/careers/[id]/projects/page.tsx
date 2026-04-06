'use client'

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, X, Check, ChevronLeft } from 'lucide-react'

type WorkProject = {
  id: number
  careerId: number
  year: string
  title: string
  description: string
  createdAt: string
}

type Career = {
  id: number
  company: string
  department: string
  position: string
}

type FormData = {
  year: string
  title: string
  description: string
}

const emptyForm: FormData = { year: '', title: '', description: '' }

export default function AdminProjectsPage() {
  const params = useParams()
  const careerId = params.id as string

  const [career, setCareer] = useState<Career | null>(null)
  const [projects, setProjects] = useState<WorkProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [editForm, setEditForm] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [careerId])

  async function fetchData() {
    try {
      const [careerRes, projectsRes] = await Promise.all([
        fetch(`/api/v1/admin/careers`),
        fetch(`/api/v1/admin/careers/${careerId}/projects`),
      ])

      if (careerRes.ok) {
        const careers: Career[] = await careerRes.json()
        const found = careers.find((c) => c.id === parseInt(careerId))
        setCareer(found || null)
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data)
      }
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/admin/careers/${careerId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '추가 실패')
        return
      }

      setForm(emptyForm)
      setShowAddForm(false)
      await fetchData()
    } catch {
      setError('프로젝트 추가 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(e: FormEvent, projectId: number) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/admin/careers/${careerId}/projects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, ...editForm }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '수정 실패')
        return
      }

      setEditingId(null)
      await fetchData()
    } catch {
      setError('프로젝트 수정 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(projectId: number) {
    if (!confirm('이 프로젝트를 삭제하시겠습니까?')) return

    setError('')
    try {
      const res = await fetch(`/api/v1/admin/careers/${careerId}/projects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '삭제 실패')
        return
      }

      await fetchData()
    } catch {
      setError('프로젝트 삭제 중 오류가 발생했습니다.')
    }
  }

  function startEdit(project: WorkProject) {
    setEditingId(project.id)
    setEditForm({
      year: project.year,
      title: project.title,
      description: project.description,
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <Link
            href="/admin/careers"
            className="hover:text-gray-600 flex items-center gap-1 uppercase tracking-widest"
          >
            <ChevronLeft size={12} />
            경력
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-blue-600 uppercase tracking-widest">프로젝트</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {career ? career.company : '회사'} — 프로젝트
            </h1>
            {career && (
              <p className="text-sm text-gray-500 mt-1">
                {career.department} · {career.position} · {projects.length}개 프로젝트
              </p>
            )}
          </div>

          <button
            onClick={() => {
              setShowAddForm(true)
              setForm(emptyForm)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus size={16} />
            프로젝트 추가
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 추가 폼 */}
      {showAddForm && (
        <div className="mb-6 bg-white rounded-lg border border-blue-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">새 프로젝트 추가</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  연도 *
                </label>
                <input
                  type="text"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2024"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  제목 *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="프로젝트 제목"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                설명 *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="프로젝트 설명"
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Check size={14} />
                {submitting ? '추가 중...' : '추가'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-md transition-colors"
              >
                <X size={14} />
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 프로젝트 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500 w-20">
                연도
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500 w-1/4">
                제목
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                설명
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-500 w-24">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-sm">
                  등록된 프로젝트가 없습니다. 위의 추가 버튼을 클릭하세요.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                  {editingId === project.id ? (
                    // 수정 인라인 폼
                    <td colSpan={4} className="px-4 py-4">
                      <form onSubmit={(e) => handleEdit(e, project.id)} className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editForm.year}
                            onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                            placeholder="연도"
                            required
                            className="px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="제목"
                            required
                            className="col-span-2 px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          placeholder="설명"
                          required
                          rows={2}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Check size={12} />
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded transition-colors"
                          >
                            <X size={12} />
                            취소
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    // 일반 행
                    <>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {project.year}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {project.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs leading-relaxed">
                        {project.description}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(project)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="수정"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
