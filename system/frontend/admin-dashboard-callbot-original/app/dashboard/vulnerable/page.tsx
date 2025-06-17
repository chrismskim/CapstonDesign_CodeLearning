"use client"

import * as React from "react"
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  FileDown,
  MoreHorizontal,
  AlertTriangle,
  HeartHandshake,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { mockVulnerableTableData, mockVulnerableIndividuals } from "@/lib/mock-data"
import type { VulnerableTableItem, VulnerableIndividual } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { getRiskTypeLabel, getDesireTypeLabel } from "@/lib/consultation-types"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const initialFormData: VulnerableIndividual = {
  user_id: "",
  name: "",
  gender: "M",
  birth_date: "",
  phone_number: "",
  address: { state: "", city: "", address1: "", address2: "" },
  vulnerabilities: { summary: "", risk_list: [], desire_list: [] },
}

const ITEMS_PER_PAGE = 10

export default function VulnerablePage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [data, setData] = React.useState<VulnerableTableItem[]>(mockVulnerableTableData)
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isReadOnlyView, setIsReadOnlyView] = React.useState(false)
  const [currentVulnerable, setCurrentVulnerable] = React.useState<VulnerableIndividual | null>(null)
  const [formData, setFormData] = React.useState<VulnerableIndividual>(initialFormData)
  const [currentPage, setCurrentPage] = React.useState(1)

  const filteredData = React.useMemo(() => {
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone_number.includes(searchTerm) ||
        item.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [data, searchTerm])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filteredData.length])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredData.map((item) => item.user_id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems)
    if (checked) {
      newSelectedItems.add(itemId)
    } else {
      newSelectedItems.delete(itemId)
    }
    setSelectedItems(newSelectedItems)
  }

  const openModal = (userId: string | null, readOnly: boolean) => {
    setIsReadOnlyView(readOnly)
    if (userId) {
      const vulnerableToViewOrEdit = mockVulnerableIndividuals.find((v) => v.user_id === userId)
      if (vulnerableToViewOrEdit) {
        setCurrentVulnerable(vulnerableToViewOrEdit)
        setFormData({
          ...vulnerableToViewOrEdit,
          vulnerabilities: vulnerableToViewOrEdit.vulnerabilities || { summary: "", risk_list: [], desire_list: [] },
        })
      }
    } else {
      setCurrentVulnerable(null)
      setFormData({
        ...initialFormData,
        vulnerabilities: { summary: "", risk_list: [], desire_list: [] },
      })
    }
    setIsModalOpen(true)
  }

  const handleDelete = (userIds: string[]) => {
    setData((prevData) => prevData.filter((item) => !userIds.includes(item.user_id)))
    setSelectedItems((prevSelected) => {
      const newSelected = new Set(prevSelected)
      userIds.forEach((id) => newSelected.delete(id))
      return newSelected
    })
    alert(`${userIds.join(", ")} 삭제 처리 (실제 삭제는 백엔드 구현 필요)`)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isReadOnlyView) return
    const { name, value } = e.target
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }))
    } else if (name === "vulnerabilities.summary") {
      setFormData((prev) => ({
        ...prev,
        vulnerabilities: { ...(prev.vulnerabilities || { risk_list: [], desire_list: [] }), summary: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnlyView) {
      setIsModalOpen(false)
      return
    }

    if (currentVulnerable) {
      setData((prevData) =>
        prevData.map((item) =>
          item.user_id === formData.user_id
            ? {
                ...item,
                name: formData.name,
                phone_number: formData.phone_number,
                birth_date: formData.birth_date,
                address_summary: `${formData.address.state}, ${formData.address.city}`,
                summary: formData.vulnerabilities?.summary,
                riskCount: formData.vulnerabilities?.risk_list.length || 0,
                desireCount: formData.vulnerabilities?.desire_list.length || 0,
              }
            : item,
        ),
      )
      const indexToUpdate = mockVulnerableIndividuals.findIndex((v) => v.user_id === formData.user_id)
      if (indexToUpdate !== -1) {
        mockVulnerableIndividuals[indexToUpdate] = { ...formData }
      }
      alert(`${formData.name} 정보 수정 (실제 수정은 백엔드 구현 필요)`)
    } else {
      const newId = `U${Date.now()}`
      const newVulnerableFull: VulnerableIndividual = {
        ...formData,
        user_id: newId,
        vulnerabilities: { summary: "", risk_list: [], desire_list: [] },
      }
      const newVulnerableTableItem: VulnerableTableItem = {
        user_id: newId,
        name: formData.name,
        phone_number: formData.phone_number,
        birth_date: formData.birth_date,
        address_summary: `${formData.address.state}, ${formData.address.city}`,
        summary: "",
        riskCount: 0,
        desireCount: 0,
      }
      setData((prevData) => [newVulnerableTableItem, ...prevData])
      mockVulnerableIndividuals.push(newVulnerableFull)
      alert(`${formData.name} 등록 (실제 등록은 백엔드 구현 필요)`)
    }
    setIsModalOpen(false)
  }

  const renderVulnerabilityTypes = (types: number[], typeGetter: (index: number) => string | undefined) => {
    return types.map((t) => typeGetter(t) || `알 수 없는 유형 ${t}`).join(", ")
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">취약 계층 관리</h1>
          <p className="text-muted-foreground">취약 계층 정보를 조회, 등록, 수정, 삭제합니다.</p>
        </header>

        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="이름, 전화번호, ID, 요약 검색..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => alert("CSV Export (구현 필요)")}>
              <FileDown className="mr-2 h-4 w-4" /> CSV 내보내기
            </Button>
            <Button onClick={() => openModal(null, false)}>
              <PlusCircle className="mr-2 h-4 w-4" /> 신규 등록
            </Button>
          </div>
        </div>

        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2 rounded-md border bg-card p-3">
            <p className="text-sm font-medium">{selectedItems.size}개 선택됨</p>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(Array.from(selectedItems))}>
              <Trash2 className="mr-2 h-4 w-4" /> 선택 삭제
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedItems.size > 0 && selectedItems.size === filteredData.length && filteredData.length > 0
                    }
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    disabled={filteredData.length === 0}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>생년월일</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>주소</TableHead>
                <TableHead className="min-w-[200px] max-w-xs">상담 요약</TableHead>
                <TableHead>위기</TableHead>
                <TableHead>욕구</TableHead>
                <TableHead className="w-[100px] text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTableData.length > 0 ? (
                currentTableData.map((item) => (
                  <TableRow key={item.user_id} data-state={selectedItems.has(item.user_id) ? "selected" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.user_id)}
                        onCheckedChange={(checked) => handleSelectItem(item.user_id, Boolean(checked))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.user_id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.birth_date}</TableCell>
                    <TableCell>{item.phone_number}</TableCell>
                    <TableCell>{item.address_summary}</TableCell>
                    <TableCell className="max-w-xs">
                      {item.summary ? (
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger className="truncate block w-full text-left hover:underline">
                            {item.summary}
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            align="start"
                            className="max-w-md bg-popover text-popover-foreground p-2 rounded shadow-lg text-sm"
                          >
                            {item.summary}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground italic">요약 없음</span>
                      )}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>작업</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openModal(item.user_id, true)}>
                            <Eye className="mr-2 h-4 w-4" /> 상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal(item.user_id, false)}>
                            <Edit className="mr-2 h-4 w-4" /> 수정
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete([item.user_id])}>
                            <Trash2 className="mr-2 h-4 w-4" /> 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-xl md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {currentVulnerable
                  ? isReadOnlyView
                    ? "취약 계층 상세 정보"
                    : "취약 계층 정보 수정"
                  : "신규 취약 계층 등록"}
              </DialogTitle>
              <DialogDescription>
                {currentVulnerable
                  ? `${currentVulnerable.name}님의 정보를 ${isReadOnlyView ? "확인합니다." : "수정합니다."}`
                  : "새로운 취약 계층 정보를 입력합니다."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
              {/* Form content remains the same */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="user_id">ID</Label>
                  <Input
                    id="user_id"
                    name="user_id"
                    value={formData.user_id}
                    readOnly={!!currentVulnerable}
                    className="mt-1 bg-muted/50"
                    placeholder={currentVulnerable ? "" : "자동 생성됩니다."}
                  />
                </div>
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    readOnly={isReadOnlyView}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">성별</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    disabled={isReadOnlyView}
                    className="mt-1 block w-full rounded-md border-input border bg-background p-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                    <option value="O">기타</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="birth_date">생년월일</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleFormChange}
                    required
                    readOnly={isReadOnlyView}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone_number">전화번호</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleFormChange}
                    required
                    readOnly={isReadOnlyView}
                    className="mt-1"
                  />
                </div>
              </div>

              <h3 className="font-medium pt-2 border-t mt-4">주소 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="address.state">시/도</Label>
                  <Input
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleFormChange}
                    required
                    readOnly={isReadOnlyView}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address.city">시/군/구</Label>
                  <Input
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleFormChange}
                    required
                    readOnly={isReadOnlyView}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address.address1">상세주소1</Label>
                  <Input
                    id="address.address1"
                    name="address.address1"
                    value={formData.address.address1}
                    onChange={handleFormChange}
                    required
                    readOnly={isReadOnlyView}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address.address2">상세주소2</Label>
                  <Input
                    id="address.address2"
                    name="address.address2"
                    value={formData.address.address2 || ""}
                    onChange={handleFormChange}
                    readOnly={isReadOnlyView}
                    className="mt-1"
                  />
                </div>
              </div>

              {currentVulnerable && (
                <>
                  <h3 className="font-medium pt-2 border-t mt-4">취약 정보</h3>
                  <div>
                    <Label htmlFor="vulnerabilities.summary">상담 요약</Label>
                    <textarea
                      id="vulnerabilities.summary"
                      name="vulnerabilities.summary"
                      value={formData.vulnerabilities?.summary || ""}
                      onChange={handleFormChange}
                      readOnly={isReadOnlyView}
                      className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="상담 요약 정보를 입력하거나, 자동 업데이트된 내용을 확인합니다."
                    />
                  </div>

                  {formData.vulnerabilities && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <h4 className="font-semibold">위기 정보 ({formData.vulnerabilities.risk_list.length}건)</h4>
                        {formData.vulnerabilities.risk_list.length > 0 ? (
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {formData.vulnerabilities.risk_list.map((risk, idx) => (
                              <li key={`risk-${idx}`}>
                                {risk.content}{" "}
                                <span className="text-muted-foreground">
                                  (유형: {renderVulnerabilityTypes(risk.type, getRiskTypeLabel)})
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">등록된 위기 정보 없음</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">욕구 정보 ({formData.vulnerabilities.desire_list.length}건)</h4>
                        {formData.vulnerabilities.desire_list.length > 0 ? (
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {formData.vulnerabilities.desire_list.map((desire, idx) => (
                              <li key={`desire-${idx}`}>
                                {desire.content}{" "}
                                <span className="text-muted-foreground">
                                  (유형: {renderVulnerabilityTypes(desire.type, getDesireTypeLabel)})
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">등록된 욕구 정보 없음</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {isReadOnlyView && !currentVulnerable ? "닫기" : "취소"}
                  </Button>
                </DialogClose>
                {!isReadOnlyView && <Button type="submit">{currentVulnerable ? "수정하기" : "등록하기"}</Button>}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
