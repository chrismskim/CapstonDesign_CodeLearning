import type {
  VulnerableTableItem,
  QuestionSetTableItem,
  VulnerableIndividual,
  QuestionSet,
  CallHistoryTableItem,
  CallLog,
  ConsultationQueueItem,
} from "@/types"

export const mockVulnerableIndividuals: VulnerableIndividual[] = [
  {
    user_id: "U20250521",
    name: "홍길동",
    gender: "M",
    birth_date: "2001-01-01",
    phone_number: "010-1234-5678",
    address: { state: "서울특별시", city: "강남구", address1: "테헤란로 123", address2: "456호" },
    vulnerabilities: {
      summary:
        "경제적 어려움과 사회적 고립감을 느끼고 있으며, 최근 월세가 3개월 밀렸다고 언급함. 일자리를 찾고 싶어함.",
      risk_list: [
        { type: [1], content: "월세가 3개월 밀렸어요." },
        { type: [3], content: "실직 상태" },
      ],
      desire_list: [{ type: [2, 4], content: "일자리를 찾고 싶어요." }],
    },
    last_consultation_id: "C20240520001",
  },
  {
    user_id: "U20250522",
    name: "김영희",
    gender: "F",
    birth_date: "1975-03-15",
    phone_number: "010-9876-5432",
    address: { state: "부산광역시", city: "해운대구", address1: "해운대로 789", address2: "" },
    vulnerabilities: {
      summary: "만성 질환으로 거동이 불편하며, 정기적인 건강 검진 지원이 필요하다고 함. 돌봄 부담도 느끼고 있음.",
      risk_list: [{ type: [6], content: "만성 질환으로 거동이 불편해요." }],
      desire_list: [
        { type: [1], content: "정기적인 건강 검진 지원이 필요해요." },
        { type: [3], content: "돌봄 서비스 연계 희망" },
      ],
    },
    last_consultation_id: "C20240519003",
  },
  {
    user_id: "U20250523",
    name: "박철수",
    gender: "M",
    birth_date: "1990-11-20",
    phone_number: "010-5555-4444",
    address: { state: "경기도", city: "수원시", address1: "정조로 1" },
    vulnerabilities: {
      summary: "최근 특별한 어려움은 없으나, 가끔 외로움을 느낀다고 함.",
      risk_list: [],
      desire_list: [{ type: [5], content: "사회 활동 참여 희망" }],
    },
  },
  {
    user_id: "U20250524",
    name: "이하나",
    gender: "F",
    birth_date: "1985-07-01",
    phone_number: "010-1111-2222",
    address: { state: "인천광역시", city: "남동구", address1: "예술로 123" },
    vulnerabilities: {
      summary: "최근 이직으로 스트레스가 많고, 새로운 환경에 적응 중.",
      risk_list: [{ type: [3], content: "이직 후 스트레스" }],
      desire_list: [{ type: [5], content: "새로운 동네 친구 사귀기" }],
    },
  },
  {
    user_id: "U20250525",
    name: "최민준",
    gender: "M",
    birth_date: "1968-09-05",
    phone_number: "010-2345-6789",
    address: { state: "대구광역시", city: "수성구", address1: "달구벌대로 500" },
    vulnerabilities: {
      summary: "독거노인으로, 난방비 부담과 겨울철 건강 문제 우려.",
      risk_list: [
        { type: [7], content: "난방비 부담" },
        { type: [6], content: "겨울철 건강 악화 우려" },
      ],
      desire_list: [{ type: [1], content: "따뜻한 겨울나기 지원" }],
    },
  },
  {
    user_id: "U20250526",
    name: "정수빈",
    gender: "F",
    birth_date: "1995-02-28",
    phone_number: "010-3456-7890",
    address: { state: "광주광역시", city: "서구", address1: "상무대로 100" },
    vulnerabilities: {
      summary: "미혼모로, 양육과 경제 활동 병행에 어려움을 겪고 있음.",
      risk_list: [
        { type: [3], content: "양육으로 인한 경력 단절" },
        { type: [1], content: "생활비 부족" },
      ],
      desire_list: [
        { type: [8], content: "안정적인 일자리" },
        { type: [3], content: "아이 돌봄 지원" },
      ],
    },
  },
  {
    user_id: "U20250527",
    name: "윤지후",
    gender: "M",
    birth_date: "2003-12-10",
    phone_number: "010-4567-8901",
    address: { state: "대전광역시", city: "유성구", address1: "대학로 50" },
    vulnerabilities: {
      summary: "대학생으로, 학업과 아르바이트 병행으로 인한 스트레스 및 주거 불안정.",
      risk_list: [
        { type: [2], content: "월세 부담" },
        { type: [8], content: "학업과 알바 병행 스트레스" },
      ],
      desire_list: [
        { type: [9], content: "안정적인 주거 환경" },
        { type: [6], content: "학자금 대출 상담" },
      ],
    },
  },
  {
    user_id: "U20250528",
    name: "배서연",
    gender: "F",
    birth_date: "1980-06-20",
    phone_number: "010-5678-9012",
    address: { state: "울산광역시", city: "남구", address1: "삼산로 200" },
    vulnerabilities: {
      summary: "장애인 자녀를 둔 부모로, 자녀의 교육 및 치료 지원 필요.",
      risk_list: [{ type: [4], content: "장애 아동 지원 서비스 정보 부족" }],
      desire_list: [
        { type: [7], content: "자녀 특수 교육 지원" },
        { type: [2], content: "자녀 치료비 지원" },
      ],
    },
  },
  {
    user_id: "U20250529",
    name: "강태현",
    gender: "M",
    birth_date: "1955-04-12",
    phone_number: "010-6789-0123",
    address: { state: "세종특별자치시", city: "한누리대로", address1: "300" },
    vulnerabilities: {
      summary: "은퇴 후 소득 감소로 생활에 어려움을 느끼며, 사회적 관계 축소.",
      risk_list: [
        { type: [1], content: "은퇴 후 소득 감소" },
        { type: [5], content: "사회적 고립감" },
      ],
      desire_list: [
        { type: [8], content: "소일거리 또는 재취업 희망" },
        { type: [5], content: "노인 프로그램 참여" },
      ],
    },
  },
  {
    user_id: "U20250530",
    name: "신유나",
    gender: "F",
    birth_date: "1998-08-18",
    phone_number: "010-7890-1234",
    address: { state: "경기도", city: "고양시", address1: "호수로 700" },
    vulnerabilities: {
      summary: "취업 준비생으로, 반복되는 탈락에 자신감 저하 및 경제적 압박.",
      risk_list: [
        { type: [3], content: "취업 스트레스" },
        { type: [1], content: "생활비 부족" },
      ],
      desire_list: [
        { type: [8], content: "취업 성공" },
        { type: [10], content: "면접 컨설팅" },
      ],
    },
  },
  {
    user_id: "U20250531",
    name: "문서준",
    gender: "M",
    birth_date: "1972-01-30",
    phone_number: "010-8901-2345",
    address: { state: "충청북도", city: "청주시", address1: "상당로 10" },
    vulnerabilities: {
      summary: "자영업자로, 코로나19 이후 매출 급감으로 인한 부채 증가.",
      risk_list: [
        { type: [1], content: "부채 증가" },
        { type: [3], content: "매출 급감" },
      ],
      desire_list: [
        { type: [6], content: "소상공인 대출 지원" },
        { type: [8], content: "경영 컨설팅" },
      ],
    },
  },
  {
    user_id: "U20250601",
    name: "오지민",
    gender: "F",
    birth_date: "1963-07-25",
    phone_number: "010-9012-3456",
    address: { state: "전라북도", city: "전주시", address1: "기린대로 50" },
    vulnerabilities: {
      summary: "배우자와 사별 후 우울감 및 혼자 생활의 어려움 호소.",
      risk_list: [
        { type: [5], content: "사별 후 우울감" },
        { type: [2], content: "혼자 식사 해결 어려움" },
      ],
      desire_list: [
        { type: [5], content: "정서적 지원 프로그램" },
        { type: [3], content: "밑반찬 지원 서비스" },
      ],
    },
  },
  {
    user_id: "U20250602",
    name: "황하준",
    gender: "M",
    birth_date: "1988-10-03",
    phone_number: "010-0123-4567",
    address: { state: "경상남도", city: "창원시", address1: "중앙대로 30" },
    vulnerabilities: {
      summary: "최근 실직으로 인해 구직 활동 중이며, 가족 부양 부담.",
      risk_list: [
        { type: [3], content: "실직 상태" },
        { type: [1], content: "가족 부양 부담" },
      ],
      desire_list: [
        { type: [8], content: "재취업 지원" },
        { type: [6], content: "긴급 생계비 지원" },
      ],
    },
  },
  {
    user_id: "U20250603",
    name: "임채원",
    gender: "F",
    birth_date: "2000-05-15",
    phone_number: "010-1230-4567",
    address: { state: "강원도", city: "춘천시", address1: "금강로 20" },
    vulnerabilities: {
      summary: "사회초년생으로, 직장 내 적응 문제와 낮은 임금으로 생활고.",
      risk_list: [
        { type: [3], content: "직장 적응 어려움" },
        { type: [1], content: "낮은 임금" },
      ],
      desire_list: [
        { type: [8], content: "직무 능력 향상 교육" },
        { type: [6], content: "청년 주거 지원" },
      ],
    },
  },
  {
    user_id: "U20250604",
    name: "송지호",
    gender: "M",
    birth_date: "1992-09-22",
    phone_number: "010-2301-5678",
    address: { state: "제주특별자치도", city: "제주시", address1: "연삼로 100" },
    vulnerabilities: {
      summary: "귀농 청년으로, 농사 기술 부족 및 판로 개척에 어려움.",
      risk_list: [
        { type: [3], content: "농사 기술 부족" },
        { type: [1], content: "소득 불안정" },
      ],
      desire_list: [
        { type: [8], content: "농업 기술 교육" },
        { type: [6], content: "청년 창업농 지원" },
      ],
    },
  },
  {
    user_id: "U20250605",
    name: "유다은",
    gender: "F",
    birth_date: "1978-11-08",
    phone_number: "010-3012-6789",
    address: { state: "서울특별시", city: "마포구", address1: "월드컵북로 500" },
    vulnerabilities: {
      summary: "경력단절여성으로, 재취업에 대한 두려움과 정보 부족.",
      risk_list: [{ type: [3], content: "재취업 어려움" }],
      desire_list: [
        { type: [8], content: "여성 직업 훈련" },
        { type: [5], content: "자신감 회복 프로그램" },
      ],
    },
  },
  {
    user_id: "U20250606",
    name: "조현우",
    gender: "M",
    birth_date: "1960-03-17",
    phone_number: "010-0000-1111",
    address: { state: "부산광역시", city: "동래구", address1: "충렬대로 100" },
    vulnerabilities: {
      summary: "만성질환(당뇨) 관리 중이며, 병원비 부담과 식단 관리에 어려움.",
      risk_list: [
        { type: [6], content: "당뇨 합병증 우려" },
        { type: [1], content: "병원비 부담" },
      ],
      desire_list: [
        { type: [2], content: "건강 관리 교육" },
        { type: [3], content: "맞춤형 식단 지원" },
      ],
    },
  },
  {
    user_id: "U20250607",
    name: "백수민",
    gender: "F",
    birth_date: "1993-06-01",
    phone_number: "010-1111-0000",
    address: { state: "경기도", city: "성남시 분당구", address1: "황새울로 200" },
    vulnerabilities: {
      summary: "1인 가구 여성으로, 안전 문제에 대한 불안감과 방범 시설 부족.",
      risk_list: [{ type: [2], content: "주거 안전 불안" }],
      desire_list: [
        { type: [9], content: "방범 시설 지원" },
        { type: [5], content: "여성 안심 네트워크 참여" },
      ],
    },
  },
  {
    user_id: "U20250608",
    name: "서도윤",
    gender: "M",
    birth_date: "2005-02-10",
    phone_number: "010-2222-0000",
    address: { state: "인천광역시", city: "연수구", address1: "컨벤시아대로 150" },
    vulnerabilities: {
      summary: "학교 밖 청소년으로, 학업 중단 후 진로 탐색에 어려움.",
      risk_list: [{ type: [4], content: "학업 중단" }],
      desire_list: [
        { type: [7], content: "검정고시 지원" },
        { type: [8], content: "진로 상담" },
      ],
    },
  },
  {
    user_id: "U20250609",
    name: "나예은",
    gender: "F",
    birth_date: "1982-12-25",
    phone_number: "010-0202-3333",
    address: { state: "대구광역시", city: "달서구", address1: "성서로 400" },
    vulnerabilities: {
      summary: "다문화 가정 구성원으로, 언어 장벽과 문화 차이로 인한 소외감.",
      risk_list: [{ type: [5], content: "문화적 소외감" }],
      desire_list: [
        { type: [7], content: "한국어 교육 지원" },
        { type: [5], content: "다문화 교류 프로그램" },
      ],
    },
  },
]

