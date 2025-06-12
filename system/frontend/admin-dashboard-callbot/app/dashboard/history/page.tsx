"use client"

import * as React from "react"
import { Search, Eye, ListFilter, FileDown, AlertTriangle, HeartHandshake } from "lucide-react" // Added FileDown
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
// import { mockCallHistoryTableData, mockCallLogs, mockQuestionSets, mockVulnerableIndividuals } from "@/lib/mock-data"
import type { CallHistoryTableItem, CallLog } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getRiskTypeLabel, getDesireTypeLabel } from "@/lib/consultation-types"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getConsultations, getConsultationById } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const ITEMS_PER_PAGE = 10

export default function HistoryPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState<CallHistoryTableItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filters, setFilters] = React.useState<{ result: string[]; s_index: string }>({
    result: [],
    s_index: "all",
  })
  const [selectedCallLog, setSelectedCallLog] = React.useState<CallLog | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)

  const resultOptions = ["상담 불가", "상담 양호", "심층 상담 필요"]

  const filteredData = React.useMemo(() => {
    return data.filter((item: CallHistoryTableItem) => {
      const matchesSearch =
        item.v_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.q_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesResult = filters.result.length === 0 || filters.result.includes(item.result)
      const matchesSRound = filters.s_index === "all" || item.s_index === Number.parseInt(filters.s_index)

      return matchesSearch && matchesResult && matchesSRound
    })
  }, [data, searchTerm, filters])

  const uniqueSRounds = React.useMemo(() => {
    const rounds = new Set(filteredData.map((item: CallHistoryTableItem) => item.s_index))
    return Array.from(rounds).sort((a: number, b: number) => a - b)
  }, [filteredData])

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await getConsultations()
        setData(result.consultations || [])
      } catch (err: any) {
        setError(err.message || "상담 이력을 불러오는데 실패했습니다.")
        toast({ variant: "destructive", title: "오류", description: err.message })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, filteredData.length])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  const handleFilterChange = (type: "result", value: string, checked: boolean) => {
    setFilters((prev) => {
      const currentFilterValues = prev[type]
      if (checked) {
        return { ...prev, [type]: [...currentFilterValues, value] }
      } else {
        return { ...prev, [type]: currentFilterValues.filter((v) => v !== value) }
      }
    })
  }

  const handleSRoundFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, s_index: value }))
  }

  const openDetailModal = async (callId: string) => {
    try {
      const log = await getConsultationById(callId)
      setSelectedCallLog(log)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "오류",
        description: err.message || "상세 정보를 불러오지 못했습니다.",
      })
    }
  }

  const renderVulnerabilities = (vulnData?: CallLog["result_vulnerabilities"]) => {
    if (!vulnData) return <p className="text-sm text-muted-foreground">정보 없음</p>
    return (
      <div className="space-y-2 text-sm">
        {vulnData.risk_list.length > 0 && (
          <div>
            <h5 className="font-semibold">위기 정보:</h5>
            <ul className="list-disc list-inside pl-4">
              {vulnData.risk_list.map((r, i) => (
                <li key={`risk-${i}`}>
                  {r.content} (유형:{" "}
                  {r.risk_index_list.map((idx) => getRiskTypeLabel(idx) || `알수없음 ${idx}`).join(", ")})
                </li>
              ))}
            </ul>
          </div>
        )}
        {vulnData.desire_list.length > 0 && (
          <div>
            <h5 className="font-semibold">욕구 정보:</h5>
            <ul className="list-disc list-inside pl-4">
              {vulnData.desire_list.map((d, i) => (
                <li key={`desire-${i}`}>
                  {d.content} (유형:{" "}
                  {d.desire_index_list.map((idx) => getDesireTypeLabel(idx) || `알수없음 ${idx}`).join(", ")})
                </li>
              ))}
            </ul>
          </div>
        )}
        {vulnData.risk_list.length === 0 && vulnData.desire_list.length === 0 && (
          <p className="text-muted-foreground">감지된 정보 없음</p>
        )}
      </div>
    )
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">상담 결과 및 이력</h1>
        <p className="text-muted-foreground">지난 상담 내역을 조회하고 상세 내용을 확인합니다.</p>
      </header>

      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="대상자명, 질문 제목, ID 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center mt-2 md:mt-0">
          <Select value={filters.s_index} onValueChange={handleSRoundFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="상담 회차 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 회차</SelectItem>
              {uniqueSRounds.map((round) => (
                <SelectItem key={round} value={round.toString()}>
                  {round}회차
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ListFilter className="mr-2 h-4 w-4" /> 필터
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>상담 결과</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {resultOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={filters.result.includes(option)}
                  onCheckedChange={(checked) => handleFilterChange("result", option, Boolean(checked))}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => alert("CSV Export (구현 필요)")}>
            <FileDown className="mr-2 h-4 w-4" /> CSV 내보내기
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상담 ID</TableHead>
              <TableHead>대상자</TableHead>
              <TableHead>질문 세트</TableHead>
              <TableHead>상담 시간</TableHead>
              <TableHead>회차</TableHead>
              <TableHead>상담 결과</TableHead>
              <TableHead>위기</TableHead>
              <TableHead>욕구</TableHead>
              <TableHead className="w-[100px] text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTableData.length > 0 ? (
              currentTableData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.v_name}</TableCell>
                  <TableCell>{item.q_title}</TableCell>
                  <TableCell>{item.start_time}</TableCell>
                  <TableCell>{item.s_index}회차</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.result === "심층 상담 필요"
                          ? "destructive"
                          : item.result === "상담 불가"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {item.result}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.riskCount > 0 ? (
                      <Badge variant="destructive" className="whitespace-nowrap">
                        <AlertTriangle className="h-3 w-3 mr-1" /> {item.riskCount} 건
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">없음</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.desireCount > 0 ? (
                      <Badge variant="default" className="whitespace-nowrap bg-sky-500 hover:bg-sky-600">
                        <HeartHandshake className="h-3 w-3 mr-1" /> {item.desireCount} 건
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">없음</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetailModal(item.id)}>
                      <Eye className="mr-2 h-4 w-4" /> 상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(Math.max(currentPage - 1, 1))
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page)
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(Math.min(currentPage + 1, totalPages))
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {selectedCallLog && (
        <Dialog open={!!selectedCallLog} onOpenChange={(isOpen) => !isOpen && setSelectedCallLog(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>상담 상세 내역 (ID: {selectedCallLog.id})</DialogTitle>
              <DialogDescription>
                대상자 ID: {selectedCallLog.v_id} / 상담 회차: {selectedCallLog.s_index}회차
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <strong>관리자 ID:</strong> <span className="col-span-2">{selectedCallLog.account_id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <strong>질문 세트 ID:</strong>{" "}
                  <span className="col-span-2">
                    {selectedCallLog.q_id}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <strong>상담 시간:</strong>{" "}
                  <span className="col-span-2">{new Date(selectedCallLog.time).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <strong>소요 시간:</strong>{" "}
                  <span className="col-span-2">
                    {Math.floor(selectedCallLog.runtime / 60)}분 {selectedCallLog.runtime % 60}초
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <strong>상담 결과:</strong>{" "}
                  <span className="col-span-2">
                    <Badge
                      variant={
                        selectedCallLog.result === 2
                          ? "destructive"
                          : selectedCallLog.result === 0
                            ? "secondary"
                            : "default"
                      }
                    >
                      {selectedCallLog.result === 0
                        ? "상담 불가"
                        : selectedCallLog.result === 1
                          ? "상담 양호"
                          : "심층 상담 필요"}
                    </Badge>
                    {selectedCallLog.fail_code !== 0 && ` (실패 코드: ${selectedCallLog.fail_code})`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <strong>심층 상담 필요:</strong>{" "}
                  <span className="col-span-2">
                    <Badge
                      variant={
                        selectedCallLog.need_human === 2
                          ? "destructive"
                          : selectedCallLog.need_human === 1
                            ? "warning"
                            : "outline"
                      }
                    >
                      {selectedCallLog.need_human === 0
                        ? "아니오"
                        : selectedCallLog.need_human === 1
                          ? "상담 요청"
                          : "위험 감지"}
                    </Badge>
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold mt-3 mb-1">상담 요약:</h4>
                  <p className="p-2 bg-muted rounded-md">{selectedCallLog.summary}</p>
                </div>

                <div>
                  <h4 className="font-semibold mt-3 mb-1">전체 대화 스크립트:</h4>
                  <ScrollArea className="h-40 rounded-md border p-2 bg-muted">
                    {selectedCallLog.overall_script}
                  </ScrollArea>
                </div>

                <div>
                  <h4 className="font-semibold mt-3 mb-1">상담 결과 취약 정보:</h4>
                  {renderVulnerabilities(selectedCallLog.result_vulnerabilities)}
                </div>
                {selectedCallLog.new_vulnerabilities && (
                  <div>
                    <h4 className="font-semibold mt-3 mb-1">새롭게 추가된 취약 정보:</h4>
                    {renderVulnerabilities(selectedCallLog.new_vulnerabilities)}
                  </div>
                )}
                {selectedCallLog.delete_vulnerabilities && (
                  <div>
                    <h4 className="font-semibold mt-3 mb-1">삭제된 기존 취약 정보:</h4>
                    {renderVulnerabilities(selectedCallLog.delete_vulnerabilities)}
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
