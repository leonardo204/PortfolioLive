import nodemailer, { type Transporter } from 'nodemailer'

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP 환경변수 누락 — 메일 발송 비활성화')
    return null
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465=SSL, 587=STARTTLS
    auth: { user, pass },
  })

  return cachedTransporter
}

export interface ContactNotificationPayload {
  name: string
  email: string
  message: string
  organization?: string | null
  ipAddress?: string | null
  sessionId?: number | null
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 방문자가 Contact Form을 제출하면 관리자(ADMIN_EMAIL)에게 알림 메일을 발송한다.
 * SMTP 설정이 없거나 발송 실패 시 false 반환 (호출부는 DB 저장과 무관하게 처리).
 */
export async function sendContactNotification(
  payload: ContactNotificationPayload,
): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) return false

  const to = process.env.ADMIN_EMAIL
  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  if (!to || !from) {
    console.warn('[mailer] ADMIN_EMAIL / SMTP_FROM_EMAIL 누락')
    return false
  }

  const { name, email, message, organization, ipAddress, sessionId } = payload
  const subject = `[PortfolioLive] 문의: ${name}${organization ? ` (${organization})` : ''}`

  const textLines = [
    '포트폴리오 사이트에 새 문의가 접수되었습니다.',
    '',
    `- 이름: ${name}`,
    `- 이메일: ${email}`,
    organization ? `- 소속: ${organization}` : null,
    sessionId != null ? `- 세션 ID: ${sessionId}` : null,
    ipAddress ? `- IP: ${ipAddress}` : null,
    '',
    '— 메시지 —',
    message,
  ].filter(Boolean)
  const text = textLines.join('\n')

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="color:#111;border-bottom:1px solid #eee;padding-bottom:8px;">새 문의가 접수되었습니다</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#666;width:96px;">이름</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">이메일</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        ${organization ? `<tr><td style="padding:6px 0;color:#666;">소속</td><td style="padding:6px 0;">${escapeHtml(organization)}</td></tr>` : ''}
        ${sessionId != null ? `<tr><td style="padding:6px 0;color:#666;">세션 ID</td><td style="padding:6px 0;">${sessionId}</td></tr>` : ''}
        ${ipAddress ? `<tr><td style="padding:6px 0;color:#666;">IP</td><td style="padding:6px 0;">${escapeHtml(ipAddress)}</td></tr>` : ''}
      </table>
      <div style="background:#f7f7f8;border-radius:8px;padding:16px;white-space:pre-wrap;color:#222;">${escapeHtml(message)}</div>
    </div>
  `.trim()

  try {
    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject,
      text,
      html,
    })
    return true
  } catch (err) {
    console.error('[mailer] 메일 발송 실패', err)
    return false
  }
}
