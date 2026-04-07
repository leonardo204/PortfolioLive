'use client'

import { useState, useEffect, FormEvent } from 'react'
import { Check, Loader2, User } from 'lucide-react'

type ProfileFields = {
  profile_name: string
  profile_email: string
  profile_github: string
  profile_linkedin: string
  profile_bio: string
}

const FIELD_META: { key: keyof ProfileFields; label: string; placeholder: string; type: string; rows?: number }[] = [
  {
    key: 'profile_name',
    label: '이름',
    placeholder: '홍길동',
    type: 'text',
  },
  {
    key: 'profile_email',
    label: '이메일',
    placeholder: 'example@email.com',
    type: 'email',
  },
  {
    key: 'profile_github',
    label: 'GitHub URL',
    placeholder: 'https://github.com/username',
    type: 'url',
  },
  {
    key: 'profile_linkedin',
    label: 'LinkedIn URL',
    placeholder: 'https://www.linkedin.com/in/username',
    type: 'url',
  },
  {
    key: 'profile_bio',
    label: '자기소개 (Bio)',
    placeholder: '간략한 자기소개를 작성하세요...',
    type: 'textarea',
    rows: 4,
  },
]

const EMPTY_PROFILE: ProfileFields = {
  profile_name: '',
  profile_email: '',
  profile_github: '',
  profile_linkedin: '',
  profile_bio: '',
}

export default function AdminProfilePage() {
  const [form, setForm] = useState<ProfileFields>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/settings?prefix=profile_')
      if (res.ok) {
        const data: { key: string; value: string }[] = await res.json()
        const loaded: ProfileFields = { ...EMPTY_PROFILE }
        data.forEach((item) => {
          if (item.key in loaded) {
            loaded[item.key as keyof ProfileFields] = item.value
          }
        })
        setForm(loaded)
      } else {
        setError('프로필 데이터를 불러오는 중 오류가 발생했습니다.')
      }
    } catch {
      setError('프로필 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveField(key: keyof ProfileFields) {
    setSaving(true)
    setSavedKey(key)
    setError('')
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: form[key] }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '저장 실패')
      }
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
      setSavedKey(null)
    }
  }

  async function handleSaveAll(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMsg('')

    try {
      const keys = Object.keys(form) as (keyof ProfileFields)[]
      await Promise.all(
        keys.map((key) =>
          fetch('/api/v1/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: form[key] }),
          })
        )
      )
      setSuccessMsg('프로필이 저장되었습니다.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
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
          <span className="text-[#0053db] uppercase tracking-widest">프로필</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#2b3438]">프로필 관리</h1>
          <p className="text-sm text-[#586065] mt-1">
            포트폴리오에 표시될 개인 정보를 관리합니다
          </p>
        </div>
      </div>

      {/* 알림 */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMsg}</p>
        </div>
      )}

      {/* 폼 */}
      <form onSubmit={handleSaveAll}>
        <div className="bg-white rounded-lg border border-[#eaeef2] overflow-hidden">
          {/* 폼 상단 아이콘 */}
          <div className="px-6 py-5 border-b border-[#eaeef2] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#dbe1ff]/30 flex items-center justify-center">
              <User size={20} className="text-[#0053db]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#2b3438]">
                {form.profile_name || '이름 미설정'}
              </p>
              <p className="text-xs text-[#586065]">
                {form.profile_email || '이메일 미설정'}
              </p>
            </div>
          </div>

          {/* 필드 목록 */}
          <div className="divide-y divide-[#eaeef2]">
            {FIELD_META.map(({ key, label, placeholder, type, rows }) => (
              <div key={key} className="px-6 py-5">
                <label className="block text-xs font-medium text-[#586065] mb-1.5 uppercase tracking-wider">
                  {label}
                </label>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {type === 'textarea' ? (
                      <textarea
                        value={form[key]}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        rows={rows ?? 3}
                        className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db] resize-none"
                      />
                    ) : (
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        className="w-full px-3 py-2 bg-[#f8f9fb] border border-[#eaeef2] rounded-md text-sm text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:ring-1 focus:ring-[#0053db]"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveField(key)}
                    disabled={saving && savedKey === key}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#f1f4f7] hover:bg-[#eaeef2] disabled:bg-[#eaeef2] text-[#586065] disabled:text-[#abb3b9] text-xs font-medium rounded-md transition-colors mt-0"
                  >
                    {saving && savedKey === key ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    저장
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 전체 저장 버튼 */}
          <div className="px-6 py-4 bg-[#f1f4f7]/50 border-t border-[#eaeef2] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#0053db] hover:bg-[#0048bf] disabled:bg-[#eaeef2] text-white text-sm font-medium rounded-md transition-colors"
            >
              {saving && savedKey === null ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {saving && savedKey === null ? '저장 중...' : '전체 저장'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
