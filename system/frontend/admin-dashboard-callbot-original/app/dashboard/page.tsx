"use client"

import { CardFooter, CardDescription as UICardDescription } from "@/components/ui/card" // Renaming to avoid conflict
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users, PhoneCall } from "lucide-react"
import Link from "next/link"
import SimpleBarChart from "@/components/simple-bar-chart"
import { mockCallLogs } from "@/lib/mock-data"
import type { CallLog, Stats } from "@/types"
import { getRiskTypeLabel, getDesireTypeLabel } from "@/lib/consultation-types"
import { PieChartIcon } from "lucide-react"

const calculateDashboardStats = (logs: CallLog[]): Stats => {
  if (logs.length === 0) {
    return {
      totalConsultations: 0,
      successfulConsultations: 0,
      successRate: 0,
      byResult: { notPossible: 0, noActionNeeded: 0, deepDiveNeeded: 0 },
      byNeedHuman: { none: 0, requested: 0, critical: 0 },
      averageRuntime: 0,
      aggregatedRiskCounts: {},
      aggregatedDesireCounts: {},
    }
  }
  const totalConsultations = logs.length
  const byResult = {
    notPossible: logs.filter((log) => log.result === 0).length,
    noActionNeeded: logs.filter((log) => log.result === 1).length,
    deepDiveNeeded: logs.filter((log) => log.result === 2).length,
  }
  const successfulConsultations = byResult.noActionNeeded + byResult.deepDiveNeeded
  const successRate = totalConsultations > 0 ? (successfulConsultations / totalConsultations) * 100 : 0

  const aggregatedRiskCounts: Record<string, number> = {}
  const aggregatedDesireCounts: Record<string, number> = {}

  logs.forEach((log) => {
    if (log.result_vulnerabilities) {
      Object.entries(log.result_vulnerabilities.risk_index_count || {}).forEach(([index, count]) => {
        aggregatedRiskCounts[index] = (aggregatedRiskCounts[index] || 0) + count
      })
      Object.entries(log.result_vulnerabilities.desire_index_count || {}).forEach(([index, count]) => {
        aggregatedDesireCounts[index] = (aggregatedDesireCounts[index] || 0) + count
      })
    }
  })

  return {
    totalConsultations,
    successfulConsultations,
    successRate,
    byResult,
    byNeedHuman: { none: 0, requested: 0, critical: 0 },
    averageRuntime: 0,
    aggregatedRiskCounts,
    aggregatedDesireCounts,
  }
}

export default function DashboardPage() {
  const monthlyStats = calculateDashboardStats(mockCallLogs)

  const summaryCards = [
    {
      title: "총 취약 계층",
      value: "1,234",
      icon: Users,
      href: "/dashboard/vulnerable",
      description: "관리 중인 인원 수",
    },
    {
      title: "금일 상담 건수",
      value: "56",
      icon: PhoneCall,
      href: "/dashboard/history",
      description: "오늘 진행된 상담",
    },
    {
      title: "총 상담 건수 (전체)",
      value: monthlyStats.totalConsultations.toString(),
      icon: PieChartIcon,
      href: "/dashboard/statistics",
      description: "누적된 전체 상담 수",
    },
  ]

  const consultationResultData = [
    { label: "심층 상담 필요", value: monthlyStats.byResult.deepDiveNeeded, color: "bg-yellow-500" },
    { label: "상담 불필요", value: monthlyStats.byResult.noActionNeeded, color: "bg-green-500" },
    { label: "상담 실패", value: monthlyStats.byResult.notPossible, color: "bg-red-500" },
  ]

  const riskTypeData = Object.entries(monthlyStats.aggregatedRiskCounts)
    .map(([index, value]) => ({
      label: getRiskTypeLabel(Number(index)) || `위기 ${index}`,
      value,
      color: "bg-rose-500",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const desireTypeData = Object.entries(monthlyStats.aggregatedDesireCounts)
    .map(([index, value]) => ({
      label: getDesireTypeLabel(Number(index)) || `욕구 ${index}`,
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
      {/* Disclaimer text removed */}
    </div>
  )
}
