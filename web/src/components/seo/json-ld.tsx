/**
 * 검색엔진과 AI가 읽는 구조화 데이터를 페이지에 심는다.
 * 화면에는 아무것도 보이지 않는다.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // 값은 서버에서 만든 객체뿐이라 사용자 입력이 섞이지 않는다.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
