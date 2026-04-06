import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('시딩 시작...')

  // 기존 데이터 삭제 (work_projects → careers 순서)
  await prisma.workProject.deleteMany()
  await prisma.career.deleteMany()

  // 경력 데이터 생성
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
    },
  })

  // 케이티알티미디어 프로젝트
  await prisma.workProject.createMany({
    data: [
      {
        careerId: ktRtMedia.id,
        year: '2024',
        title: 'AI 에이전트 키오스크 (KT)',
        description: 'KT AI 키오스크용 대화형 에이전트 개발. LLM 기반 자연어 처리 및 멀티모달 인터랙션 구현.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2023',
        title: 'InAppTV 크로스플랫폼 플레이어',
        description: 'React Native 기반 InAppTV 플레이어 개발. Android/iOS/TV 통합 지원.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2022',
        title: 'Tizen TV 앱 개발',
        description: 'Samsung Tizen 플랫폼용 OTT 앱 개발. 스트리밍 최적화 및 DRM 연동.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2021',
        title: 'LGHV STB 클라우드 미들웨어',
        description: 'LG헬로비전 STB 클라우드 미들웨어 개발. 원격 UI 렌더링 및 채널 관리 기능 구현.',
      },
      {
        careerId: ktRtMedia.id,
        year: '2020',
        title: 'STB 클라우드 플랫폼 구축',
        description: 'STB 단말 없이 클라우드에서 방송 서비스를 제공하는 플랫폼 초기 설계 및 개발.',
      },
    ],
  })

  // 알티캐스트 프로젝트
  await prisma.workProject.createMany({
    data: [
      {
        careerId: rticast.id,
        year: '2019',
        title: 'Windmill Framework 고도화',
        description: 'STB UI 개발용 Windmill 프레임워크 성능 개선 및 신규 위젯 개발.',
      },
      {
        careerId: rticast.id,
        year: '2018',
        title: '제주방송 STB UI 개발',
        description: '제주방송 케이블TV STB UI/UX 전면 개편. Windmill 프레임워크 적용.',
      },
      {
        careerId: rticast.id,
        year: '2017',
        title: 'Tbroad STB 미들웨어 정합',
        description: 'Tbroad(태광그룹) STB 미들웨어 및 UI 정합 개발. DVB 스택 연동.',
      },
      {
        careerId: rticast.id,
        year: '2015',
        title: 'HFC 네트워크 STB 플랫폼',
        description: 'HFC 케이블 네트워크 환경 STB 플랫폼 개발. 채널 스캔 및 EPG 구현.',
      },
      {
        careerId: rticast.id,
        year: '2013',
        title: 'STB UI 렌더링 엔진 개선',
        description: 'STB 저사양 환경에서의 UI 렌더링 최적화. 메모리 사용량 30% 감소 달성.',
      },
    ],
  })

  // p&i solution 프로젝트
  await prisma.workProject.createMany({
    data: [
      {
        careerId: pni.id,
        year: '2012',
        title: 'CAE 해석 자동화 시스템',
        description: 'CAE(Computer-Aided Engineering) 해석 결과 자동 처리 및 리포트 생성 시스템 개발.',
      },
      {
        careerId: pni.id,
        year: '2011',
        title: 'CAD 데이터 변환 도구',
        description: '다양한 CAD 포맷(STEP, IGES, DXF) 간 데이터 변환 및 검증 도구 개발.',
      },
      {
        careerId: pni.id,
        year: '2010',
        title: '설계 자동화 플러그인',
        description: 'SolidWorks/CATIA 연동 설계 자동화 플러그인 개발. 반복 설계 작업 효율화.',
      },
    ],
  })

  const totalCareers = await prisma.career.count()
  const totalProjects = await prisma.workProject.count()

  console.log(`시딩 완료!`)
  console.log(`  경력: ${totalCareers}개`)
  console.log(`  프로젝트: ${totalProjects}개`)
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
