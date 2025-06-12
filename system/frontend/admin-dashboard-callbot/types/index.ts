export interface Account {
  id: string // User ID chosen by user
  email: string
  phoneNumber: string
  password_hash: string // In a real app, store a hash, not plain text
  status: "pending_approval" | "approved" | "rejected"
  is_root_admin?: boolean
  registered_at: string
}

export interface ExpectedResponse {
  text: string
  response_type_list?: {
    response_type: number
    response_index: number
  }[]
}

export interface QuestionFlowItem {
  text: string
  expected_response: ExpectedResponse[]
}

export interface QuestionSet {
  questions_id: string
  time: string
  title: string
  flow: QuestionFlowItem[]
}

export interface VulnerabilityDetail {
  type: number[]
  content: string
}

export interface Vulnerabilities {
  summary?: string
  risk_list: VulnerabilityDetail[]
  desire_list: VulnerabilityDetail[]
}

export interface VulnerableIndividual {
  user_id: string
  name: string
  gender: "M" | "F" | "O"
  birth_date: string
  phone_number: string
  address: {
    state: string
    city: string
    address1: string
    address2?: string
  }
  vulnerabilities?: Vulnerabilities
  last_consultation_id?: string
}

export interface CallResultVulnerabilities {
  risk_list: { risk_index_list: number[]; content: string }[]
  desire_list: { desire_index_list: number[]; content: string }[]
  risk_index_count: Record<string, number>
  desire_index_count: Record<string, number>
}

export interface CallLog {
  id: string
  account_id: string // This should match Account.id
  s_index: number
  v_id: string
  q_id: string
  time: string
  runtime: number
  overall_script: string
  summary: string
  result: 0 | 1 | 2
  fail_code: number
  need_human: 0 | 1 | 2
  result_vulnerabilities: CallResultVulnerabilities
  delete_vulnerabilities?: CallResultVulnerabilities
  new_vulnerabilities?: CallResultVulnerabilities
}

export interface VulnerableTableItem {
  user_id: string
  name: string
  phone_number: string
  birth_date: string
  address_summary: string
  summary?: string
  riskCount: number
  desireCount: number
}

export interface QuestionSetTableItem {
  questions_id: string
  title: string
  created_at: string
  question_count: number
}

export interface CallHistoryTableItem {
  id: string
  v_name: string
  q_title: string
  start_time: string
  result: string
  riskCount: number
  desireCount: number
  s_index: number
}

export interface ConsultationQueueItem {
  v_id: string
  v_name: string
  status: "waiting" | "in-progress" | "completed" | "failed"
  q_id: string
  q_title: string
  estimated_wait_time?: string
  current_step?: string
  error_message?: string
}

export interface Stats {
  totalConsultations: number
  successfulConsultations: number
  successRate: number
  byResult: {
    notPossible: number
    noActionNeeded: number
    deepDiveNeeded: number
  }
  byNeedHuman: {
    none: number
    requested: number
    critical: number
  }
  averageRuntime: number
  aggregatedRiskCounts: Record<string, number>
  aggregatedDesireCounts: Record<string, number>
  availableRounds: { id: number; alias: string }[]
}
