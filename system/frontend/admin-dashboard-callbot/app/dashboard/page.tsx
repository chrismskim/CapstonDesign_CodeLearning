"use client"

import React, { useEffect, useState } from "react"
import { CardFooter, CardDescription as UICardDescription } from "@/components/ui/card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users, PhoneCall, PieChartIcon } from "lucide-react"
import Link from "next/link"
import SimpleBarChart from "@/components/simple-bar-chart"
import { fetchFromApi } from "@/lib/api"

interface DashboardData {
  totalVulnerableCount: number
  todayConsultationCount: number
  totalConsultationCount: number
  consultationResultRatio: Record<string, number>
  topCrisisTypes: Record<string, number>
  topDesireTypes: Record<string, number>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        setLoading(true)
        const summaryData = await fetchFromApi("/dashboard/summary")
        setData(summaryData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는 데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }
    getDashboardData()
  }, [])

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (error || !data) {
    return <div>오류: {error || "데이터가 없습니다."}</div>
  }

  const summaryCards = [
    {
      title: "총 취약 계층",
      value: data.totalVulnerableCount.toLocaleString(),
      icon: Users,
      href: "/dashboard/vulnerable",
      description: "관리 중인 인원 수",
    },
    {
      title: "금일 상담 건수",
      value: data.todayConsultationCount.toLocaleString(),
      icon: PhoneCall,
      href: "/dashboard/history",
      description: "오늘 진행된 상담",
    },
    {
      title: "총 상담 건수 (전체)",
      value: data.totalConsultationCount.toLocaleString(),
      icon: PieChartIcon,
      href: "/dashboard/statistics",
      description: "누적된 전체 상담 수",
    },
  ]

  const consultationResultData = Object.entries(data.consultationResultRatio).map(([label, value]) => ({
    label,
    value,
    color: label === "심층 상담 필요" ? "bg-yellow-500" : label === "상담 불필요" ? "bg-green-500" : "bg-red-500",
  }))

  const riskTypeData = Object.entries(data.topCrisisTypes)
    .map(([label, value]) => ({
      label,
      value,
      color: "bg-rose-500",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const desireTypeData = Object.entries(data.topDesireTypes)
    .map(([label, value]) => ({
      label,
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
    </div>
  )
}
