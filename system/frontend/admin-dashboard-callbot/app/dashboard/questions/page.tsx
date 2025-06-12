"use client"

import * as React from "react"
import { PlusCircle, Search, Edit, Trash2, FileDown, MoreHorizontal } from "lucide-react" // Added FileDown
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
import { Textarea } from "@/components/ui/textarea"
import { mockQuestionSetTableData, mockQuestionSets } from "@/lib/mock-data"
import type { QuestionSetTableItem, QuestionSet, QuestionFlowItem, ExpectedResponse } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RISK_TYPES, DESIRE_TYPES, RESPONSE_TYPE_CATEGORIES } from "@/lib/consultation-types"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import {
  getQuestionSets,
  getQuestionSetById,
  createQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
} from "@/lib/api"
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

const initialQuestionSetData: QuestionSet = {
  questions_id: "",
  time: new Date().toISOString(),
  title: "",
  flow: [{ text: "", expected_response: [{ text: "" }] }],
}

const ITEMS_PER_PAGE = 10

export default function QuestionsPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [data, setData] = React.useState<QuestionSetTableItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [currentQuestionSet, setCurrentQuestionSet] = React.useState<QuestionSet | null>(null)
  const [formData, setFormData] = React.useState<QuestionSet>(initialQuestionSetData)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsToDelete, setItemsToDelete] = React.useState<string[]>([])
  const { toast } = useToast()

  const fetchAndSetData = async () => {
    setIsLoading(true)
    try {
      const result = await getQuestionSets()
      setData(result.questions || [])
    } catch (err: any) {
      setError(err.message)
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "질문 목록을 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchAndSetData()
  }, [])

  const filteredData = React.useMemo(() => {
    if (!data) return []
    return data.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.questions_id.toLowerCase().includes(searchTerm.toLowerCase()),
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
      setSelectedItems(new Set(filteredData.map((item) => item.questions_id)))
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

  const openFormForCreate = () => {
    setCurrentQuestionSet(null)
    setFormData(initialQuestionSetData)
    setIsFormOpen(true)
  }

  const openFormForEdit = async (questionSetId: string) => {
    try {
      const setToEdit = await getQuestionSetById(questionSetId)
      setCurrentQuestionSet(setToEdit)
      setFormData(setToEdit)
      setIsFormOpen(true)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "오류",
        description: err.message || "질문 세트를 불러오지 못했습니다.",
      })
    }
  }

  const handleDelete = (questionSetIds: string[]) => {
    setItemsToDelete(questionSetIds)
  }

  const executeDelete = async () => {
    if (itemsToDelete.length === 0) return
    try {
      await Promise.all(itemsToDelete.map((id) => deleteQuestionSet(id)))
      toast({
        title: "성공",
        description: `${itemsToDelete.length}개의 질문 세트가 삭제되었습니다.`,
      })
      fetchAndSetData()
      const newSelected = new Set(selectedItems)
      itemsToDelete.forEach((id) => newSelected.delete(id))
      setSelectedItems(newSelected)
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: err.message || "질문 세트를 삭제하는 중 오류가 발생했습니다.",
      })
    } finally {
      setItemsToDelete([])
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFlowChange = (flowIndex: number, field: keyof QuestionFlowItem, value: string) => {
    const newFlow = [...formData.flow]
    ;(newFlow[flowIndex] as any)[field] = value
    setFormData((prev) => ({ ...prev, flow: newFlow }))
  }

  const handleExpectedResponseChange = (
    flowIndex: number,
    erIndex: number,
    field: keyof ExpectedResponse,
    value: string,
  ) => {
    const newFlow = [...formData.flow]
    ;(newFlow[flowIndex].expected_response[erIndex] as any)[field] = value
    setFormData((prev) => ({ ...prev, flow: newFlow }))
  }

  const handleResponseTypeToggle = (
    flowIndex: number,
    erIndex: number,
    category: (typeof RESPONSE_TYPE_CATEGORIES)[keyof typeof RESPONSE_TYPE_CATEGORIES],
    itemIndex: number,
    checked: boolean,
  ) => {
    setFormData((prev) => {
      const newFlow = [...prev.flow]
      const currentER = newFlow[flowIndex].expected_response[erIndex]
      let currentResponseTypes = currentER.response_type_list ? [...currentER.response_type_list] : []

      if (checked) {
        currentResponseTypes.push({ response_type: category, response_index: itemIndex })
      } else {
        currentResponseTypes = currentResponseTypes.filter(
          (rt) => !(rt.response_type === category && rt.response_index === itemIndex),
        )
      }
      newFlow[flowIndex].expected_response[erIndex] = { ...currentER, response_type_list: currentResponseTypes }
      return { ...prev, flow: newFlow }
    })
  }

  const addQuestionToFlow = () => {
    setFormData((prev) => ({
      ...prev,
      flow: [...prev.flow, { text: "", expected_response: [{ text: "" }] }],
    }))
  }

  const removeQuestionFromFlow = (flowIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      flow: prev.flow.filter((_, index) => index !== flowIndex),
    }))
  }

  const addExpectedResponse = (flowIndex: number) => {
    const newFlow = [...formData.flow]
    newFlow[flowIndex].expected_response.push({ text: "" })
    setFormData((prev) => ({ ...prev, flow: newFlow }))
  }

  const removeExpectedResponse = (flowIndex: number, erIndex: number) => {
    const newFlow = [...formData.flow]
    newFlow[flowIndex].expected_response = newFlow[flowIndex].expected_response.filter((_, index) => index !== erIndex)
    setFormData((prev) => ({ ...prev, flow: newFlow }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (currentQuestionSet) {
        await updateQuestionSet(currentQuestionSet.questions_id, formData)
        toast({ title: "성공", description: "질문 세트가 수정되었습니다." })
      } else {
        await createQuestionSet(formData)
        toast({ title: "성공", description: "질문 세트가 등록되었습니다." })
      }
      setIsFormOpen(false)
      fetchAndSetData() // Re-fetch data
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "저장 실패",
        description: err.message || "질문 세트를 저장하는 중 오류가 발생했습니다.",
      })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">질문 관리</h1>
        <p className="text-muted-foreground">상담에 사용될 질문 세트를 관리합니다.</p>
      </header>

      <div className="flex items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="제목, ID 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert("CSV Export (구현 필요)")}>
            <FileDown className="mr-2 h-4 w-4" /> CSV 내보내기
          </Button>
          <Button onClick={openFormForCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> 신규 질문 세트 등록
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
              <TableHead style={{ width: "40px" }} className="text-center">
                <Checkbox
                  checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
                  indeterminate={selectedItems.size > 0 && selectedItems.size < filteredData.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead>제목</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>질문 수</TableHead>
              <TableHead style={{ width: "80px" }} className="text-center">
                작업
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTableData.length > 0 ? (
              currentTableData.map((item) => (
                <TableRow key={item.questions_id} data-state={selectedItems.has(item.questions_id) && "selected"}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedItems.has(item.questions_id)}
                      onCheckedChange={(checked) => handleSelectItem(item.questions_id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.questions_id}</TableCell>
                  <TableCell>{new Date(item.time).toLocaleDateString()}</TableCell>
                  <TableCell>{item.question_list?.length || 0}개</TableCell>
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
                        <DropdownMenuItem onClick={() => openFormForEdit(item.questions_id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete([item.questions_id])}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentQuestionSet ? "질문 세트 수정" : "신규 질문 세트 등록"}</DialogTitle>
            <DialogDescription>
              {currentQuestionSet
                ? `"${currentQuestionSet.title}" 질문 세트를 수정합니다.`
                : "새로운 질문 세트를 등록합니다."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Form content remains the same */}
            {currentQuestionSet && (
              <div className="space-y-1">
                <Label htmlFor="questions_id">ID</Label>
                <Input id="questions_id" name="questions_id" value={formData.questions_id} readOnly />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="title">제목</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required />
            </div>

            <h3 className="text-lg font-semibold pt-2">질문 흐름 (Flow)</h3>
            {formData.flow.map((flowItem, flowIndex) => (
              <div key={flowIndex} className="space-y-3 rounded-md border p-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor={`flow-text-${flowIndex}`}>질문 {flowIndex + 1}</Label>
                  {formData.flow.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestionFromFlow(flowIndex)}>
                      <Trash2 className="h-4 w-4 text-red-500 mr-1" /> 질문 삭제
                    </Button>
                  )}
                </div>
                <Textarea
                  id={`flow-text-${flowIndex}`}
                  value={flowItem.text}
                  onChange={(e) => handleFlowChange(flowIndex, "text", e.target.value)}
                  placeholder="질문 내용을 입력하세요."
                  required
                />
                <h4 className="text-md font-semibold pt-1">예상 답변</h4>
                {flowItem.expected_response.map((erItem, erIndex) => (
                  <div key={erIndex} className="space-y-2 rounded-md border p-3 ml-4">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`er-text-${flowIndex}-${erIndex}`}>예상 답변 {erIndex + 1}</Label>
                      {flowItem.expected_response.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpectedResponse(flowIndex, erIndex)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500 mr-1" /> 답변 삭제
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`er-text-${flowIndex}-${erIndex}`}
                      value={erItem.text}
                      onChange={(e) => handleExpectedResponseChange(flowIndex, erIndex, "text", e.target.value)}
                      placeholder="예상 답변 내용을 입력하세요."
                      required
                    />
                    <div className="pt-2 space-y-3">
                      <div>
                        <h5 className="text-sm font-semibold text-muted-foreground">연결될 위기 정보 (선택)</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                          {RISK_TYPES.map((risk) => (
                            <div
                              key={`risk-${flowIndex}-${erIndex}-${risk.index}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`risk-check-${flowIndex}-${erIndex}-${risk.index}`}
                                checked={
                                  !!erItem.response_type_list?.find(
                                    (rt) =>
                                      rt.response_type === RESPONSE_TYPE_CATEGORIES.RISK &&
                                      rt.response_index === risk.index,
                                  )
                                }
                                onCheckedChange={(checked) =>
                                  handleResponseTypeToggle(
                                    flowIndex,
                                    erIndex,
                                    RESPONSE_TYPE_CATEGORIES.RISK,
                                    risk.index,
                                    Boolean(checked),
                                  )
                                }
                              />
                              <Label
                                htmlFor={`risk-check-${flowIndex}-${erIndex}-${risk.index}`}
                                className="text-xs font-normal"
                              >
                                {risk.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-muted-foreground">연결될 욕구 정보 (선택)</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                          {DESIRE_TYPES.map((desire) => (
                            <div
                              key={`desire-${flowIndex}-${erIndex}-${desire.index}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`desire-check-${flowIndex}-${erIndex}-${desire.index}`}
                                checked={
                                  !!erItem.response_type_list?.find(
                                    (rt) =>
                                      rt.response_type === RESPONSE_TYPE_CATEGORIES.DESIRE &&
                                      rt.response_index === desire.index,
                                  )
                                }
                                onCheckedChange={(checked) =>
                                  handleResponseTypeToggle(
                                    flowIndex,
                                    erIndex,
                                    RESPONSE_TYPE_CATEGORIES.DESIRE,
                                    desire.index,
                                    Boolean(checked),
                                  )
                                }
                              />
                              <Label
                                htmlFor={`desire-check-${flowIndex}-${erIndex}-${desire.index}`}
                                className="text-xs font-normal"
                              >
                                {desire.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addExpectedResponse(flowIndex)}>
                  <PlusCircle className="h-4 w-4 mr-2" /> 예상 답변 추가
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addQuestionToFlow}>
              <PlusCircle className="h-4 w-4 mr-2" /> 질문 추가
            </Button>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </DialogClose>
              <Button type="submit">{currentQuestionSet ? "수정하기" : "등록하기"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={itemsToDelete.length > 0} onOpenChange={(open) => !open && setItemsToDelete([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 선택한 {itemsToDelete.length}개의 질문 세트가 서버에서 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>삭제 확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
