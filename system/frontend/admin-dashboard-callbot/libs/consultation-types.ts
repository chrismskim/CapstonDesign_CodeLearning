export const RESPONSE_TYPE_CATEGORIES = {
  EXCEPTION: 0,
  RISK: 1,
  DESIRE: 2,
  DEEP_DIVE: 3,
} as const

// Ensure indices are 1-based as per user request
export const RISK_TYPES = [
  { index: 1, label: "요금체납" },
  { index: 2, label: "주거위기" },
  { index: 3, label: "고용위기" },
  { index: 4, label: "급여/서비스 탈락 및 미이용" },
  { index: 5, label: "긴급상황 위기" },
  { index: 6, label: "건강위기" },
  { index: 7, label: "에너지위기" },
  { index: 8, label: "기타" }, // "기타 위기" was used before, user specified "기타"
] as const

export const DESIRE_TYPES = [
  { index: 1, label: "안전" },
  { index: 2, label: "건강" },
  { index: 3, label: "일상생활유지" },
  { index: 4, label: "가족관계" },
  { index: 5, label: "사회적 관계" },
  { index: 6, label: "경제" },
  { index: 7, label: "교육" },
  { index: 8, label: "고용" },
  { index: 9, label: "생활환경" },
  { index: 10, label: "법률 및 권익보장" },
  { index: 11, label: "기타" }, // "기타 욕구" was used before, user specified "기타"
] as const

export const EXCEPTION_TYPES = [
  { index: 1, label: "신상정보불일치" },
  { index: 2, label: "상담거부" },
  { index: 3, label: "의사소통불가" },
  { index: 4, label: "부적절한답변" },
  { index: 5, label: "연결끊어짐" },
  { index: 6, label: "전화미수신" },
] as const

export const DEEP_DIVE_TYPES = [
  { index: 1, label: "심층상담을 원함" },
  { index: 2, label: "알아낸 취약 정보가 중대함" },
] as const

export type ResponseTypeItem = {
  response_type: (typeof RESPONSE_TYPE_CATEGORIES)[keyof typeof RESPONSE_TYPE_CATEGORIES]
  response_index: number
}

// Helper functions to get labels
export function getRiskTypeLabel(index: number): string | undefined {
  return RISK_TYPES.find((rt) => rt.index === index)?.label
}

export function getDesireTypeLabel(index: number): string | undefined {
  return DESIRE_TYPES.find((dt) => dt.index === index)?.label
}
