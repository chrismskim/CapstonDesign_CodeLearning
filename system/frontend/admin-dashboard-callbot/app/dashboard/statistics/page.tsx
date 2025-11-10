"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { mockCallLogs } from "@/lib/mock-data"
import type { CallLog, Stats } from "@/types"
import {
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  UserX,
  MessageSquareWarning,
} from "lucide-react"
import SimpleBarChart from "@/components/simple-bar-chart"
import { getRiskTypeLabel, getDesireTypeLabel } from "@/lib/consultation-types"

const calculateStats = (logs: CallLog[]): Stats => {
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
  const successfulConsultations = logs.filter((log) => log.result === 1 || log.result === 2).length
  const successRate = totalConsultations > 0 ? (successfulConsultations / totalConsultations) * 100 : 0

  const byResult = {
    notPossible: logs.filter((log) => log.result === 0).length,
    noActionNeeded: logs.filter((log) => log.result === 1).length,
    deepDiveNeeded: logs.filter((log) => log.result === 2).length,
  }

  const byNeedHuman = {
    none: logs.filter((log) => log.need_human === 0).length,
    requested: logs.filter((log) => log.need_human === 1).length,
    critical: logs.filter((log) => log.need_human === 2).length,
  }

  const totalRuntime = logs.reduce((sum, log) => sum + log.runtime, 0)
  const averageRuntime = totalConsultations > 0 ? totalRuntime / totalConsultations : 0

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
    byNeedHuman,
    averageRuntime,
    aggregatedRiskCounts,
    aggregatedDesireCounts,
  }
}

const StatCard = ({
  title,
  value,
  icon,
  description,
}: { title: string; value: string | number; icon?: React.ElementType; description?: string }) => {
  const IconComponent = icon
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

interface DistributionBarItem {
  label: string
  value: number
  color: string
  icon?: React.ElementType
  // barLabel: string; // Removed as per user request
}

const DistributionBar: React.FC<{ items: DistributionBarItem[]; maxValue: number }> = ({ items, maxValue }) => {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm flex items-center">
              {item.icon && <item.icon className={`w-4 h-4 mr-2 ${item.color.replace("bg-", "text-")}`} />}
              {item.label}
            </span>
            <Badge
              variant={
                item.value > 0 && (item.label === "심층 상담 필요" || item.label === "중대 취약 정보 발견")
                  ? "destructive"
                  : item.value > 0 && item.label === "대상자 상담 요청"
                    ? "outline" // "warning" -> "outline" 으로 변경 (Badge에서 허용되는 값)
                    : "secondary"
              }
            >
              {item.value} 건
            </Badge>
          </div>
          <div className="flex items-center">
            {/* Removed the barLabel span */}
            <div className="flex-1 bg-muted rounded-sm h-3 overflow-hidden">
              <div
                style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : "0%" }}
                className={`h-full ${item.color} transition-all duration-300 ease-out`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StatisticsPage() {
  const [selectedRound, setSelectedRound] = React.useState<string>("all")
  const [stats, setStats] = React.useState<Stats>(calculateStats(mockCallLogs))

  const uniqueRounds = React.useMemo(() => {
    const rounds = new Set(mockCallLogs.map((log) => log.s_index))
    return Array.from(rounds).sort((a, b) => a - b)
  }, [])

  React.useEffect(() => {
    const logsToProcess =
      selectedRound === "all"
        ? mockCallLogs
        : mockCallLogs.filter((log) => log.s_index === Number.parseInt(selectedRound))
    setStats(calculateStats(logsToProcess))
  }, [selectedRound])

  const consultationResultItems: DistributionBarItem[] = [
    {
      label: "상담 불가",
      value: stats.byResult.notPossible,
      color: "bg-red-500",
      icon: XCircle,
      // barLabel: "상담 불가", // Removed
    },
    {
      label: "상담 양호 (조치 불필요)",
      value: stats.byResult.noActionNeeded,
      color: "bg-green-500",
      icon: CheckCircle2,
      // barLabel: "상담 양호", // Removed
    },
    {
      label: "심층 상담 필요",
      value: stats.byResult.deepDiveNeeded,
      color: "bg-yellow-500",
      icon: AlertTriangle,
      // barLabel: "심층 필요", // Removed
    },
  ]
  const maxConsultationResultValue = Math.max(...consultationResultItems.map((item) => item.value), 1)

  const needHumanItems: DistributionBarItem[] = [
    {
      label: "인적 지원 불필요",
      value: stats.byNeedHuman.none,
      color: "bg-gray-400",
      icon: UserCheck,
      // barLabel: "지원 불필요", // Removed
    },
    {
      label: "대상자 상담 요청",
      value: stats.byNeedHuman.requested,
      color: "bg-orange-400",
      icon: UserX,
      // barLabel: "상담 요청", // Removed
    },
    {
      label: "중대 취약 정보 발견",
      value: stats.byNeedHuman.critical,
      color: "bg-red-600",
      icon: MessageSquareWarning,
      // barLabel: "중대 정보", // Removed
    },
  ]
  const maxNeedHumanValue = Math.max(...needHumanItems.map((item) => item.value), 1)

  const riskTypeData = Object.entries(stats.aggregatedRiskCounts)
    .map(([index, value]) => ({
      label: getRiskTypeLabel(Number(index)) || `위기유형 ${index}`,
      value,
      color: "bg-rose-500",
    }))
    .sort((a, b) => b.value - a.value)

  const desireTypeData = Object.entries(stats.aggregatedDesireCounts)
    .map(([index, value]) => ({
      label: getDesireTypeLabel(Number(index)) || `욕구유형 ${index}`,
      value,
      color: "bg-sky-500",
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상담 통계</h1>
          <p className="text-muted-foreground">상담 결과에 대한 통계 데이터를 확인합니다.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="상담 회차 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 회차 통계</SelectItem>
              {uniqueRounds.map((round) => (
                <SelectItem key={round} value={round.toString()}>
                  {round}회차 통계
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{selectedRound === "all" ? "전체 상담 요약" : `${selectedRound}회차 상담 요약`}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="총 상담 건수" value={stats.totalConsultations} icon={Users} />
          <StatCard
            title="상담 성공률"
            value={`${stats.successRate.toFixed(1)}%`}
            icon={CheckCircle}
            description="상담 양호 + 심층 상담 필요"
          />
          <StatCard
            title="평균 상담 시간"
            value={`${Math.round(stats.averageRuntime / 60)}분 ${Math.round(stats.averageRuntime % 60)}초`}
            icon={Clock}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">상담 결과 분포</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DistributionBar items={consultationResultItems} maxValue={maxConsultationResultValue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">심층 상담 사유별 분포</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DistributionBar items={needHumanItems} maxValue={maxNeedHumanValue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-rose-500" />
              주요 위기 유형 (전체)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={riskTypeData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-sky-500" />
              주요 욕구 유형 (전체)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={desireTypeData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
