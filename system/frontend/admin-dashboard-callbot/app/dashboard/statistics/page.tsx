"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getStatistics } from "@/lib/api"
import type { Stats } from "@/types"
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
  Loader2,
} from "lucide-react"
import SimpleBarChart from "@/components/simple-bar-chart"
import { getRiskTypeLabel, getDesireTypeLabel } from "@/lib/consultation-types"
import { useToast } from "@/components/ui/use-toast"

const StatCard = ({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: string | number
  icon?: React.ElementType
  description?: string
}) => {
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
                    ? "warning"
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
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [availableRounds, setAvailableRounds] = React.useState<{ id: number; alias: string }[]>([])
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getStatistics(selectedRound)
        setStats(data)
        if (data.availableRounds && availableRounds.length === 0) {
          setAvailableRounds(data.availableRounds)
        }
      } catch (err: any) {
        setError("통계 데이터를 불러오는 중 오류가 발생했습니다.")
        toast({
          title: "오류 발생",
          description: err.message || "통계 데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [selectedRound, toast, availableRounds.length])

  const consultationResultItems: DistributionBarItem[] = [
    {
      label: "상담 불가",
      value: stats?.byResult?.notPossible || 0,
      color: "bg-red-500",
      icon: XCircle,
    },
    {
      label: "상담 양호 (조치 불필요)",
      value: stats?.byResult?.noActionNeeded || 0,
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    {
      label: "심층 상담 필요",
      value: stats?.byResult?.deepDiveNeeded || 0,
      color: "bg-yellow-500",
      icon: AlertTriangle,
    },
  ]
  const maxConsultationResultValue = Math.max(...consultationResultItems.map((item) => item.value), 1)

  const needHumanItems: DistributionBarItem[] = [
    {
      label: "인적 지원 불필요",
      value: stats?.byNeedHuman?.none || 0,
      color: "bg-gray-400",
      icon: UserCheck,
    },
    {
      label: "대상자 상담 요청",
      value: stats?.byNeedHuman?.requested || 0,
      color: "bg-orange-400",
      icon: UserX,
    },
    {
      label: "중대 취약 정보 발견",
      value: stats?.byNeedHuman?.critical || 0,
      color: "bg-red-600",
      icon: MessageSquareWarning,
    },
  ]
  const maxNeedHumanValue = Math.max(...needHumanItems.map((item) => item.value), 1)

  const riskTypeData = Object.entries(stats?.aggregatedRiskCounts || {})
    .map(([index, value]) => ({
      label: getRiskTypeLabel(Number(index)) || `위기유형 ${index}`,
      value: value as number,
      color: "bg-rose-500",
    }))
    .sort((a, b) => b.value - a.value)

  const desireTypeData = Object.entries(stats?.aggregatedDesireCounts || {})
    .map(([index, value]) => ({
      label: getDesireTypeLabel(Number(index)) || `욕구유형 ${index}`,
      value: value as number,
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
          <Select value={selectedRound} onValueChange={setSelectedRound} disabled={isLoading}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="상담 회차 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 회차 통계</SelectItem>
              {availableRounds.map((round) => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  {round.alias}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="ml-2">통계 데이터를 불러오는 중입니다...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold text-destructive">오류 발생</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="총 상담 건수"
              value={stats.totalConsultations}
              icon={Users}
              description="선택된 회차의 전체 상담 시도"
            />
            <StatCard
              title="상담 성공 건수"
              value={stats.successfulConsultations}
              icon={CheckCircle}
              description="상담이 정상적으로 완료된 건수"
            />
            <StatCard
              title="평균 상담 시간"
              value={`${Math.round(stats.averageRuntime / 1000)}초`}
              icon={Clock}
              description="완료된 상담의 평균 소요 시간"
            />
            <StatCard
              title="상담 성공률"
              value={`${stats.successRate.toFixed(1)}%`}
              icon={TrendingUp}
              description="전체 시도 대비 성공 비율"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>상담 결과 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributionBar items={consultationResultItems} maxValue={maxConsultationResultValue} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>인적 개입 필요성 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributionBar items={needHumanItems} maxValue={maxNeedHumanValue} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>주요 위기 및 욕구 정보 통계</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <SimpleBarChart title="주요 위기 유형 (상위 5개)" data={riskTypeData.slice(0, 5)} />
              <SimpleBarChart title="주요 욕구 유형 (상위 5개)" data={desireTypeData.slice(0, 5)} />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>표시할 통계 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
