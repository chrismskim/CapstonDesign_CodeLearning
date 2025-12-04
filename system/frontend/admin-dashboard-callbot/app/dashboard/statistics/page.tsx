"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { getRiskTypeLabel, getDesireTypeLabel } from "@/libs/consultation-types"
import { fetchFromApi } from "@/libs/api"

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

  const totalRuntime = logs.reduce((sum, log) => sum + (log.runtime ?? 0), 0)
  const averageRuntime = totalConsultations > 0 ? totalRuntime / totalConsultations : 0

  const aggregatedRiskCounts: Record<string, number> = {}
  const aggregatedDesireCounts: Record<string, number> = {}

  logs.forEach((log) => {
    const v = log.result_vulnerabilities
    if (v) {
      Object.entries(v.risk_index_count || {}).forEach(([index, count]) => {
        aggregatedRiskCounts[index] = (aggregatedRiskCounts[index] || 0) + count
      })
      Object.entries(v.desire_index_count || {}).forEach(([index, count]) => {
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
                  ? "outline"
                  : "secondary"
              }
            >
              {item.value} 건
            </Badge>
          </div>
          <div className="flex items-center">
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
  const [logs, setLogs] = React.useState<CallLog[]>([])
  const [stats, setStats] = React.useState<Stats>(() => calculateStats([]))
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // 상담 이력 전체 불러오기
  React.useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const listRes = await fetchFromApi("/call/history?page=0&size=1000&sort=time,desc")

        const list = (listRes.content ?? []) as { id: string }[]

        const detailPromises = list.map((item) =>
          fetchFromApi(`/call/history/${item.id}`)
        )

        const details = await Promise.all(detailPromises)

        const parsed: CallLog[] = details.map((res: any) => ({
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

          result_vulnerabilities: res.result_vulnerabilities
            ? {
                risk_list: res.result_vulnerabilities.risk_list ?? [],
                desire_list: res.result_vulnerabilities.desire_list ?? [],
                risk_index_count: res.result_vulnerabilities.risk_index_count ?? {},
                desire_index_count: res.result_vulnerabilities.desire_index_count ?? {},
              }
            : undefined,

          delete_vulnerabilities: res.delete_vulnerabilities
            ? {
                risk_list: res.delete_vulnerabilities.risk_list ?? [],
                desire_list: res.delete_vulnerabilities.desire_list ?? [],
                risk_index_count: res.delete_vulnerabilities.risk_index_count ?? {},
                desire_index_count: res.delete_vulnerabilities.desire_index_count ?? {},
              }
            : undefined,

          new_vulnerabilities: res.new_vulnerabilities
            ? {
                risk_list: res.new_vulnerabilities.risk_list ?? [],
                desire_list: res.new_vulnerabilities.desire_list ?? [],
                risk_index_count: res.new_vulnerabilities.risk_index_count ?? {},
                desire_index_count: res.new_vulnerabilities.desire_index_count ?? {},
              }
            : undefined,
        }))

        setLogs(parsed)
        setStats(calculateStats(parsed))
      } catch (e: any) {
        console.error("통계용 상담 이력 조회 실패:", e)
        setError(e?.message ?? "상담 이력 데이터를 불러오지 못했습니다.")
        setLogs([])
        setStats(calculateStats([]))
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [])

  React.useEffect(() => {
    const logsToProcess =
      selectedRound === "all"
        ? logs
        : logs.filter((log) => log.s_index === Number.parseInt(selectedRound))

    setStats(calculateStats(logsToProcess))
  }, [selectedRound, logs])

  const uniqueRounds = React.useMemo(() => {
    const rounds = new Set(logs.map((log) => log.s_index))
    return Array.from(rounds).sort((a, b) => a - b)
  }, [logs])

  const consultationResultItems: DistributionBarItem[] = [
    {
      label: "상담 불가",
      value: stats.byResult.notPossible,
      color: "bg-red-500",
      icon: XCircle,
    },
    {
      label: "상담 양호 (조치 불필요)",
      value: stats.byResult.noActionNeeded,
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    {
      label: "심층 상담 필요",
      value: stats.byResult.deepDiveNeeded,
      color: "bg-yellow-500",
      icon: AlertTriangle,
    },
  ]
  const maxConsultationResultValue = Math.max(...consultationResultItems.map((item) => item.value), 1)

  const needHumanItems: DistributionBarItem[] = [
    {
      label: "인적 지원 불필요",
      value: stats.byNeedHuman.none,
      color: "bg-gray-400",
      icon: UserCheck,
    },
    {
      label: "대상자 상담 요청",
      value: stats.byNeedHuman.requested,
      color: "bg-orange-400",
      icon: UserX,
    },
    {
      label: "중대 취약 정보 발견",
      value: stats.byNeedHuman.critical,
      color: "bg-red-600",
      icon: MessageSquareWarning,
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

      {isLoading && <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>}
      {error && <p className="text-sm text-red-500">에러: {error}</p>}

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
