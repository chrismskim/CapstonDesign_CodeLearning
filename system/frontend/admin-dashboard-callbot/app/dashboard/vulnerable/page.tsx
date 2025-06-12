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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { getVulnerables, getVulnerableById, updateVulnerable, createVulnerable, deleteVulnerable } from "@/lib/api"
import type { VulnerableIndividual } from "@/types"
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
import { useToast } from "@/components/ui/use-toast"

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
  const [data, setData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isReadOnlyView, setIsReadOnlyView] = React.useState(false)
  const [currentVulnerable, setCurrentVulnerable] = React.useState<VulnerableIndividual | null>(null)
  const [formData, setFormData] = React.useState<VulnerableIndividual>(initialFormData)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsToDelete, setItemsToDelete] = React.useState<string[]>([])
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getVulnerables()
        setData(result.vulnerables || [])
      } catch (err: any) {
        setError(err.message || "데이터를 불러오는데 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredData = React.useMemo(() => {
    if (!data) return []
    return data.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_id?.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const handleSelectItem = async (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems)
    if (checked) {
      newSelectedItems.add(itemId)
    } else {
      newSelectedItems.delete(itemId)
    }
    setSelectedItems(newSelectedItems)
  }

  const openModal = async (userId: string | null, readOnly: boolean) => {
    setIsReadOnlyView(readOnly)
    if (userId) {
      try {
        const vulnerableToViewOrEdit = await getVulnerableById(userId)
        setCurrentVulnerable(vulnerableToViewOrEdit)
        setFormData(vulnerableToViewOrEdit)
        setIsModalOpen(true)
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "오류 발생",
          description: err.message || "상세 정보를 불러오는데 실패했습니다.",
        })
      }
    } else {
      setCurrentVulnerable(null)
      setFormData({
        ...initialFormData,
        vulnerabilities: { summary: "", risk_list: [], desire_list: [] },
      })
      setIsModalOpen(true)
    }
  }

  const handleDelete = (userIds: string[]) => {
    setItemsToDelete(userIds)
  }

  const executeDelete = async () => {
    if (itemsToDelete.length === 0) return

    try {
      await Promise.all(itemsToDelete.map((id) => deleteVulnerable(id)))

      toast({
        title: "성공",
        description: `${itemsToDelete.length}개의 항목이 삭제되었습니다.`,
      })

      // Refetch data and clear selections
      const result = await getVulnerables()
      setData(result.vulnerables || [])
      const newSelectedItems = new Set(selectedItems)
      itemsToDelete.forEach((id) => newSelectedItems.delete(id))
      setSelectedItems(newSelectedItems)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "삭제 오류",
        description: err.message || "항목을 삭제하는 중 오류가 발생했습니다.",
      })
    } finally {
      setItemsToDelete([])
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
    e.preventDefault()
    if (isReadOnlyView) {
      setIsModalOpen(false)
      return
    }

    try {
      if (currentVulnerable) {
        await updateVulnerable(currentVulnerable.user_id, formData)
        toast({
          title: "성공",
          description: `${formData.name} 님의 정보가 성공적으로 수정되었습니다.`,
        })
      } else {
        await createVulnerable(formData)
        toast({
          title: "성공",
          description: `${formData.name} 님의 정보가 성공적으로 등록되었습니다.`,
        })
      }
      // Re-fetch data to show the changes
      const result = await getVulnerables()
      setData(result.vulnerables || [])
      setIsModalOpen(false)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: err.message || "정보 저장 중 오류가 발생했습니다.",
      })
    }
  }

  const renderVulnerabilityTypes = (types: number[], typeGetter: (index: number) => string | undefined) => {
    return types.map((t) => typeGetter(t) || `알 수 없는 유형 ${t}`).join(", ")
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">취약 계층 관리</h1>
          <p className="text-muted-foreground">데이터를 불러오는 중입니다...</p>
        </header>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="h-10 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded w-1/4" />
          </div>
          <div className="space-y-2">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive">오류 발생</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
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
            <Button
              variant="destructive"
              onClick={() => handleDelete(Array.from(selectedItems))}
              disabled={selectedItems.size === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" /> 선택 삭제 ({selectedItems.size})
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: "40px" }} className="text-center">
                  <Checkbox
                    checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
                    indeterminate={selectedItems.size > 0 && selectedItems.size < filteredData.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead>이름</TableHead>
                <TableHead>성별</TableHead>
                <TableHead>나이</TableHead>
                <TableHead>거주지</TableHead>
                <TableHead className="text-center">위기</TableHead>
                <TableHead className="text-center">욕구</TableHead>
                <TableHead style={{ width: "80px" }} className="text-center">
                  작업
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTableData.length > 0 ? (
                currentTableData.map((item) => (
                  <TableRow key={item.user_id} data-state={selectedItems.has(item.user_id) && "selected"}>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedItems.has(item.user_id)}
                        onCheckedChange={(checked) => handleSelectItem(item.user_id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.gender === "M" ? "남성" : "여성"}</TableCell>
                    <TableCell>{item.age}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell className="text-center">
                      {item.risk_list_size > 0 ? (
                        <Badge variant="destructive">{item.risk_list_size}개</Badge>
                      ) : (
                        <Badge variant="secondary">없음</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.desire_list_size > 0 ? (
                        <Badge variant="outline">{item.desire_list_size}개</Badge>
                      ) : (
                        <Badge variant="secondary">없음</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
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
                            <Eye className="mr-2 h-4 w-4" />
                            상세보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal(item.user_id, false)}>
                            <Edit className="mr-2 h-4 w-4" />
                            수정하기
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete([item.user_id])}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제하기
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
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(Math.max(1, currentPage - 1))
                  }}
                  disabled={currentPage === 1}
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
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isReadOnlyView ? "취약계층 상세 정보" : currentVulnerable ? "취약계층 정보 수정" : "신규 취약계층 등록"}
              </DialogTitle>
              <DialogDescription>
                {isReadOnlyView
                  ? "취약계층의 상세 정보를 확인합니다."
                  : "취약계층의 정보를 입력하고 저장하세요."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user_id" className="text-right">
                    사용자 ID
                  </Label>
                  <Input
                    id="user_id"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={!!currentVulnerable || isReadOnlyView}
                    placeholder={currentVulnerable ? "" : "등록 시 자동 생성됩니다"}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    이름
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isReadOnlyView}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="birth_date" className="text-right">
                    생년월일
                  </Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isReadOnlyView}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone_number" className="text-right">
                    연락처
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isReadOnlyView}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address.state" className="text-right">
                    주소 (시/군)
                  </Label>
                  <Input
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isReadOnlyView}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address.city" className="text-right">
                    주소 (구/읍/면)
                  </Label>
                  <Input
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isReadOnlyView}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address.address1" className="text-right">
                    도로명 주소
                  </Label>
                  <Input
                    id="address.address1"
                    name="address.address1"
                    value={formData.address.address1}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isReadOnlyView}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address.address2" className="text-right">
                    상세 주소
                  </Label>
                  <Input
                    id="address.address2"
                    name="address.address2"
                    value={formData.address.address2}
                    onChange={handleFormChange}
                    className="col-span-3"
                    disabled={isReadOnlyView}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    취소
                  </Button>
                </DialogClose>
                {!isReadOnlyView && <Button type="submit">저장</Button>}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={itemsToDelete.length > 0} onOpenChange={(open) => !open && setItemsToDelete([])}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 선택한 {itemsToDelete.length}개의 데이터가 서버에서 영구적으로
                삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete}>삭제 확인</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