export const mockVulnerableTableData: VulnerableTableItem[] = mockVulnerableIndividuals.map((v) => ({
  user_id: v.user_id,
  name: v.name,
  phone_number: v.phone_number,
  birth_date: v.birth_date,
  address_summary: `${v.address.state}, ${v.address.city}`,
  summary: v.vulnerabilities?.summary,
  riskCount: v.vulnerabilities?.risk_list.length || 0,
  desireCount: v.vulnerabilities?.desire_list.length || 0,
}))

export const mockQuestionSets: QuestionSet[] = [
  {
    id: "QS001",
    title: "기본 안부 확인 질문 세트",
    version: 1,
    flow: [
      { text: "안녕하세요, 잘 지내시죠?", expected_response: [{ text: "네" }] },
      { text: "식사는 하셨나요?", expected_response: [{ text: "네" }] }
    ]
  },
  {
    id: "QS002",
    title: "겨울철 난방비 지원 관련 질문",
    version: 2,
    flow: [
      { text: "최근 난방비 부담이 크신가요?", expected_response: [{ text: "네" }] }
    ]
  }
]

export const mockQuestionSetTableData: QuestionSetTableItem[] = mockQuestionSets.map(qs => ({
  questions_id: qs.id,
  title: qs.title,
  created_at: new Date().toLocaleDateString(),
  question_count: qs.flow.length
}))

