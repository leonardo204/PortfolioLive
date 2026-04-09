'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'

interface ContactFormProps {
  data: unknown
  sessionId?: number | null
}

const LABELS = {
  ko: {
    header: '연락하기',
    name: '이름',
    namePlaceholder: '홍길동',
    nameRequired: '이름을 입력해주세요.',
    organization: '소속 (선택)',
    organizationPlaceholder: '회사명 또는 소속',
    email: '이메일',
    emailPlaceholder: 'example@email.com',
    emailRequired: '이메일을 입력해주세요.',
    emailInvalid: '올바른 이메일 형식을 입력해주세요.',
    message: '메시지',
    messagePlaceholder: '전달하고 싶은 내용을 입력해주세요.',
    messageRequired: '메시지를 입력해주세요.',
    submit: '보내기',
    submitting: '전송 중...',
    successTitle: '메시지가 전송되었습니다',
    successDesc: '빠른 시일 내에 연락드리겠습니다.',
    errorDefault: '전송 중 오류가 발생했습니다. 다시 시도해주세요.',
    rateLimited: '잠시 후 다시 시도해주세요.',
  },
  en: {
    header: 'Contact',
    name: 'Name',
    namePlaceholder: 'John Doe',
    nameRequired: 'Please enter your name.',
    organization: 'Organization (optional)',
    organizationPlaceholder: 'Company or affiliation',
    email: 'Email',
    emailPlaceholder: 'example@email.com',
    emailRequired: 'Please enter your email.',
    emailInvalid: 'Please enter a valid email address.',
    message: 'Message',
    messagePlaceholder: 'Enter your message here.',
    messageRequired: 'Please enter a message.',
    submit: 'Send',
    submitting: 'Sending...',
    successTitle: 'Message sent successfully',
    successDesc: 'I will get back to you as soon as possible.',
    errorDefault: 'An error occurred. Please try again.',
    rateLimited: 'Please wait a moment before trying again.',
  },
} as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactForm({ sessionId }: ContactFormProps) {
  const locale = useLocale()
  const t = LABELS[locale === 'en' ? 'en' : 'ko']

  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = t.nameRequired
    if (!email.trim()) {
      newErrors.email = t.emailRequired
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = t.emailInvalid
    }
    if (!message.trim()) newErrors.message = t.messageRequired
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          organization: organization.trim() || undefined,
          sessionId: sessionId ?? undefined,
        }),
      })

      if (res.status === 429) {
        setServerError(t.rateLimited)
        return
      }

      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setServerError(data.error ?? t.errorDefault)
        return
      }

      setSubmitted(true)
    } catch {
      setServerError(t.errorDefault)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
          <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">
            {t.header}
          </span>
        </div>
        <div className="px-4 py-5 text-center">
          <div className="w-10 h-10 rounded-full bg-[#e6f0ff] flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 10l4.5 4.5L16 7"
                stroke="#0053db"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#2b3438] mb-1">{t.successTitle}</p>
          <p className="text-xs text-[#586065]">{t.successDesc}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
        <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">
          {t.header}
        </span>
      </div>
      <form onSubmit={handleSubmit} noValidate className="px-4 py-4 space-y-3">
        {/* 이름 */}
        <div>
          <label className="block text-xs font-medium text-[#2b3438] mb-1">
            {t.name} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            maxLength={100}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#eaeef2] bg-[#f8f9fb] text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:border-[#0053db] focus:bg-white transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* 소속 */}
        <div>
          <label className="block text-xs font-medium text-[#2b3438] mb-1">
            {t.organization}
          </label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={t.organizationPlaceholder}
            maxLength={200}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#eaeef2] bg-[#f8f9fb] text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:border-[#0053db] focus:bg-white transition-colors"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-xs font-medium text-[#2b3438] mb-1">
            {t.email} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            maxLength={254}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#eaeef2] bg-[#f8f9fb] text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:border-[#0053db] focus:bg-white transition-colors"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* 메시지 */}
        <div>
          <label className="block text-xs font-medium text-[#2b3438] mb-1">
            {t.message} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            maxLength={2000}
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[#eaeef2] bg-[#f8f9fb] text-[#2b3438] placeholder-[#abb3b9] focus:outline-none focus:border-[#0053db] focus:bg-white transition-colors resize-none"
          />
          <div className="flex justify-between items-center mt-0.5">
            {errors.message ? (
              <p className="text-xs text-red-500">{errors.message}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-[#abb3b9]">{message.length}/2000</span>
          </div>
        </div>

        {/* 서버 에러 */}
        {serverError && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0053db] rounded-lg hover:bg-[#0048bf] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  )
}
