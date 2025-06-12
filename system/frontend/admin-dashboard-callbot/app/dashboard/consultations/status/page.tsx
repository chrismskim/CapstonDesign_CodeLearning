"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Loader2, XCircle, RefreshCw, Clock } from "lucide-react"
import type { ConsultationQueueItem } from "@/types"
import { Button } from "@/components/ui/button"
import { getActiveQueue, getSseStreamUrl } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

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
      return <Clock className="h-4 w-4 text-muted-foreground" />
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
  const [isConnected, setIsConnected] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchInitialQueue = async () => {
    try {
      const initialQueue = await getActiveQueue()
      setQueue(initialQueue.calls || [])
    } catch (error) {
      console.error("Failed to fetch initial queue:", error)
      toast({
        variant: "destructive",
        title: "오류",
        description: "초기 대기열 정보를 가져오는데 실패했습니다.",
      })
    }
  }

  React.useEffect(() => {
    fetchInitialQueue()

    const sseUrl = getSseStreamUrl()
    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.addEventListener("call-update", (event) => {
      const updatedItem = JSON.parse(event.data)
      setQueue((prevQueue) => {
        const itemIndex = prevQueue.findIndex((item) => item.id === updatedItem.id)
        if (itemIndex !== -1) {
          // Update existing item
          const newQueue = [...prevQueue]
          newQueue[itemIndex] = updatedItem
          return newQueue
        } else {
          // Add new item
          return [...prevQueue, updatedItem]
        }
      })
    })

    eventSource.onerror = () => {
      setIsConnected(false)
      // Don't close here, EventSource will attempt to reconnect automatically.
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const totalConsultations = queue.length
  const completedConsultations = queue.filter((item) => item.status === "completed").length
  const failedConsultations = queue.filter((item) => item.status === "failed").length
  const inProgressConsultations = queue.filter((item) => item.status === "in-progress").length
  const waitingConsultations = queue.filter((item) => item.status === "waiting").length

  const overallProgress =
    totalConsultations > 0 ? ((completedConsultations + failedConsultations) / totalConsultations) * 100 : 0

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">상담 진행 현황</h1>
          <p className="text-muted-foreground">현재 진행 중인 상담 대기열 및 상태를 확인합니다.</p>
        </div>
        <Button variant="outline" onClick={fetchInitialQueue}>
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
