import { ImageResponse } from 'next/og'
import { PERSON } from '@/lib/site'

export const alt = 'Yongsub Lee — AI Software Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 기본 글꼴이 라틴 문자만 담고 있어 한글은 깨진다.
// 링크 미리보기 이미지는 영문과 숫자로만 구성한다.
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#f8f9fb',
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#586065',
            }}
          >
            {PERSON.alternateName}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: -3,
              color: '#2b3438',
              lineHeight: 1.05,
            }}
          >
            {PERSON.nameEn}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: -1,
              color: '#0053db',
            }}
          >
            {PERSON.jobTitleEn}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 2, width: '100%', backgroundColor: '#dfe4e8' }} />
          <div
            style={{
              marginTop: 26,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ fontSize: 30, color: '#586065', fontWeight: 500 }}>
              Agentic AI · Full-Stack · Embedded Systems
            </div>
            <div style={{ fontSize: 26, color: '#8b949b', fontWeight: 500 }}>
              me.zerolive.co.kr
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 28, color: '#2b3438', fontWeight: 600 }}>
            50M+ devices · 14 years · 5 apps on the App Store
          </div>
        </div>
      </div>
    ),
    size
  )
}