export const mockCallLogs: CallLog[] = [
  {
    id: "call_001",
    account_id: "admin01",
    s_index: 1,
    v_id: "U20250521",
    q_id: "QS001",
    time: new Date(Date.now() - 3600000 * 2).toISOString(),
    runtime: 300,
    overall_script: "홍길동님과의 1회차 대화 내용...",
    summary: "홍길동님은 1회차 상담에서 경제적 어려움을 호소.",
    result: 2,
    fail_code: 0,
    need_human: 1,
    result_vulnerabilities: {
      risk_list: [{ risk_index_list: [1], content: "월세 체납" }],
      desire_list: [{ desire_index_list: [4], content: "구직 희망" }],
      risk_index_count: { "1": 1 },
      desire_index_count: { "4": 1 },
    },
  },
  {
    id: "call_002",
    account_id: "admin02",
    s_index: 1,
    v_id: "U20250522",
    q_id: "QS002",
    time: new Date(Date.now() - 3600000 * 5).toISOString(),
    runtime: 240,
    overall_script: "김영희님과의 1회차 대화 내용...",
    summary: "김영희님은 1회차 상담에서 건강 상태 양호.",
    result: 1,
    fail_code: 0,
    need_human: 0,
    result_vulnerabilities: { risk_list: [], desire_list: [], risk_index_count: {}, desire_index_count: {} },
  },
  {
    id: "call_003",
    account_id: "admin01",
    s_index: 1,
    v_id: "U20250523",
    q_id: "QS001",
    time: new Date(Date.now() - 3600000 * 8).toISOString(),
    runtime: 180,
    overall_script: "박철수님과의 1회차 대화 내용...",
    summary: "박철수님은 1회차 상담에서 외로움 호소.",
    result: 2,
    fail_code: 0,
    need_human: 2,
    result_vulnerabilities: {
      risk_list: [],
      desire_list: [{ desire_index_list: [5], content: "사회 활동 참여 희망" }],
      risk_index_count: {},
      desire_index_count: { "5": 1 },
    },
  },
  {
    id: "call_004",
    account_id: "admin01",
    s_index: 2,
    v_id: "U20250521",
    q_id: "QS001",
    time: new Date(Date.now() - 3600000 * 26).toISOString(),
    runtime: 320,
    overall_script: "홍길동님과의 2회차 대화 내용...",
    summary: "홍길동님 2회차, 여전히 구직 희망, 추가 지원 필요.",
    result: 2,
    fail_code: 0,
    need_human: 1,
    result_vulnerabilities: {
      risk_list: [
        { risk_index_list: [1], content: "월세 체납 지속" },
        { risk_index_list: [3], content: "구직 어려움" },
      ],
      desire_list: [{ desire_index_list: [4], content: "적극적 구직 지원 요청" }],
      risk_index_count: { "1": 1, "3": 1 },
      desire_index_count: { "4": 1 },
    },
  },
  {
    id: "call_005",
    account_id: "admin02",
    s_index: 2,
    v_id: "U20250522",
    q_id: "QS002",
    time: new Date(Date.now() - 3600000 * 28).toISOString(),
    runtime: 200,
    overall_script: "김영희님과의 2회차 대화 내용...",
    summary: "김영희님, 2회차 상담 시도했으나 의사소통 불가.",
    result: 0,
    fail_code: 3,
    need_human: 0,
    result_vulnerabilities: { risk_list: [], desire_list: [], risk_index_count: {}, desire_index_count: {} },
  },
  {
    id: "call_006",
    account_id: "admin01",
    s_index: 1,
    v_id: "U20250524",
    q_id: "QS001",
    time: new Date(Date.now() - 3600000 * 10).toISOString(),
    runtime: 220,
    overall_script: "이하나님과의 1회차 대화 내용...",
    summary: "이하나님 1회차, 이직 스트레스 및 적응 문제.",
    result: 0,
    fail_code: 3,
    need_human: 0,
    result_vulnerabilities: { risk_list: [], desire_list: [], risk_index_count: {}, desire_index_count: {} },
  },
  {
    id: "call_007",
    account_id: "admin01",
    s_index: 1,
    v_id: "U20250525",
    q_id: "QS001",
    time: new Date(Date.now() - 3600000 * 12).toISOString(),
    runtime: 280,
    overall_script: "최민준님과의 1회차 대화 내용...",
    summary: "최민준님, 난방비 부담과 건강 문제 호소.",
    result: 1,
    fail_code: 0,
    need_human: 1,
    result_vulnerabilities: {
      risk_list: [
        { risk_index_list: [7], content: "난방비 부담" },
        { risk_index_list: [6], content: "겨울철 건강 악화 우려" },
      ],
      desire_list: [{ desire_index_list: [1], content: "따뜻한 겨울나기 지원" }],
      risk_index_count: { "7": 1, "6": 1 },
      desire_index_count: { "1": 1 },
    },
  },
  {
    id: "call_008",
    account_id: "admin02",
    s_index: 1,
    v_id: "U20250526",
    q_id: "QS002",
    time: new Date(Date.now() - 3600000 * 15).toISOString(),
    runtime: 310,
    overall_script: "정수빈님과의 1회차 대화 내용...",
    summary: "정수빈님, 미혼모로 양육과 경제활동 병행 어려움.",
    result: 1,
    fail_code: 0,
    need_human: 2,
    result_vulnerabilities: {
      risk_list: [
        { risk_index_list: [3], content: "양육으로 인한 경력 단절" },
        { risk_index_list: [1], content: "생활비 부족" },
      ],
      desire_list: [
        { desire_index_list: [8], content: "안정적인 일자리" },
        { desire_index_list: [3], content: "아이 돌봄 지원" },
      ],
      risk_index_count: { "3": 1, "1": 1 },
      desire_index_count: { "8": 1, "3": 1 },
    },
  },
  {
    id: "call_009",
    account_id: "admin01",
    s_index: 1,
    v_id: "U20250527",
    q_id: "QS001",
    time: new Date(Date.now() - 3600000 * 18).toISOString(),
    runtime: 260,
    overall_script: "윤지후님과의 1회차 대화 내용...",
    summary: "윤지후님, 대학생으로 학업과 알바 병행 스트레스 및 주거 불안정.",
    result: 1,
    fail_code: 0,
    need_human: 0,
    result_vulnerabilities: {
      risk_list: [
        { risk_index_list: [2], content: "월세 부담" },
        { risk_index_list: [8], content: "학업과 알바 병행 스트레스" },
      ],
      desire_list: [
        { desire_index_list: [9], content: "안정적인 주거 환경" },
        { desire_index_list: [6], content: "학자금 대출 상담" },
      ],
      risk_index_count: { "2": 1, "8": 1 },
      desire_index_count: { "9": 1, "6": 1 },
    },
  },
  {
    id: "call_010",
    account_id: "admin02",
    s_index: 1,
    v_id: "U20250528",
    q_id: "QS002",
    time: new Date(Date.now() - 3600000 * 20).toISOString(),
    runtime: 290,
    overall_script: "배서연님과의 1회차 대화 내용...",
    summary: "배서연님, 장애인 자녀 교육 및 치료 지원 필요.",
    result: 1,
    fail_code: 0,
    need_human: 1,
    result_vulnerabilities: {
      risk_list: [{ risk_index_list: [4], content: "장애 아동 지원 서비스 정보 부족" }],
      desire_list: [
        { desire_index_list: [7], content: "자녀 특수 교육 지원" },
        { desire_index_list: [2], content: "자녀 치료비 지원" },
      ],
      risk_index_count: { "4": 1 },
      desire_index_count: { "7": 1, "2": 1 },
    },
  },
  {
    id: "call_011",
    account_id: "admin01",
    s_index: 1,
    v_id: "U20250529",
    q_id: "QS001",
    time: new Date(Date.now() - 3600000 * 22).toISOString(),
    runtime: 270,
    overall_script: "강태현님과의 1회차 대화 내용...",
    summary: "강태현님, 은퇴 후 소득 감소 및 사회적 관계 축소.",
    result: 1,
    fail_code: 0,
    need_human: 1,
    result_vulnerabilities: {
      risk_list: [
        { risk_index_list: [1], content: "은퇴 후 소득 감소" },
        { risk_index_list: [5], content: "사회적 고립감" },
      ],
      desire_list: [
        { desire_index_list: [8], content: "소일거리 또는 재취업 희망" },
        { desire_index_list: [5], content: "노인 프로그램 참여" },
      ],
      risk_index_count: { "1": 1, "5": 1 },
      desire_index_count: { "8": 1, "5": 1 },
    },
  },
]

export const mockCallHistoryTableData: CallHistoryTableItem[] = mockCallLogs.map((log) => {
  const vulnerable = mockVulnerableIndividuals.find((v) => v.user_id === log.v_id)
  const questionSet = mockQuestionSets.find((q) => q.id === log.q_id)
  let resultText = "정보 없음"
  if (log.result === 0) resultText = "상담 불가"
  else if (log.result === 1) resultText = "상담 양호"
  else if (log.result === 2) resultText = "심층 상담 필요"

  const summary = log.summary || "요약 없음"
  const totalRiskCount = Object.values((log.result_vulnerabilities || {risk_index_count: {}}).risk_index_count).reduce((a, b) => a + b, 0)
  const totalDesireCount = Object.values((log.result_vulnerabilities || {desire_index_count: {}}).desire_index_count).reduce((a, b) => a + b, 0)

  return {
    id: log.id,
    v_name: vulnerable?.name || "알 수 없음",
    q_title: questionSet?.title || "알 수 없음",
    start_time: new Date(log.time).toLocaleString(),
    result: resultText,
    riskCount: totalRiskCount,
    desireCount: totalDesireCount,
    s_index: log.s_index,
  }
})

export const mockConsultationQueue: ConsultationQueueItem[] = []
