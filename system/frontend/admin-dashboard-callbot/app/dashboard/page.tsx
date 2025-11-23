"use client"

import React, { useEffect, useState, useMemo } from "react"
import { CardFooter, CardDescription as UICardDescription } from "@/components/ui/card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users, PhoneCall, PieChartIcon } from "lucide-react"
import Link from "next/link"
import SimpleBarChart from "@/components/simple-bar-chart"
import { fetchFromApi } from "@/lib/api"
import type { CallLog } from "@/types"
import { getRiskTypeLabel, getDesireTypeLabel } from "@/lib/consultation-types"

interface DashboardAggregates {
  todayConsultationCount: number
  totalConsultationCount: number
  consultationResultRatio: Record<string, number>
  topCrisisTypes: Record<string, number>
  topDesireTypes: Record<string, number>
}

const mapResultCodeToLabel = (result: number): string => {
  switch (result) {
    case 0:
      return "상담 불가"
    case 1:
      return "상담 양호"
    case 2:
      return "심층 상담 필요"
    default:
      return "기타"
  }
}

const calculateAggregatesFromLogs = (logs: CallLog[]): DashboardAggregates => {
  const today = new Date()
  const todayConsultationCount = logs.filter((log) => {
    const t = new Date(log.time)
    return (
      t.getFullYear() === today.getFullYear() &&
      t.getMonth() === today.getMonth() &&
      t.getDate() === today.getDate()
    )
  }).length

  const totalConsultationCount = logs.length

  const consultationResultRatio: Record<string, number> = {}

  const topCrisisTypes: Record<string, number> = {}
  const topDesireTypes: Record<string, number> = {}

  logs.forEach((log) => {
    const label = mapResultCodeToLabel(log.result)
    consultationResultRatio[label] = (consultationResultRatio[label] || 0) + 1

    const v = log.result_vulnerabilities
    if (v) {
      Object.entries(v.risk_index_count || {}).forEach(([idx, count]) => {
        topCrisisTypes[idx] = (topCrisisTypes[idx] || 0) + count
      })
      Object.entries(v.desire_index_count || {}).forEach(([idx, count]) => {
        topDesireTypes[idx] = (topDesireTypes[idx] || 0) + count
      })
    }
  })

  return {
    todayConsultationCount,
    totalConsultationCount,
    consultationResultRatio,
    topCrisisTypes,
    topDesireTypes,
  }
}

const mapDetailToCallLog = (res: any): CallLog => ({
  id: res.id,
  account_id: res.account_id ?? res.accountId ?? "",
  s_index: res.s_index ?? res.sIndex ?? 0,
  v_id: res.v_id ?? res.vulnerableId ?? "",
  q_id: res.q_id ?? res.questionSetId ?? "",
  time: res.time,
  runtime: res.runtime ?? 0,
  overall_script: res.overall_script ?? res.overallScript ?? "",
  summary: res.summary ?? "",
  result: res.result ?? 0,
  fail_code: res.fail_code ?? res.failCode ?? 0,
  need_human: res.need_human ?? res.needHuman ?? 0,
  result_vulnerabilities: {
    risk_list: res.result_vulnerabilities?.risk_list ?? res.resultVulnerabilities?.riskList ?? [],
    desire_list: res.result_vulnerabilities?.desire_list ?? res.resultVulnerabilities?.desireList ?? [],
    risk_index_count:
      res.result_vulnerabilities?.risk_index_count ?? res.resultVulnerabilities?.riskIndexCount ?? {},
    desire_index_count:
      res.result_vulnerabilities?.desire_index_count ?? res.resultVulnerabilities?.desireIndexCount ?? {},
  },
  delete_vulnerabilities: undefined,
  new_vulnerabilities: undefined,
})

export default function DashboardPage() {
  const [totalVulnerableCount, setTotalVulnerableCount] = useState(0)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const vulnerableList = await fetchFromApi("/vulnerable/list")
        setTotalVulnerableCount(Array.isArray(vulnerableList) ? vulnerableList.length : 0)

        const historyPage = await fetchFromApi("/call/history?page=0&size=100&sort=time,desc")
        const list: any[] = historyPage.content ?? []

        const detailResponses = await Promise.all(
          list.map((item) => fetchFromApi(`/call/history/${item.id}`))
        )

        const logs: CallLog[] = detailResponses.map(mapDetailToCallLog)
        setCallLogs(logs)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "데이터를 불러오는 데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    getDashboardData()
  }, [])

  const aggregates = useMemo(() => calculateAggregatesFromLogs(callLogs), [callLogs])

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (error) {
    return <div>오류: {error}</div>
  }

  const summaryCards = [
    {
      title: "총 취약 계층",
      value: totalVulnerableCount.toLocaleString(),
      icon: Users,
      href: "/dashboard/vulnerable",
      description: "관리 중인 인원 수",
    },
    {
      title: "금일 상담 건수",
      value: aggregates.todayConsultationCount.toLocaleString(),
      icon: PhoneCall,
      href: "/dashboard/history",
      description: "오늘 진행된 상담",
    },
    {
      title: "총 상담 건수 (전체)",
      value: aggregates.totalConsultationCount.toLocaleString(),
      icon: PieChartIcon,
      href: "/dashboard/statistics",
      description: "누적된 전체 상담 수",
    },
  ]

  const consultationResultData = Object.entries(aggregates.consultationResultRatio).map(
    ([label, value]) => ({
      label,
      value,
      color:
        label === "심층 상담 필요"
          ? "bg-yellow-500"
          : label === "상담 양호"
          ? "bg-green-500"
          : "bg-red-500",
    })
  )

  const riskTypeData = Object.entries(aggregates.topCrisisTypes)
    .map(([index, value]) => ({
      label: getRiskTypeLabel(Number(index)) || `위기 유형 ${index}`,
      value,
      color: "bg-rose-500",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const desireTypeData = Object.entries(aggregates.topDesireTypes)
    .map(([index, value]) => ({
      label: getDesireTypeLabel(Number(index)) || `욕구 유형 ${index}`,
      value,
      color: "bg-sky-500",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">시스템 개요 및 주요 지표를 확인합니다.</p>
      </header>

      {/* 상단 카드 3개 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
              <Link href={card.href} className="text-xs text-primary hover:underline mt-2 block">
                자세히 보기 &rarr;
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 주요 상담 통계 */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>주요 상담 통계 (전체 기간)</CardTitle>
          <UICardDescription>주요 상담 결과 및 발견된 취약/욕구 유형입니다.</UICardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-1">
            <SimpleBarChart title="상담 결과 비율" data={consultationResultData} barHeight="h-6" />
          </div>
          <div className="space-y-1">
            <SimpleBarChart title="주요 위기 유형 (상위 5개)" data={riskTypeData} barHeight="h-6" />
          </div>
          <div className="space-y-1">
            <SimpleBarChart title="주요 욕구 유형 (상위 5개)" data={desireTypeData} barHeight="h-6" />
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard/statistics" className="text-sm text-primary hover:underline">
            전체 통계 상세보기 &rarr;
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
