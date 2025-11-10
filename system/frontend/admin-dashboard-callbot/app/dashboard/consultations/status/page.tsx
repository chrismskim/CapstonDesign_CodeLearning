"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Loader2, XCircle, RefreshCw } from "lucide-react"
import type { ConsultationQueueItem } from "@/types"
import { Button } from "@/components/ui/button"

// Helper to get badge variant based on status
const getStatusVariant = (status: ConsultationQueueItem["status"]) => {
  switch (status) {
    case "waiting":
      return "secondary"
    case "in-progress":
      return "default"
    case "completed":
      return "success" // Custom variant, or use 'default' and style
    case "failed":
      return "destructive"
    default:
      return "outline"
  }
}

// Helper to get icon based on status
const StatusIcon = ({ status }: { status: ConsultationQueueItem["status"] }) => {
  switch (status) {
    case "waiting":
      return <ClockIcon className="h-4 w-4 text-muted-foreground" />
    case "in-progress":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />
  }
}
// Placeholder ClockIcon if not available from lucide-react directly
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

export default function ConsultationStatusPage() {
  const [queue, setQueue] = React.useState<ConsultationQueueItem[]>([])
  const [overallProgress, setOverallProgress] = React.useState(0)

  const loadQueueFromStorage = () => {
    if (typeof window !== "undefined") {
      const storedQueue = localStorage.getItem("consultationQueue")
      if (storedQueue) {
        setQueue(JSON.parse(storedQueue))
      } else {
        setQueue([]) // Set to empty array if nothing is in localStorage
      }
    }
  }

  React.useEffect(() => {
    loadQueueFromStorage()

    // Simulate progress for demo purposes
    // In a real app, this would be driven by backend updates (e.g., WebSockets)
    if (queue.length > 0) {
      let completedCount = queue.filter((item) => item.status === "completed" || item.status === "failed").length
      const interval = setInterval(() => {
        setQueue((prevQueue) => {
          const newQueue = [...prevQueue]
          const waitingIndex = newQueue.findIndex((item) => item.status === "waiting")

          if (waitingIndex !== -1) {
            // Move one item from waiting to in-progress
            newQueue[waitingIndex].status = "in-progress"
            newQueue[waitingIndex].current_step = "상담 연결 중..."
          } else {
            const inProgressIndex = newQueue.findIndex((item) => item.status === "in-progress")
            if (inProgressIndex !== -1) {
              // Simulate completion or failure
              const isSuccess = Math.random() > 0.2 // 80% success rate for demo
              newQueue[inProgressIndex].status = isSuccess ? "completed" : "failed"
              newQueue[inProgressIndex].current_step = isSuccess ? "상담 완료" : "상담 실패"
              if (!isSuccess) newQueue[inProgressIndex].error_message = "연결 오류 발생"
              completedCount++
            } else {
              clearInterval(interval) // All done
            }
          }
          return newQueue
        })
        const progress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0
        setOverallProgress(progress)

        if (completedCount === queue.length) {
          clearInterval(interval)
        }
      }, 3000) // Update every 3 seconds

      return () => clearInterval(interval)
    } else {
      setOverallProgress(0)
    }
  }, [queue.length]) // Rerun effect if queue length changes (e.g. initial load)

  const totalConsultations = queue.length
  const completedConsultations = queue.filter((item) => item.status === "completed").length
  const failedConsultations = queue.filter((item) => item.status === "failed").length
  const inProgressConsultations = queue.filter((item) => item.status === "in-progress").length
  const waitingConsultations = queue.filter((item) => item.status === "waiting").length

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상담 진행 현황</h1>
          <p className="text-muted-foreground">현재 진행 중인 상담 대기열 및 상태를 확인합니다.</p>
        </div>
        <Button variant="outline" onClick={loadQueueFromStorage}>
          <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>전체 진행률</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            총 {totalConsultations}건 중 {completedConsultations + failedConsultations}건 처리 완료 (
            {Math.round(overallProgress)}%)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <p>대기: {waitingConsultations}건</p>
            <p>진행중: {inProgressConsultations}건</p>
            <p>성공: {completedConsultations}건</p>
            <p>실패: {failedConsultations}건</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상담 대기열</CardTitle>
          <CardDescription>
            {totalConsultations > 0 ? "개별 상담 진행 상태입니다." : "현재 진행중인 상담이 없습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalConsultations > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>대상자 ID</TableHead>
                  <TableHead>대상자명</TableHead>
                  <TableHead>질문 세트</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>진행 단계 / 비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.v_id}>
                    <TableCell>{item.v_id}</TableCell>
                    <TableCell>{item.v_name}</TableCell>
                    <TableCell>{item.q_title}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.status)} className="flex items-center gap-1 w-fit">
                        <StatusIcon status={item.status} />
                        {item.status === "waiting" && "대기중"}
                        {item.status === "in-progress" && "진행중"}
                        {item.status === "completed" && "완료"}
                        {item.status === "failed" && "실패"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.current_step || item.estimated_wait_time || "N/A"}
                      {item.status === "failed" && item.error_message && (
                        <p className="text-xs text-destructive mt-1">{item.error_message}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="mx-auto h-12 w-12 mb-4 text-green-500" />
              <p>모든 상담이 완료되었거나, 시작된 상담이 없습니다.</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => (window.location.href = "/dashboard/consultations")}
              >
                새 상담 시작하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
