"use client"

import * as React from "react"
import { useRouter } from "next/navigation" // Import useRouter
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { mockVulnerableIndividuals, mockQuestionSets } from "@/lib/mock-data"
import type { VulnerableIndividual, ConsultationQueueItem, QuestionSet, QuestionSetTableItem } from "@/types"
import { PhoneOutgoing, Search, UserPlus, Users, FilterX, ChevronDown, ChevronUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { calculateAge } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { getQuestionSets, registerToQueue, searchVulnerables } from "@/lib/api"

interface Filters {
  name: string
  minAge: string
  maxAge: string
  gender: "" | "M" | "F" | "O"
  region: string
  riskKeywords: string
  desireKeywords: string
}

const initialFilters: Filters = {
  name: "",
  minAge: "",
  maxAge: "",
  gender: "",
  region: "",
  riskKeywords: "",
  desireKeywords: "",
}

export default function ConsultationsPage() {
  const router = useRouter() // Initialize useRouter
  const { toast } = useToast()

  // Data states
  const [allQuestionSets, setAllQuestionSets] = React.useState<QuestionSetTableItem[]>([])

  // Selection states
  const [selectedIndividualsForConsultation, setSelectedIndividualsForConsultation] = React.useState<Set<string>>(new Set())
  const [selectedQuestionSetId, setSelectedQuestionSetId] = React.useState<string>("")

  // Filter and UI states
  const [filters, setFilters] = React.useState<Filters>(initialFilters)
  const [filteredDisplayIndividuals, setFilteredDisplayIndividuals] = React.useState<VulnerableIndividual[]>([])
  const [stagedForSelection, setStagedForSelection] = React.useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const questionsRes = await getQuestionSets()
        setAllQuestionSets(questionsRes.questions || [])
      } catch (err: any) {
        setError("질문 세트 데이터를 불러오는 데 실패했습니다.")
        toast({
          variant: "destructive",
          title: "오류",
          description: err.message || "질문 세트 로딩 중 오류 발생",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchInitialData()
  }, [toast])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Special handler for Select component as it doesn't have a 'name' prop in the event
  const handleGenderFilterChange = (value: "" | "M" | "F" | "O") => {
    setFilters((prev) => ({ ...prev, gender: value }))
  }

  const applyFilters = React.useCallback(async () => {
    setIsSearching(true)
    setError(null)
    try {
      const results = await searchVulnerables(filters)
      setFilteredDisplayIndividuals(results.vulnerables || [])
    } catch (err: any) {
      setError("검색 중 오류가 발생했습니다.")
      toast({
        variant: "destructive",
        title: "검색 오류",
        description: err.message || "대상자 검색에 실패했습니다.",
      })
    } finally {
      setIsSearching(false)
    }
    setStagedForSelection(new Set())
  }, [filters, toast])

  const handleStageItemSelect = (userId: string, checked: boolean) => {
    const newSelected = new Set(stagedForSelection)
    if (checked) newSelected.add(userId)
    else newSelected.delete(userId)
    setStagedForSelection(newSelected)
  }

  const handleStageSelectAll = (checked: boolean) => {
    if (checked) {
      setStagedForSelection(new Set(filteredDisplayIndividuals.map((p) => p.user_id)))
    } else {
      setStagedForSelection(new Set())
    }
  }

  const addStagedToConsultationList = () => {
    setSelectedIndividualsForConsultation((prev) => new Set([...prev, ...stagedForSelection]))
    setStagedForSelection(new Set())
  }

  const removeIndividualFromConsultation = (userId: string) => {
    setSelectedIndividualsForConsultation((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

  const handleStartConsultation = async () => {
    if (selectedIndividualsForConsultation.size === 0 || !selectedQuestionSetId) {
      toast({
        variant: "destructive",
        title: "선택 필요",
        description: "상담 대상자와 질문 세트를 모두 선택해주세요.",
      })
      return
    }

    try {
      await registerToQueue({
        vulnerableIds: Array.from(selectedIndividualsForConsultation),
        questionsId: selectedQuestionSetId,
      })
      toast({
        title: "성공",
        description: "상담 대기열에 성공적으로 등록되었습니다. 상태 페이지로 이동합니다.",
      })
      router.push("/dashboard/consultations/status")
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "등록 실패",
        description: err.message || "대기열 등록 중 오류가 발생했습니다.",
      })
    }
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setFilteredDisplayIndividuals([])
    setStagedForSelection(new Set())
  }

  if (isLoading) {
    return <div>Loading initial data...</div>
  }
  if (error && !isSearching) { // Show general error only if not a search-specific error
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">상담 시작</h1>
        <p className="text-muted-foreground">상담 대상자와 질문 세트를 선택하여 상담을 시작합니다.</p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>상담 대상자 선택</CardTitle>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              대상자 필터 {showFilters ? "숨기기" : "보이기"}
            </Button>
          </div>
          <CardDescription>조건을 설정하여 상담할 대상자를 검색하고 추가하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showFilters && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" name="name" value={filters.name} onChange={handleFilterChange} placeholder="홍길동" />
                </div>
                <div className="flex gap-2">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="minAge">최소 나이</Label>
                    <Input id="minAge" name="minAge" type="number" value={filters.minAge} onChange={handleFilterChange} placeholder="30" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="maxAge">최대 나이</Label>
                    <Input id="maxAge" name="maxAge" type="number" value={filters.maxAge} onChange={handleFilterChange} placeholder="65" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">성별</Label>
                   <Select name="gender" onValueChange={handleGenderFilterChange} value={filters.gender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="성별 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">모두</SelectItem>
                      <SelectItem value="M">남성</SelectItem>
                      <SelectItem value="F">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">지역</Label>
                  <Input id="region" name="region" value={filters.region} onChange={handleFilterChange} placeholder="예: 서울시 강남구" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskKeywords">위기 키워드</Label>
                  <Input id="riskKeywords" name="riskKeywords" value={filters.riskKeywords} onChange={handleFilterChange} placeholder="체납, 고립 (쉼표로 구분)" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="desireKeywords">욕구 키워드</Label>
                  <Input id="desireKeywords" name="desireKeywords" value={filters.desireKeywords} onChange={handleFilterChange} placeholder="일자리, 건강 (쉼표로 구분)" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={clearFilters}>
                  <FilterX className="mr-2 h-4 w-4" />
                  초기화
                </Button>
                <Button onClick={applyFilters} disabled={isSearching}>
                  <Search className="mr-2 h-4 w-4" />
                  {isSearching ? "검색 중..." : "검색"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Left: Search Results */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">검색 결과 ({filteredDisplayIndividuals.length}명)</h3>
               <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all-staged"
                    onCheckedChange={(checked) => handleStageSelectAll(Boolean(checked))}
                    checked={filteredDisplayIndividuals.length > 0 && stagedForSelection.size === filteredDisplayIndividuals.length}
                    disabled={filteredDisplayIndividuals.length === 0}
                  />
                  <Label htmlFor="select-all-staged" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    전체 선택
                  </Label>
                </div>
              <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4">
                  {isSearching ? (
                    <div className="flex justify-center items-center h-full">
                      <p>검색 중...</p>
                    </div>
                  ) : filteredDisplayIndividuals.length > 0 ? (
                    filteredDisplayIndividuals.map((p) => (
                      <div key={p.user_id} className="flex items-center space-x-4 mb-2">
                        <Checkbox
                          id={`select-${p.user_id}`}
                          checked={stagedForSelection.has(p.user_id) || selectedIndividualsForConsultation.has(p.user_id)}
                          onCheckedChange={(checked) => handleStageItemSelect(p.user_id, Boolean(checked))}
                          disabled={selectedIndividualsForConsultation.has(p.user_id)}
                        />
                        <Label htmlFor={`select-${p.user_id}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <div>
                              <span className="font-semibold">{p.name}</span> ({p.gender === "M" ? "남" : "여"}, {calculateAge(p.birth_date)}세)
                            </div>
                            {selectedIndividualsForConsultation.has(p.user_id) && (
                              <Badge variant="outline">추가됨</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{p.address.address1}</p>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-muted-foreground">검색 결과가 없습니다. 필터를 조정해보세요.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <Button onClick={addStagedToConsultationList} disabled={stagedForSelection.size === 0}>
                <UserPlus className="mr-2 h-4 w-4" />
                선택한 대상자 추가 ({stagedForSelection.size}명)
              </Button>
            </div>
            {/* Right: Selected Individuals */}
            <div className="space-y-2">
              <Label className="text-md font-semibold">
                최종 상담 대상자 ({selectedIndividualsForConsultation.size}명)
              </Label>
              {selectedIndividualsForConsultation.size > 0 ? (
                <ScrollArea className="h-40 w-full rounded-md border p-4">
                  {allQuestionSets
                    .filter((q) => selectedIndividualsForConsultation.has(q.questions_id))
                    .map((q) => (
                      <div
                        key={q.questions_id}
                        className="flex items-center justify-between space-x-2 mb-2 p-2 rounded hover:bg-muted/50"
                      >
                        <Label htmlFor={`selected-${q.questions_id}`} className="font-normal">
                          {q.title} (ID: {q.questions_id})
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIndividualFromConsultation(q.questions_id)}
                        >
                          제외
                        </Button>
                      </div>
                    ))}
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground p-4 border rounded-md">
                  <Users className="mx-auto h-8 w-8 mb-2" />
                  상담 대상자를 위에서 검색하여 추가해주세요.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionSet" className="text-md font-semibold">
                질문 세트 선택
              </Label>
              <Select value={selectedQuestionSetId} onValueChange={setSelectedQuestionSetId}>
                <SelectTrigger>
                  <SelectValue placeholder="질문 세트 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {allQuestionSets.map((qs) => (
                    <SelectItem key={qs.questions_id} value={qs.questions_id}>
                      {qs.title} (ID: {qs.questions_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleStartConsultation}
            disabled={selectedIndividualsForConsultation.size === 0 || !selectedQuestionSetId}
            size="lg"
            className="w-full"
          >
            <PhoneOutgoing className="mr-2 h-5 w-5" />
            상담 시작하기 ({selectedIndividualsForConsultation.size}명)
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
