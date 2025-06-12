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
import { VulnerableTableItem, VulnerableIndividual } from "@/types" // Assuming types are defined
import { fetchFromApi } from "@/lib/api"

const initialFormData: VulnerableIndividual = {
  user_id: "",
  name: "",
  gender: "M",
  birth_date: "",
  phone_number: "",
  address: { state: "", city: "", address1: "", address2: "" },
  vulnerabilities: { summary: "", risk_list: [], desire_list: [] },
  last_consultation_id: "",
}

const ITEMS_PER_PAGE = 10;

// Mock data for now, will be replaced by API calls
const mockVulnerableTableData: VulnerableTableItem[] = [];
const mockVulnerableIndividuals: VulnerableIndividual[] = [];


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
        item.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data, searchTerm])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchFromApi("/vulnerable/list");
        setData(response);
      } catch (error) {
        console.error("Failed to fetch vulnerable data:", error);
        setData(mockVulnerableTableData);
      }
    };
    fetchData();
  }, []);

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

  const handleDelete = async (userIds: string[]) => {
    try {
      for (const userId of userIds) {
        await fetchFromApi(`/vulnerable/${userId}`, {
          method: 'DELETE',
        });
      }
      // 데이터 새로고침
      const response = await fetchFromApi("/vulnerable/list");
      setData(response);
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("삭제에 실패했습니다.");
    }
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentVulnerable) {
        // 수정
        await fetchFromApi(`/vulnerable/${formData.user_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // 신규 등록
        await fetchFromApi("/vulnerable/add", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setIsModalOpen(false);
      // 데이터 새로고침
      const response = await fetchFromApi("/vulnerable/list");
      setData(response);
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert("저장에 실패했습니다.");
    }
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
          <div className="flex items-center justify-between bg-foreground/5 p-2 rounded-md">
            <span className="text-sm font-medium">{selectedItems.size}개 선택됨</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedItems))}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              선택 삭제
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      currentTableData.length > 0 && selectedItems.size === currentTableData.length
                    }
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                  />
                </TableHead>
                <TableHead>이름</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>생년월일</TableHead>
                <TableHead>주소</TableHead>
                <TableHead>요약</TableHead>
                <TableHead>위기/욕구</TableHead>
                <TableHead className="w-20 text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTableData.length > 0 ? (
                currentTableData.map((item) => (
                  <TableRow
                    key={item.user_id}
                    data-state={selectedItems.has(item.user_id) && "selected"}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.user_id)}
                        onCheckedChange={(checked) => handleSelectItem(item.user_id, Boolean(checked))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.phone_number}</TableCell>
                    <TableCell>{item.birth_date}</TableCell>
                    <TableCell>{item.address_summary}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{item.summary}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.summary}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.riskCount > 0 && (
                          <Badge variant="destructive" className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" /> {item.riskCount}
                          </Badge>
                        )}
                        {item.desireCount > 0 && (
                          <Badge variant="default" className="flex items-center bg-sky-500">
                            <HeartHandshake className="h-3 w-3 mr-1" /> {item.desireCount}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>작업</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openModal(item.user_id, true)}>
                            <Eye className="mr-2 h-4 w-4" /> 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal(item.user_id, false)}>
                            <Edit className="mr-2 h-4 w-4" /> 수정
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete([item.user_id])}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    결과가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(Math.max(currentPage - 1, 1));
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
                      e.preventDefault();
                      handlePageChange(page);
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
                    e.preventDefault();
                    handlePageChange(Math.min(currentPage + 1, totalPages));
                  }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {isModalOpen && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-2xl">
              <form onSubmit={handleFormSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {isReadOnlyView ? "취약 계층 상세 정보" : currentVulnerable ? "취약 계층 수정" : "취약 계층 신규 등록"}
                  </DialogTitle>
                  <DialogDescription>
                    {isReadOnlyView ? "정보를 확인합니다." : "취약 계층의 정보를 입력하거나 수정합니다."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user_id">ID</Label>
                      <Input id="user_id" name="user_id" value={formData.user_id} readOnly className="mt-1 bg-muted/50" placeholder={currentVulnerable ? "" : "자동 생성됩니다."} />
                    </div>
                    <div>
                      <Label htmlFor="name">이름</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required readOnly={isReadOnlyView} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="gender">성별</Label>
                      <select id="gender" name="gender" value={formData.gender} onChange={handleFormChange} disabled={isReadOnlyView} className="mt-1 block w-full rounded-md border-input border bg-background p-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring h-10">
                        <option value="M">남성</option>
                        <option value="F">여성</option>
                        <option value="O">기타</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="birth_date">생년월일</Label>
                      <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date} onChange={handleFormChange} required readOnly={isReadOnlyView} className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone_number">전화번호</Label>
                      <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleFormChange} required readOnly={isReadOnlyView} className="mt-1" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                      <h3 className="font-medium border-t pt-4">주소 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <Label htmlFor="address.state">시/도</Label>
                              <Input id="address.state" name="address.state" value={formData.address.state} onChange={handleFormChange} required readOnly={isReadOnlyView} className="mt-1"/>
                          </div>
                          <div>
                              <Label htmlFor="address.city">시/군/구</Label>
                              <Input id="address.city" name="address.city" value={formData.address.city} onChange={handleFormChange} required readOnly={isReadOnlyView} className="mt-1"/>
                          </div>
                          <div className="md:col-span-2">
                              <Label htmlFor="address.address1">상세주소1</Label>
                              <Input id="address.address1" name="address.address1" value={formData.address.address1} onChange={handleFormChange} required readOnly={isReadOnlyView} className="mt-1"/>
                          </div>
                          <div className="md:col-span-2">
                              <Label htmlFor="address.address2">상세주소2</Label>
                              <Input id="address.address2" name="address.address2" value={formData.address.address2 || ''} onChange={handleFormChange} readOnly={isReadOnlyView} className="mt-1"/>
                          </div>
                      </div>
                  </div>

                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      닫기
                    </Button>
                  </DialogClose>
                  {!isReadOnlyView && (
                    <Button type="submit">{currentVulnerable ? "저장" : "등록"}</Button>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  )
}
