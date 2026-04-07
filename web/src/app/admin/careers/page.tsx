'use client'

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { Building2, MapPin, Plus, Pencil, Trash2, X, Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

type Career = {
  id: number
  company: string
  companyType: string
  department: string
  position: string
  location: string
  startedAt: string
  endedAt: string | null
  isCurrent: boolean
  techTransition: string | null
  summary: string | null
  sortOrder: number
  _count: { workProjects: number }
}

type CareerFormData = {
  company: string
  companyType: string
  department: string
  position: string
  location: string
  startedAt: string
  endedAt: string
  isCurrent: boolean
  techTransition: string
  summary: string
  sortOrder: string
}

const emptyForm: CareerFormData = {
  company: '',
  companyType: '',
  department: '',
  position: '',
  location: '',
  startedAt: '',
  endedAt: '',
  isCurrent: false,
  techTransition: '',
  summary: '',
  sortOrder: '0',
}

function formatDate(date: string | null): string {
  if (!date) return '현재'
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function calcDuration(startedAt: string, endedAt: string | null): string {
  const end = endedAt ? new Date(endedAt) : new Date()
  const start = new Date(startedAt)
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  const years = Math.floor(months / 12)
  const remainMonths = months % 12

  if (years === 0) return `${remainMonths}개월`
  if (remainMonths === 0) return `${years}년`
  return `${years}년 ${remainMonths}개월`
}

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

function careerToForm(career: Career): CareerFormData {
  return {
    company: career.company,
    companyType: career.companyType,
    department: career.department,
    position: career.position,
    location: career.location,
    startedAt: toInputDate(career.startedAt),
    endedAt: toInputDate(career.endedAt),
    isCurrent: career.isCurrent,
    techTransition: career.techTransition ?? '',
    summary: career.summary ?? '',
    sortOrder: String(career.sortOrder),
  }
}

function CareerForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  form: CareerFormData
  setForm: (f: CareerFormData) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  submitting: boolean
  submitLabel: string
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            회사명 *
          </label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="KT 알티미디어"
            required
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            회사 유형 *
          </label>
          <input
            type="text"
            value={form.companyType}
            onChange={(e) => setForm({ ...form, companyType: e.target.value })}
            placeholder="대기업 / 중소기업 / 스타트업"
            required
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            부서 *
          </label>
          <input
            type="text"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            placeholder="개발팀"
            required
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            직책 *
          </label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="선임 개발자"
            required
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            위치 *
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="서울"
            required
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            정렬 순서
          </label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            placeholder="0"
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            입사일 *
          </label>
          <input
            type="date"
            value={form.startedAt}
            onChange={(e) => setForm({ ...form, startedAt: e.target.value })}
            required
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
            퇴사일
          </label>
          <input
            type="date"
            value={form.endedAt}
            onChange={(e) => setForm({ ...form, endedAt: e.target.value })}
            disabled={form.isCurrent}
            className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] focus:outline-none focus:ring-1 focus:ring-[#0053db] disabled:bg-[#eaeef2] disabled:text-[#abb3b9]"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) =>
                setForm({ ...form, isCurrent: e.target.checked, endedAt: e.target.checked ? '' : form.endedAt })
              }
              className="rounded border-[#abb3b9]/20 text-[#0053db] focus:ring-[#0053db]"
            />
            <span className="text-sm text-[#2b3438]">재직중</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
          기술 전환 메모
        </label>
        <input
          type="text"
          value={form.techTransition}
          onChange={(e) => setForm({ ...form, techTransition: e.target.value })}
          placeholder="C/C++ 임베디드 → Python/AI 서비스"
          className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#586065] mb-1 uppercase tracking-wider">
          요약
        </label>
        <textarea
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="해당 회사에서의 주요 역할 및 성과 요약"
          rows={3}
          className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db] resize-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0053db] hover:bg-[#0048bf] disabled:bg-[#eaeef2] text-white text-sm font-medium rounded-md transition-colors"
        >
          <Check size={14} />
          {submitting ? '처리 중...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#f1f4f7] hover:bg-[#eaeef2] text-[#586065] text-sm font-medium rounded-md transition-colors"
        >
          <X size={14} />
          취소
        </button>
      </div>
    </form>
  )
}

