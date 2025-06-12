"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription as UICardDescription } from "@/components/ui/card"
import { Users, PhoneCall, PieChartIcon, AlertCircle } from "lucide-react"
import SimpleBarChart from "@/components/simple-bar-chart"
import { getDashboardSummary } from "@/lib/api"
import { getRiskTypeLabel, getDesireTypeLabel } from "@/lib/consultation-types"

// 스켈레톤 UI 컴포넌트
const SkeletonCard = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 bg-muted rounded w-2/3" />
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-full" />
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const summaryData = await getDashboardSummary()
        setData(summaryData)
      } catch (err: any) {
        setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">데이터를 불러오는 중입니다...</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>주요 상담 통계</CardTitle>
          </CardHeader>
          <CardContent className="h-48 bg-muted rounded-md" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">오류 발생</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Link href="/login" className="mt-6 text-sm text-primary hover:underline">
          로그인 페이지로 돌아가기
        </Link>
      </div>
    )
  }

  const summaryCards = [
    {
      title: "총 취약 계층",
      value: data?.totalVulnerables?.toLocaleString() || "0",
      icon: Users,
      href: "/dashboard/vulnerable",
      description: "관리 중인 전체 인원",
    },
    {
      title: "오늘 상담 건수",
      value: data?.todayConsultations?.toLocaleString() || "0",
      icon: PhoneCall,
      href: "/dashboard/history",
      description: "오늘 완료된 상담 건수",
    },
    {
      title: "누적 상담 건수",
      value: data?.totalConsultations?.toLocaleString() || "0",
      icon: PieChartIcon,
      href: "/dashboard/statistics",
      description: "시스템 전체 누적 상담",
    },
  ]

  const consultationResultData = data?.consultationResultStats ? [
    { label: "심층 상담 필요", value: data.consultationResultStats.deepDiveNeeded, color: "bg-yellow-500" },
    { label: "상담 불필요", value: data.consultationResultStats.noActionNeeded, color: "bg-green-500" },
    { label: "상담 실패", value: data.consultationResultStats.notPossible, color: "bg-red-500" },
  ] : []

  const riskTypeData = data?.topRiskTypes ? Object.entries(data.topRiskTypes)
    .map(([index, value]) => ({
      label: getRiskTypeLabel(Number(index)) || `위기 ${index}`,
      value: value as number,
      color: "bg-rose-500",
    })) : []

  const desireTypeData = data?.topDesireTypes ? Object.entries(data.topDesireTypes)
    .map(([index, value]) => ({
      label: getDesireTypeLabel(Number(index)) || `욕구 ${index}`,
      value: value as number,
      color: "bg-sky-500",
    })) : []


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
    </div>
  )
}
