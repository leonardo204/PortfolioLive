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

/**
 * Content-Signal 머리말.
 *
 * 이 선언이 신호의 무게를 만든다. 신호만 적어 두면 "그래서 무엇을 근거로 거부하나"가
 * 빠져서, 따르는 쪽도 안 따르는 쪽도 판단할 것이 없다. 접속 조건과 권리 유보를
 * 함께 적어 두는 것이 contentsignals.org 가 정한 형식이다.
 *
 * 영문 그대로 두는 이유: 이 문구는 사람이 읽으라고 쓰는 글이 아니라 법적 근거로
 * 인용되는 정형문이라, 옮겨 적으면 근거로서의 값을 잃는다. 우리말 요약은 아래에 따로 둔다.
 * use= 항목은 우리가 쓰지 않으므로 정의에서 뺐다.
 */
const CONTENT_SIGNAL_PREAMBLE = [
  '# As a condition of accessing this website, you agree to abide by the following',
  '# content signals:',
  '#',
  '# (a)  If a content signal = yes, you may collect content for the corresponding',
  '#      use.',
  '# (b)  If a content signal = no, you may not collect content for the',
  '#      corresponding use.',
  '# (c)  If the website operator does not include a content signal for a',
  '#      corresponding use, the website operator neither grants nor restricts',
  '#      permission via content signal with respect to the corresponding use.',
  '#',
  '# The content signals and their meanings are:',
  '#',
  '# search:   building a search index and providing search results (e.g., returning',
  '#           hyperlinks and short excerpts from your website\'s contents). Search does',
  '#           not include providing AI-generated search summaries.',
  '# ai-input: inputting content into one or more AI models (e.g., retrieval augmented',
  '#           generation, grounding, or other real-time taking of content for',
  '#           generative AI search answers).',
  '# ai-train: training or fine-tuning AI models.',
  '#',
  '# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS RESERVATIONS OF',
  '# RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790 ON COPYRIGHT',
  '# AND RELATED RIGHTS IN THE DIGITAL SINGLE MARKET.',
  '',
]

function build(): string {
  const lines: string[] = [
    ...CONTENT_SIGNAL_PREAMBLE,
    '# 이 사이트의 수집 규칙 (위 선언의 우리말 요약)',
    '#',
    '# search   : 검색 목록을 만들고 결과를 보여주는 것 — 허용',
    '# ai-input : AI가 답변을 만들 때 참고하고 출처로 다는 것 — 허용',
    '# ai-train : AI 모델을 학습시키는 것 — 거부',
    '',
    'User-agent: *',
    'Content-Signal: search=yes,ai-input=yes,ai-train=no',
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

  // Host: 는 적지 않는다. Yandex 전용이었고 2021년에 폐기됐다.
  // 아무 일도 하지 않으면서 구글 robots.txt 검사기에 경고만 남긴다.
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`, '')
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
