"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, Eye, ListFilter, FileDown, AlertTriangle, HeartHandshake } from "lucide-react"
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
import { fetchFromApi } from "@/lib/api"

const ITEMS_PER_PAGE = 10

const getResultBadgeVariant = (result: string) => {
  switch (result) {
    case "심층 상담 필요":
      return "destructive"
    case "상담 양호":
      return "default"
    case "상담 불가":
      return "secondary"
    default:
      return "outline"
  }
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [data, setData] = useState<CallHistoryTableItem[]>([])
  const [filters, setFilters] = useState<{ result: string[]; s_index: string }>({
    result: [],
    s_index: "all",
  })
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append("page", (currentPage - 1).toString())
      params.append("size", ITEMS_PER_PAGE.toString())
      params.append("sort", "time,desc")
      if (searchTerm) {
        params.append("searchTerm", searchTerm)
      }
      if (filters.s_index !== "all") {
        params.append("sIndex", filters.s_index)
      }

      const response = await fetchFromApi(`/call/history?${params.toString()}`)
      
      let filteredContent = response.content;
      if (filters.result.length > 0) {
        filteredContent = response.content.filter((item: CallHistoryTableItem) => filters.result.includes(item.result));
      }

      setData(filteredContent)
      setTotalPages(Math.ceil(filteredContent.length / ITEMS_PER_PAGE))
      if (currentPage > totalPages) setCurrentPage(1)

    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오는 데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleFilterChange = (type: "result", value: string, checked: boolean) => {
    setFilters((prev) => {
      const currentFilterValues = prev[type]
      const newFilterValues = checked
        ? [...currentFilterValues, value]
        : currentFilterValues.filter((v) => v !== value)
      return { ...prev, [type]: newFilterValues }
    })
    setCurrentPage(1)
  }

  const handleSRoundFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, s_index: value }))
    setCurrentPage(1)
  }

const openDetailModal = async (callId: string) => {
  try {
    const res = await fetchFromApi(`/call/history/${callId}`)

    const rv =
      res.result_vulnerabilities ??
      res.resultVulnerabilities ??
      {}

    const parsed: CallLog = {
      id: res.id ?? res._id ?? "",

      v_id: res.v_id ?? res.vulnerableId ?? res.vId ?? "",

      s_index: res.s_index ?? res.sIndex ?? 0,

      account_id: res.account_id ?? res.accountId ?? "",

      q_id: res.q_id ?? res.questionSetId ?? res.qId ?? "",

      time: res.time,
      runtime: res.runtime ?? 0,

      summary: res.summary ?? "",

      overall_script: res.overall_script ?? res.overallScript ?? "",

      result: res.result ?? 0,
      fail_code: res.fail_code ?? res.failCode ?? 0,
      need_human: res.need_human ?? res.needHuman ?? 0,

      result_vulnerabilities: {
        risk_list: rv.risk_list ?? rv.riskList ?? [],
        desire_list: rv.desire_list ?? rv.desireList ?? [],
        risk_index_count: rv.risk_index_count ?? rv.riskIndexCount ?? {},
        desire_index_count: rv.desire_index_count ?? rv.desireIndexCount ?? {},
      },
    }

    setSelectedCallLog(parsed)
  } catch (error) {
    console.error("상세 조회 실패:", error)
    alert("상세 정보를 불러오는 데 실패했습니다.")
  }
}

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistory();
  };

  const renderVulnerabilities = (vulnData?: CallLog["result_vulnerabilities"]) => {
  if (!vulnData) {
    return <p className="text-sm text-muted-foreground">정보 없음</p>
  }

  const riskList = Array.isArray(vulnData.risk_list) ? vulnData.risk_list : []
  const desireList = Array.isArray(vulnData.desire_list) ? vulnData.desire_list : []

  return (
    <div className="space-y-2 text-sm">
      {riskList.length > 0 && (
        <div>
          <h5 className="font-semibold">위기 정보:</h5>
          <ul className="list-disc list-inside pl-4">
            {riskList.map((r, i) => {
              const indices = Array.isArray(r.risk_index_list)
                ? r.risk_index_list
                : []
              return (
                <li key={`risk-${i}`}>
                  {r.content} (유형:{" "}
                  {indices
                    .map((idx) => getRiskTypeLabel(idx) || `알수없음 ${idx}`)
                    .join(", ")}
                  )
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {desireList.length > 0 && (
        <div>
          <h5 className="font-semibold">욕구 정보:</h5>
          <ul className="list-disc list-inside pl-4">
            {desireList.map((d, i) => {
              const indices = Array.isArray(d.desire_index_list)
                ? d.desire_index_list
                : []
              return (
                <li key={`desire-${i}`}>
                  {d.content} (유형:{" "}
                  {indices
                    .map((idx) => getDesireTypeLabel(idx) || `알수없음 ${idx}`)
                    .join(", ")}
                  )
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {riskList.length === 0 && desireList.length === 0 && (
        <p className="text-muted-foreground">감지된 정보 없음</p>
      )}
    </div>
  )
}

  
  const resultOptions = ["상담 불가", "상담 양호", "심층 상담 필요"]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">상담 결과 및 이력</h1>
        <p className="text-muted-foreground">지난 상담 내역을 조회하고 상세 내용을 확인합니다.</p>
      </header>

      <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="대상자명, 질문 제목 검색..."
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
              {/* This should be populated from backend data if available */}
              {[1, 2, 3, 4, 5].map((round) => (
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
                  onCheckedChange={(checked) => handleFilterChange("result", option, !!checked)}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => alert("구현 예정입니다.")}>
            <FileDown className="mr-2 h-4 w-4" /> CSV 내보내기
          </Button>
        </div>
      </form>

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
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="h-24 text-center">로딩 중...</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-red-500">{error}</TableCell></TableRow>
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.v_name}</TableCell>
                  <TableCell>{item.q_title}</TableCell>
                  <TableCell>{item.start_time}</TableCell>
                  <TableCell>{item.s_index}회차</TableCell>
                  <TableCell>
                    <Badge variant={getResultBadgeVariant(item.result)}>
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
                상담 상세 정보입니다. (회차: {selectedCallLog.s_index})
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="grid gap-4 py-4 text-sm">
                 {/* Simplified details for now, can be expanded based on final API response */}
                <div className="grid grid-cols-3 gap-2">
                  <strong>관리자 ID:</strong> <span className="col-span-2">{selectedCallLog.account_id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <strong>질문 세트 ID:</strong> <span className="col-span-2">{selectedCallLog.q_id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <strong>상담 시간:</strong> <span className="col-span-2">{new Date(selectedCallLog.time).toLocaleString()}</span>
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
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
