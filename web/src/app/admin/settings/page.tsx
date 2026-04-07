'use client'

import { useState, useEffect, FormEvent } from 'react'
import { Check, RefreshCw } from 'lucide-react'

type Setting = {
  key: string
  value: string
  isPublic: boolean
  updatedAt: string
}

const HERO_FIELDS = [
  {
    key: 'hero_title',
    label: '제목',
    hint: '줄바꿈은 \\n으로 입력 (예: AI Software\\nEngineer)',
    multiline: false,
  },
  {
    key: 'hero_subtitle',
    label: '부제목',
    hint: '역할·기술 키워드 요약',
    multiline: false,
  },
  {
    key: 'hero_description',
    label: '설명',
    hint: '경력 소개 한두 문장',
    multiline: true,
  },
]

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/settings?prefix=hero_')
      if (res.ok) {
        const data: Setting[] = await res.json()
        const map: Record<string, string> = {}
        for (const s of data) {
          map[s.key] = s.value
        }
        setValues((prev) => ({ ...prev, ...map }))
      }
    } catch {
      setError('설정을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: FormEvent, key: string) {
    e.preventDefault()
    setSaving(key)
    setError('')
    setSaved(null)

    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '저장 실패')
        return
      }

      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    } catch {
      setError('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(null)
    }
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
          <span className="uppercase tracking-widest">Admin</span>
          <span className="text-gray-600">/</span>
          <span className="text-blue-600 uppercase tracking-widest">설정</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">사이트 설정</h1>
            <p className="text-sm text-gray-500 mt-1">
              히어로 섹션 텍스트를 수정합니다. 저장 즉시 사이트에 반영됩니다.
            </p>
          </div>
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-md transition-colors"
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 히어로 텍스트 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">히어로 섹션</h2>
          <p className="text-xs text-gray-400 mt-0.5">메인 페이지 상단 텍스트</p>
        </div>

        <div className="divide-y divide-gray-100">
          {HERO_FIELDS.map((field) => (
            <form
              key={field.key}
              onSubmit={(e) => handleSave(e, field.key)}
              className="px-6 py-5"
            >
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                {field.label}
              </label>

              {field.multiline ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              )}

              {field.hint && (
                <p className="mt-1 text-[11px] text-gray-400">{field.hint}</p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving === field.key}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Check size={12} />
                  {saving === field.key ? '저장 중...' : '저장'}
                </button>
                {saved === field.key && (
                  <span className="text-xs text-green-600 font-medium">저장되었습니다.</span>
                )}
              </div>
            </form>
          ))}
        </div>
      </div>
    </div>
  )
}
