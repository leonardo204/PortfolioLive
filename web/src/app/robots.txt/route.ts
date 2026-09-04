import { SITE_URL } from '@/lib/site'

/**
 * 크롤러 규칙을 직접 만들어 내보낸다.
 *
 * Next.js가 제공하는 robots 규격에는 Content-Signal 항목이 없어서
 * 파일 전체를 직접 작성한다.
 *
 * 원칙은 하나다. 모델 학습에 쓰이는 수집은 막고, 검색과 답변 인용에 쓰이는
 * 수집은 연다. 두 가지를 가르는 근거는 각 회사의 공식 안내다.
 *   - 구글: Google-Extended를 막아도 검색 순위와 AI 요약 노출에는 영향이 없다.
 *   - 애플: Applebot-Extended는 웹페이지를 수집하지 않으며, 막아도 검색 결과에 계속 나온다.
 *   - 아마존: 알렉사 검색은 Amzn-SearchBot이 맡고, Amazonbot은 학습에도 쓰인다.
 *
 * ChatGPT-User·Perplexity-User·Amzn-User처럼 사람이 직접 요청해 가져가는 것들은
 * 이 파일을 따르지 않는다고 각 회사가 밝히고 있어 적지 않았다.
 */

const TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
  'anthropic-ai',
  'Claude-Web',
  'cohere-ai',
  'Diffbot',
  'Omgilibot',
  'Timpibot',
  'ImagesiftBot',
]

function build(): string {
  const lines: string[] = [
    '# 이 사이트의 수집 규칙',
    '#',
    '# search   : 검색 목록을 만들고 결과를 보여주는 것 — 허용',
    '# ai-input : AI가 답변을 만들 때 참고하고 출처로 다는 것 — 허용',
    '# ai-train : AI 모델을 학습시키는 것 — 거부',
    '',
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /poc',
    '',
    '# 아래는 모델 학습을 위한 수집이라 막는다.',
    '# 검색과 인용을 맡는 크롤러(OAI-SearchBot, Claude-SearchBot, PerplexityBot,',
    '# Applebot, Amzn-SearchBot, meta-webindexer 등)는 위 전체 허용 규칙을 따른다.',
    '',
  ]

  for (const bot of TRAINING_BOTS) {
    lines.push(`User-agent: ${bot}`, 'Disallow: /', '')
  }

  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`, `Host: ${SITE_URL}`, '')
  return lines.join('\n')
}

export function GET() {
  return new Response(build(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400',
    },
  })
}
