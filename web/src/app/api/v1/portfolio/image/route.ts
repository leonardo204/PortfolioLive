import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/leonardo204/Portfolio/main/projects'

const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
])

// sharp로 처리 가능한 확장자
const RESIZABLE = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const MAX_WIDTH = 800

/**
 * GitHub 이미지 프록시 + 리사이즈/최적화
 * GET /api/v1/portfolio/image?slug=wander&path=images/01_home_main.png&w=400
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const path = req.nextUrl.searchParams.get('path')
  const widthParam = req.nextUrl.searchParams.get('w')

  if (!slug || !path) {
    return NextResponse.json({ error: 'slug and path required' }, { status: 400 })
  }

  // path traversal 방지
  if (path.includes('..') || path.startsWith('/')) {
    return NextResponse.json({ error: 'invalid path' }, { status: 400 })
  }

  // 허용 확장자 검사
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'unsupported file type' }, { status: 400 })
  }

  const url = `${GITHUB_RAW_BASE}/${encodeURIComponent(slug)}/${path}`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) {
      return new NextResponse(null, { status: 404 })
    }

    const buffer = Buffer.from(await res.arrayBuffer())

    // SVG, GIF, ICO는 리사이즈 없이 그대로 반환
    if (!RESIZABLE.has(ext)) {
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': res.headers.get('content-type') || 'image/png',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      })
    }

    // 리사이즈 + WebP 최적화
    const targetWidth = widthParam ? Math.min(parseInt(widthParam, 10), MAX_WIDTH) : MAX_WIDTH
    const optimized = await sharp(buffer)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    return new NextResponse(new Uint8Array(optimized), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
