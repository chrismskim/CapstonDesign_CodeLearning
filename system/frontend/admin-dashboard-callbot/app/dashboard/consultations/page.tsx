"use client"

import * as React from "react"
import { useRouter } from "next/navigation" // Import useRouter
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { mockVulnerableIndividuals, mockQuestionSets } from "@/libs/mock-data"
import type { VulnerableIndividual, ConsultationQueueItem } from "@/types"
import { PhoneOutgoing, Search, UserPlus, Users, FilterX, ChevronDown, ChevronUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { calculateAge } from "@/libs/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
  const [allVulnerableIndividuals] = React.useState<VulnerableIndividual[]>(mockVulnerableIndividuals)
  const [selectedIndividualsForConsultation, setSelectedIndividualsForConsultation] = React.useState<Set<string>>(
    new Set(),
  )
  const [selectedQuestionSetId, setSelectedQuestionSetId] = React.useState<string>("")

  const [filters, setFilters] = React.useState<Filters>(initialFilters)
  const [filteredDisplayIndividuals, setFilteredDisplayIndividuals] = React.useState<VulnerableIndividual[]>([])
  const [stagedForSelection, setStagedForSelection] = React.useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = React.useState(false)

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Special handler for Select component as it doesn't have a 'name' prop in the event
  const handleGenderFilterChange = (value: "" | "M" | "F" | "O") => {
    setFilters((prev) => ({ ...prev, gender: value }))
  }

  const applyFilters = React.useCallback(() => {
    let result = allVulnerableIndividuals
    // ... (filter logic remains the same) ...
    if (filters.name) {
      result = result.filter((p) => p.name.toLowerCase().includes(filters.name.toLowerCase()))
    }
    if (filters.minAge || filters.maxAge) {
      const min = Number.parseInt(filters.minAge) || 0
      const max = Number.parseInt(filters.maxAge) || Number.POSITIVE_INFINITY
      result = result.filter((p) => {
        const age = calculateAge(p.birth_date)
        return age !== null && age >= min && age <= max
      })
    }
    if (filters.gender) {
      result = result.filter((p) => p.gender === filters.gender)
    }
    if (filters.region) {
      const regionLower = filters.region.toLowerCase()
      result = result.filter(
        (p) =>
          p.address.state.toLowerCase().includes(regionLower) ||
          p.address.city.toLowerCase().includes(regionLower) ||
          p.address.address1.toLowerCase().includes(regionLower),
      )
    }
    if (filters.riskKeywords) {
      const keywords = filters.riskKeywords
        .toLowerCase()
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k)
      if (keywords.length > 0) {
        result = result.filter((p) =>
          keywords.some(
            (keyword) =>
              p.vulnerabilities?.summary?.toLowerCase().includes(keyword) ||
              p.vulnerabilities?.risk_list.some((r) => r.content.toLowerCase().includes(keyword)),
          ),
        )
      }
    }
    if (filters.desireKeywords) {
      const keywords = filters.desireKeywords
        .toLowerCase()
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k)
      if (keywords.length > 0) {
        result = result.filter((p) =>
          keywords.some(
            (keyword) =>
              p.vulnerabilities?.summary?.toLowerCase().includes(keyword) ||
              p.vulnerabilities?.desire_list.some((d) => d.content.toLowerCase().includes(keyword)),
          ),
        )
      }
    }
    setFilteredDisplayIndividuals(result)
    setStagedForSelection(new Set())
  }, [filters, allVulnerableIndividuals])

  React.useEffect(() => {
    // Apply filters initially or when component mounts if you want to show all by default
    // For now, let's apply when filters change or explicitly by button
    // applyFilters(); // Or call this on a button click
  }, []) // Removed applyFilters from dependency array to avoid running on every filter input change. Call it via button.

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

  const handleStartConsultation = () => {
    if (selectedIndividualsForConsultation.size === 0 || !selectedQuestionSetId) {
      alert("상담 대상자와 질문 세트를 선택해주세요.")
      return
    }

    const questionSet = mockQuestionSets.find((qs) => qs.id === selectedQuestionSetId)
    if (!questionSet) {
      alert("선택된 질문 세트를 찾을 수 없습니다.")
      return
    }

    const newQueueItems: ConsultationQueueItem[] = Array.from(selectedIndividualsForConsultation).map((v_id) => {
      const individual = allVulnerableIndividuals.find((p) => p.user_id === v_id)
      return {
        v_id: v_id,
        v_name: individual?.name || "알 수 없음",
        status: "waiting",
        q_id: selectedQuestionSetId,
        q_title: questionSet.title,
        estimated_wait_time: `${Math.floor(Math.random() * 10) + 1}분`, // Random wait time for demo
      }
    })

    // In a real app, you'd send this to a backend. For demo, use localStorage.
    // This is a simplified way to manage a shared queue for the demo.
    // A more robust solution would involve context, Zustand, Redux, or server-side state.
    if (typeof window !== "undefined") {
      localStorage.setItem("consultationQueue", JSON.stringify(newQueueItems))
    }

    // Redirect to the status page
    router.push("/dashboard/consultations/status")
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setFilteredDisplayIndividuals([])
    setStagedForSelection(new Set())
  }

  return (
    <div className="space-y-6">
      {/* ... (rest of the JSX remains largely the same, ensure Card, CardHeader etc. are correctly structured) ... */}
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
            <div className="p-4 border rounded-md space-y-4 bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="filterName">이름</Label>
                  <Input
                    id="filterName"
                    name="name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <Label htmlFor="filterMinAge">최소 나이</Label>
                  <Input
                    id="filterMinAge"
                    name="minAge"
                    type="number"
                    value={filters.minAge}
                    onChange={handleFilterChange}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="filterMaxAge">최대 나이</Label>
                  <Input
                    id="filterMaxAge"
                    name="maxAge"
                    type="number"
                    value={filters.maxAge}
                    onChange={handleFilterChange}
                    placeholder="65"
                  />
                </div>
                <div>
                  <Label htmlFor="filterGender">성별</Label>
                  <Select name="gender" value={filters.gender} onValueChange={handleGenderFilterChange}>
                    <SelectTrigger id="filterGender">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="M">남성</SelectItem>
                      <SelectItem value="F">여성</SelectItem>
                      <SelectItem value="O">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterRegion">지역</Label>
                  <Input
                    id="filterRegion"
                    name="region"
                    value={filters.region}
                    onChange={handleFilterChange}
                    placeholder="서울시 강남구"
                  />
                </div>
                <div>
                  <Label htmlFor="filterRiskKeywords">위기 정보 키워드</Label>
                  <Input
                    id="filterRiskKeywords"
                    name="riskKeywords"
                    value={filters.riskKeywords}
                    onChange={handleFilterChange}
                    placeholder="월세, 건강 (쉼표로 구분)"
                  />
                </div>
                <div>
                  <Label htmlFor="filterDesireKeywords">욕구 정보 키워드</Label>
                  <Input
                    id="filterDesireKeywords"
                    name="desireKeywords"
                    value={filters.desireKeywords}
                    onChange={handleFilterChange}
                    placeholder="일자리, 친구 (쉼표로 구분)"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={clearFilters}>
                  <FilterX className="mr-2 h-4 w-4" /> 초기화
                </Button>
                <Button onClick={applyFilters}>
                  <Search className="mr-2 h-4 w-4" /> 검색하기
                </Button>
              </div>
            </div>
          )}

          {filteredDisplayIndividuals.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-md font-semibold">검색 결과 ({filteredDisplayIndividuals.length}명)</h3>
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="stage-select-all"
                  checked={stagedForSelection.size > 0 && stagedForSelection.size === filteredDisplayIndividuals.length}
                  onCheckedChange={(checked) => handleStageSelectAll(Boolean(checked))}
                />
                <Label htmlFor="stage-select-all" className="font-normal text-sm">
                  전체 선택 ({stagedForSelection.size} / {filteredDisplayIndividuals.length} 선택됨)
                </Label>
              </div>
              <ScrollArea className="h-60 w-full rounded-md border p-4">
                {filteredDisplayIndividuals.map((individual) => (
                  <div key={individual.user_id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`stage-${individual.user_id}`}
                      checked={stagedForSelection.has(individual.user_id)}
                      onCheckedChange={(checked) => handleStageItemSelect(individual.user_id, Boolean(checked))}
                      disabled={selectedIndividualsForConsultation.has(individual.user_id)}
                    />
                    <Label htmlFor={`stage-${individual.user_id}`} className="font-normal flex-grow">
                      {individual.name} ({individual.user_id}) - {calculateAge(individual.birth_date)}세,{" "}
                      {individual.gender === "M" ? "남" : individual.gender === "F" ? "여" : "기타"},{" "}
                      {individual.address.city}
                    </Label>
                    {selectedIndividualsForConsultation.has(individual.user_id) && (
                      <Badge variant="outline">추가됨</Badge>
                    )}
                  </div>
                ))}
              </ScrollArea>
              <Button onClick={addStagedToConsultationList} disabled={stagedForSelection.size === 0}>
                <UserPlus className="mr-2 h-4 w-4" /> 선택한 {stagedForSelection.size}명 상담 목록에 추가
              </Button>
            </div>
          )}
          {showFilters &&
            filteredDisplayIndividuals.length === 0 &&
            JSON.stringify(filters) !== JSON.stringify(initialFilters) && ( // Check if filters are actually applied
              <p className="text-center text-muted-foreground py-4">
                검색 결과가 없습니다. 다른 조건으로 시도해보세요.
              </p>
            )}
          <Separator />
          <div className="space-y-2">
            <Label className="text-md font-semibold">
              최종 상담 대상자 ({selectedIndividualsForConsultation.size}명)
            </Label>
            {selectedIndividualsForConsultation.size > 0 ? (
              <ScrollArea className="h-40 w-full rounded-md border p-4">
                {allVulnerableIndividuals
                  .filter((p) => selectedIndividualsForConsultation.has(p.user_id))
                  .map((individual) => (
                    <div
                      key={individual.user_id}
                      className="flex items-center justify-between space-x-2 mb-2 p-2 rounded hover:bg-muted/50"
                    >
                      <Label htmlFor={`selected-${individual.user_id}`} className="font-normal">
                        {individual.name} ({individual.user_id}) - {individual.phone_number}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndividualFromConsultation(individual.user_id)}
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
              <SelectTrigger id="questionSet">
                <SelectValue placeholder="질문 세트를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {mockQuestionSets.map((qs) => (
                  <SelectItem key={qs.id} value={qs.id}>
                    {qs.title} ({qs.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleStartConsultation}
            disabled={selectedIndividualsForConsultation.size === 0 || !selectedQuestionSetId}
          >
            <PhoneOutgoing className="mr-2 h-4 w-4" /> 선택된 {selectedIndividualsForConsultation.size}명 상담 시작하기
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