export default function AdminCareersPage() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [form, setForm] = useState<CareerFormData>(emptyForm)
  const [editForm, setEditForm] = useState<CareerFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCareers()
  }, [])

  async function fetchCareers() {
    try {
      const res = await fetch('/api/v1/admin/careers')
      if (res.ok) {
        const data = await res.json()
        setCareers(data)
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
      const res = await fetch('/api/v1/admin/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sortOrder: parseInt(form.sortOrder, 10) || 0,
          endedAt: form.isCurrent ? null : (form.endedAt || null),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '추가 실패')
        return
      }

      setForm(emptyForm)
      setShowAddForm(false)
      await fetchCareers()
    } catch {
      setError('경력 추가 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(e: FormEvent, careerId: number) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/admin/careers/${careerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          sortOrder: parseInt(editForm.sortOrder, 10) || 0,
          endedAt: editForm.isCurrent ? null : (editForm.endedAt || null),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '수정 실패')
        return
      }

      setEditingId(null)
      await fetchCareers()
    } catch {
      setError('경력 수정 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(careerId: number, company: string) {
    if (!confirm(`"${company}" 경력을 삭제하시겠습니까?\n연관된 모든 프로젝트도 함께 삭제됩니다.`)) return

    setError('')
    try {
      const res = await fetch(`/api/v1/admin/careers/${careerId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '삭제 실패')
        return
      }

      await fetchCareers()
    } catch {
      setError('경력 삭제 중 오류가 발생했습니다.')
    }
  }

  function startEdit(career: Career) {
    setEditingId(career.id)
    setEditForm(careerToForm(career))
    setExpandedId(career.id)
  }

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
          <span className="text-[#0053db] uppercase tracking-widest">경력</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2b3438]">경력 관리</h1>
            <p className="text-sm text-[#586065] mt-1">
              {careers.length}개 회사 · 각 회사의 프로젝트를 관리하세요
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true)
              setForm(emptyForm)
              setEditingId(null)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0053db] hover:bg-[#0048bf] text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus size={16} />
            경력 추가
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
        <div className="mb-6 bg-white rounded-lg border border-[#0053db]/20 p-6">
          <h3 className="text-sm font-semibold text-[#2b3438] mb-4">새 경력 추가</h3>
          <CareerForm
            form={form}
            setForm={setForm}
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            submitting={submitting}
            submitLabel="추가"
          />
        </div>
      )}

      {/* 회사 카드 목록 */}
      <div className="grid gap-4">
        {careers.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#eaeef2] p-12 text-center">
            <Building2 className="mx-auto mb-3 text-[#abb3b9]" size={40} />
            <p className="text-[#586065] text-sm">등록된 경력이 없습니다.</p>
            <p className="text-[#abb3b9] text-xs mt-1">
              위의 추가 버튼을 클릭하거나 시드 데이터를 실행하세요.
            </p>
          </div>
        ) : (
          careers.map((career) => (
            <div
              key={career.id}
              className="bg-white rounded-lg border border-[#eaeef2] hover:border-[#0053db]/30 hover:shadow-sm transition-all"
            >
              {editingId === career.id ? (
                // 수정 인라인 폼
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[#2b3438] mb-4">
                    경력 수정 — {career.company}
                  </h3>
                  <CareerForm
                    form={editForm}
                    setForm={setEditForm}
                    onSubmit={(e) => handleEdit(e, career.id)}
                    onCancel={() => setEditingId(null)}
                    submitting={submitting}
                    submitLabel="저장"
                  />
                </div>
              ) : (
                // 일반 카드
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-base font-semibold text-[#2b3438]">
                          {career.company}
                        </h2>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#eaeef2] text-[#586065] rounded">
                          {career.companyType}
                        </span>
                        {career.isCurrent && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#dbe1ff]/30 text-[#0053db] rounded">
                            재직중
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[#586065] mt-1">
                        <span>{career.department} · {career.position}</span>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{career.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-[#abb3b9]">
                        <span>
                          {formatDate(career.startedAt)} ~ {formatDate(career.endedAt)}
                        </span>
                        <span className="text-[#eaeef2]">|</span>
                        <span>{calcDuration(career.startedAt, career.endedAt)}</span>
                        {career.techTransition && (
                          <>
                            <span className="text-[#eaeef2]">|</span>
                            <span className="text-[#586065] truncate max-w-xs">
                              {career.techTransition}
                            </span>
                          </>
                        )}
                      </div>

                      {career.summary && (
                        <p className="mt-2 text-xs text-[#586065] leading-relaxed line-clamp-2">
                          {career.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-[#2b3438]">
                          {career._count.workProjects}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-[#abb3b9]">
                          프로젝트
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/careers/${career.id}/projects`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#0053db] hover:bg-[#0048bf] text-white text-xs font-medium rounded-md transition-colors"
                        >
                          프로젝트
                          <ArrowRight size={12} />
                        </Link>
                        <button
                          onClick={() => startEdit(career)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f4f7] hover:bg-[#eaeef2] text-[#586065] text-xs font-medium rounded-md transition-colors"
                        >
                          <Pencil size={12} />
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(career.id, career.company)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-md transition-colors"
                        >
                          <Trash2 size={12} />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 확장 토글 (summary 상세) */}
                  {career.summary && career.summary.length > 100 && (
                    <button
                      onClick={() => setExpandedId(expandedId === career.id ? null : career.id)}
                      className="mt-3 flex items-center gap-1 text-xs text-[#abb3b9] hover:text-[#586065] transition-colors"
                    >
                      {expandedId === career.id ? (
                        <>
                          <ChevronUp size={12} /> 접기
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} /> 요약 전체 보기
                        </>
                      )}
                    </button>
                  )}
                  {expandedId === career.id && career.summary && (
                    <p className="mt-2 text-xs text-[#586065] leading-relaxed border-t border-[#eaeef2] pt-3">
                      {career.summary}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
