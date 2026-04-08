import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('시딩 시작...')

  // 기존 데이터 삭제 (work_projects → careers 순서)
  await prisma.workProject.deleteMany()
  await prisma.career.deleteMany()

  // ──────────────────────────────────────
  // 경력 데이터
  // ──────────────────────────────────────

  const ktRtMedia = await prisma.career.create({
    data: {
      company: '케이티알티미디어',
      companyType: '대기업',
      department: '제품혁신팀',
      position: '연구원',
      location: '서울',
      startedAt: new Date('2019-12-01'),
      endedAt: null,
      isCurrent: true,
      techTransition: 'STB Cloud → Cross-platform Players → AI Agents',
      summary: 'STB 클라우드, 크로스플랫폼 플레이어, AI 에이전트 개발',
      sortOrder: 1,
      // EN
      companyEn: 'KT Altimedia',
      departmentEn: 'Product Innovation Team',
      positionEn: 'Researcher',
      locationEn: 'Seoul',
      techTransitionEn: 'STB Cloud → Cross-platform Players → AI Agents',
      summaryEn: 'STB cloud, cross-platform player, and AI agent development',
    },
  })

  const rticast = await prisma.career.create({
    data: {
      company: '알티캐스트',
      companyType: '중견기업',
      department: '미디어기술팀',
      position: '연구원',
      location: '서울',
      startedAt: new Date('2012-09-20'),
      endedAt: new Date('2019-12-06'),
      isCurrent: false,
      techTransition: 'STB UI/UX Development · Windmill Framework',
      summary: 'STB UI/UX 개발, Windmill 프레임워크, 다수 방송사 정합',
      sortOrder: 2,
      // EN
      companyEn: 'Alticast',
      departmentEn: 'Media Technology Team',
      positionEn: 'Researcher',
      locationEn: 'Seoul',
      techTransitionEn: 'STB UI/UX Development · Windmill Framework',
      summaryEn: 'STB UI/UX development, Windmill framework, integration with multiple broadcasters',
    },
  })

  const pni = await prisma.career.create({
    data: {
      company: 'p&i solution',
      companyType: '기타',
      department: 'CAD/CAE',
      position: '대리',
      location: '수원',
      startedAt: new Date('2010-03-01'),
      endedAt: new Date('2012-07-27'),
      isCurrent: false,
      techTransition: null,
      summary: 'CAD/CAE 시스템 개발',
      sortOrder: 3,
      // EN
      companyEn: 'P&I Solution',
      departmentEn: 'CAD/CAE',
      positionEn: 'Assistant Manager',
      locationEn: 'Suwon',
      techTransitionEn: null,
      summaryEn: 'CAD/CAE system development',
    },
  })

  // ──────────────────────────────────────
  // 케이티알티미디어 프로젝트
  // ──────────────────────────────────────

  await prisma.workProject.createMany({
    data: [
      {
        careerId: ktRtMedia.id,
        year: '2025',
        title: 'ALCOL — 사내 규정 기반 Chatbot Agent',
        description:
          '사내 규정 문서 기반 RAG 챗봇. Azure AI Service, Prompty, Azure Bot Service, Bot Framework SDK, Azure Document Intelligence, OpenSearch, Microsoft Teams 연동',
      },
      {
        careerId: ktRtMedia.id,
        year: '2025',
        title: 'SUMMA — AI 회의록 자동 생성 서비스',
        description:
          'Whisper 기반 실시간 음성 인식 + AI 회의록 자동 요약. Electron → Tauri 전환, MLX Framework 활용 온디바이스 추론, React, Zustand',
      },
      {
        careerId: ktRtMedia.id,
        year: '2025',
        title: 'Viettel Home AI — Tammi 음성 비서',
        description:
          '베트남 TV 미디어 AI 어시스턴트. Multi-Agent 아키텍처 기반 음성 비서 + 미디어 에이전트. Node.js, Android TV, Azure Cloud, Azure OpenAI, LangChain/LangGraph',
      },
      {
        careerId: ktRtMedia.id,
        year: '2024',
        title: 'AI 에이전트 키오스크 (KT)',
        description:
          'KT AI 키오스크용 대화형 에이전트 개발. LLM 기반 자연어 처리 및 멀티모달 인터랙션 구현.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2023',
        title: 'InAppTV 크로스플랫폼 플레이어',
        description:
          'React Native 기반 InAppTV 플레이어 개발. Android/iOS/TV 통합 지원.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2022',
        title: 'Tizen TV 앱 개발',
        description:
          'Samsung Tizen 플랫폼용 OTT 앱 개발. 스트리밍 최적화 및 DRM 연동.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2021',
        title: 'LGHV STB 클라우드 미들웨어',
        description:
          'LG헬로비전 STB 클라우드 미들웨어 개발. 원격 UI 렌더링 및 채널 관리 기능 구현.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2020',
        title: 'STB 클라우드 플랫폼 구축',
        description:
          'STB 단말 없이 클라우드에서 방송 서비스를 제공하는 플랫폼 초기 설계 및 개발.',
      },
    ],
  })

  // ──────────────────────────────────────
  // 알티캐스트 프로젝트
  // ──────────────────────────────────────

  await prisma.workProject.createMany({
    data: [
      {
        careerId: rticast.id,
        year: '2019',
        title: 'Windmill Framework 고도화',
        description:
          'STB UI 개발용 Windmill 프레임워크 성능 개선 및 신규 위젯 개발.',
      },
      {
        careerId: rticast.id,
        year: '2018',
        title: '제주방송 STB UI 개발',
        description:
          '제주방송 케이블TV STB UI/UX 전면 개편. Windmill 프레임워크 적용.',
      },
      {
        careerId: rticast.id,
        year: '2017',
        title: 'Tbroad STB 미들웨어 정합',
        description:
          'Tbroad(태광그룹) STB 미들웨어 및 UI 정합 개발. DVB 스택 연동.',
      },
      {
        careerId: rticast.id,
        year: '2015',
        title: 'HFC 네트워크 STB 플랫폼',
        description:
          'HFC 케이블 네트워크 환경 STB 플랫폼 개발. 채널 스캔 및 EPG 구현.',
      },
      {
        careerId: rticast.id,
        year: '2013',
        title: 'STB UI 렌더링 엔진 개선',
        description:
          'STB 저사양 환경에서의 UI 렌더링 최적화. 메모리 사용량 30% 감소 달성.',
      },
    ],
  })

  // ──────────────────────────────────────
  // p&i solution 프로젝트
  // ──────────────────────────────────────

  await prisma.workProject.createMany({
    data: [
      {
        careerId: pni.id,
        year: '2012',
        title: 'CAE 해석 자동화 시스템',
        description:
          'CAE(Computer-Aided Engineering) 해석 결과 자동 처리 및 리포트 생성 시스템 개발.',
      },
      {
        careerId: pni.id,
        year: '2011',
        title: 'CAD 데이터 변환 도구',
        description:
          '다양한 CAD 포맷(STEP, IGES, DXF) 간 데이터 변환 및 검증 도구 개발.',
      },
      {
        careerId: pni.id,
        year: '2010',
        title: '설계 자동화 플러그인',
        description:
          'SolidWorks/CATIA 연동 설계 자동화 플러그인 개발. 반복 설계 작업 효율화.',
      },
    ],
  })

  // ──────────────────────────────────────
  // Admin Settings (히어로 + 프로필)
  // ──────────────────────────────────────

  const settings = [
    {
      key: 'hero_title',
      value: 'AI Software\\nEngineer',
      isPublic: true,
    },
    {
      key: 'hero_subtitle',
      value: 'Agentic AI · Full-Stack · Embedded Systems',
      isPublic: true,
    },
    {
      key: 'hero_description',
      value:
        '5,000만 대+ 디바이스에 미들웨어를 공급하며 시스템 설계 역량을 쌓았고, 최근에는 Agentic AI 기반 제품 개발에 깊이 빠져 있습니다. 개인 프로젝트로 만든 앱 5개를 App Store에 출시하기도 했습니다.',
      isPublic: true,
    },
    {
      key: 'profile_name',
      value: '이용섭',
      isPublic: true,
    },
    {
      key: 'profile_email',
      value: 'zerolive7@gmail.com',
      isPublic: true,
    },
    {
      key: 'profile_github',
      value: 'https://github.com/leonardo204',
      isPublic: true,
    },
    {
      key: 'profile_linkedin',
      value: '',
      isPublic: false,
    },
    {
      key: 'profile_bio',
      value:
        '5,000만 대+ 디바이스에 탑재된 STB 미들웨어를 개발해온 경험을 바탕으로, 현재는 Agentic AI 기반 제품 개발에 집중하고 있는 소프트웨어 엔지니어입니다.',
      isPublic: true,
    },
  ]

  for (const s of settings) {
    await prisma.adminSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, isPublic: s.isPublic },
      create: s,
    })
  }

  // ──────────────────────────────────────
  // 포트폴리오 프로젝트 정렬 순서
  // (프로젝트 자체는 GitHub sync로 생성, 여기서는 sortOrder만 설정)
  // ──────────────────────────────────────

  const portfolioSortOrder: Record<string, number> = {
    'dotclaude': 1,
    'figma-to-markdown': 2,
    'mytammi': 3,
    'vtt-assistant-chat': 4,
    'a2a-sample': 5,
    'battery-agent': 6,
    'kt-kiosk-agent': 7,
    'intent-classifier': 8,
    'news-origin': 9,
    'summa2-tauri': 10,
    'summa-electron': 11,
    'trace-tool': 12,
    'speech-tester': 13,
    'google-cloud-stt': 14,
    'stb-middleware': 15,
    'image-cloud-framework': 16,
    'make-release-note': 17,
    'zero-player': 18,
    'wander': 19,
    'simple-secret-rotto': 20,
    'mini-calendar': 21,
    'black-radio': 22,
    'markdown-editor': 23,
  }

  for (const [slug, order] of Object.entries(portfolioSortOrder)) {
    await prisma.portfolioProject.updateMany({
      where: { slug },
      data: { sortOrder: order },
    })
  }

  // ──────────────────────────────────────
  // 결과 출력
  // ──────────────────────────────────────

  const totalCareers = await prisma.career.count()
  const totalProjects = await prisma.workProject.count()
  const totalSettings = await prisma.adminSetting.count()

  console.log(`시딩 완료!`)
  console.log(`  경력: ${totalCareers}개`)
  console.log(`  프로젝트: ${totalProjects}개`)
  console.log(`  설정: ${totalSettings}개`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
