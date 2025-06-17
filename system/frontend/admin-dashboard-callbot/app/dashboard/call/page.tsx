"use client"

import * as React from "react"
import { useRouter } from "next/navigation" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { mockVulnerableIndividuals, mockQuestionSets } from "@/lib/mock-data" // Mock data
import type { VulnerableIndividual, ConsultationQueueItem, QuestionSet, ConsultationStatusDto } from "@/types"
import { PhoneOutgoing, Search, UserPlus, Users, FilterX, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2, XCircle, RefreshCw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { calculateAge } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fetchFromApi } from "@/lib/api"
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

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
  const router = useRouter()
  const [allVulnerableIndividuals, setAllVulnerableIndividuals] = React.useState<VulnerableIndividual[]>(mockVulnerableIndividuals)
  const [allQuestionSets, setAllQuestionSets] = React.useState<QuestionSet[]>(mockQuestionSets)

  const [selectedIndividualsForConsultation, setSelectedIndividualsForConsultation] = React.useState<Set<string>>(
    new Set(),
  )
  const [selectedQuestionSetId, setSelectedQuestionSetId] = React.useState<string>("")

  const [filters, setFilters] = React.useState<Filters>(initialFilters)
  const [filteredDisplayIndividuals, setFilteredDisplayIndividuals] = React.useState<VulnerableIndividual[]>([])
  const [stagedForSelection, setStagedForSelection] = React.useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = React.useState(false)
  const [liveStatuses, setLiveStatuses] = React.useState<Record<string, ConsultationQueueItem>>({})
  const eventSourceRef = React.useRef<EventSource | null>(null)

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenderFilterChange = (value: "" | "M" | "F" | "O") => {
    setFilters((prev) => ({ ...prev, gender: value }))
  }

  const applyFilters = React.useCallback(() => {
    let result = allVulnerableIndividuals
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
      const keywords = filters.riskKeywords.toLowerCase().split(",").map((k) => k.trim()).filter((k) => k)
      if (keywords.length > 0) {
        result = result.filter((p) =>
          keywords.some(
            (keyword) =>
              p.vulnerabilities?.summary?.toLowerCase().includes(keyword)
          ),
        )
      }
    }
    if (filters.desireKeywords) {
      const keywords = filters.desireKeywords.toLowerCase().split(",").map((k) => k.trim()).filter((k) => k)
      if (keywords.length > 0) {
        result = result.filter((p) =>
          keywords.some(
            (keyword) =>
              p.vulnerabilities?.summary?.toLowerCase().includes(keyword)
          ),
        )
      }
    }
    setFilteredDisplayIndividuals(result)
    setStagedForSelection(new Set())
  }, [filters, allVulnerableIndividuals])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const vulnerableFromApi = await fetchFromApi("/vulnerable/list");
        const transformedVulnerable = vulnerableFromApi.map((item: any) => ({
            user_id: item.userId,
            name: item.name,
            gender: item.gender || 'O', 
            birth_date: item.birthDate, 
            phone_number: item.phoneNumber,
            address: {
                state: item.address?.state || '',
                city: item.address?.city || '',
                address1: item.address?.road_name || '',
                address2: item.address?.detail || '',
            },
            vulnerabilities: { 
              summary: item.memo || '특이사항 없음',
              risk_list: [],
              desire_list: []
            }, 
        }));
        setAllVulnerableIndividuals(transformedVulnerable);
        setFilteredDisplayIndividuals(transformedVulnerable);

        const questionsData = await fetchFromApi("/question/list");
        setAllQuestionSets(questionsData || []);

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setAllVulnerableIndividuals(mockVulnerableIndividuals)
        setAllQuestionSets(mockQuestionSets)
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    const adminId = "admin123"; // Using a mock adminId
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"}/call/sse/${adminId}`
    eventSourceRef.current = new EventSource(url)

    eventSourceRef.current.addEventListener("statusUpdate", (event) => {
      const statusUpdate = JSON.parse(event.data) as ConsultationStatusDto;
      setLiveStatuses((prev) => {
        const existing = prev[statusUpdate.vulnerableId] || {}
        return {
        ...prev,
        [statusUpdate.vulnerableId]: {
          ...existing,
          v_id: statusUpdate.vulnerableId,
          v_name: statusUpdate.vulnerableName,
          q_title: statusUpdate.questionSetTitle,
          status: statusUpdate.status.toLowerCase() as "waiting" | "in-progress" | "completed" | "failed",
          error_message: statusUpdate.errorMessage,
        },
      }
    });
    });

    eventSourceRef.current.onerror = (err) => {
      console.error("EventSource failed:", err)
      eventSourceRef.current?.close()
    }

    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

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
      alert("상담 대상자와 질문 세트를 선택해주세요.")
      return
    }

    const questionSet = allQuestionSets.find(qs => qs.id === selectedQuestionSetId)
    if (!questionSet) {
        alert("선택한 질문 세트를 찾을 수 없습니다.")
        return
    }

    const newStatuses: Record<string, ConsultationQueueItem> = {}
    selectedIndividualsForConsultation.forEach(vId => {
        const individual = allVulnerableIndividuals.find(p => p.user_id === vId)
        if (individual) {
            newStatuses[vId] = {
                v_id: individual.user_id,
                v_name: individual.name,
                q_id: questionSet.id,
                q_title: questionSet.title,
                status: 'waiting',
            }
        }
    })
    setLiveStatuses(prev => ({ ...prev, ...newStatuses }))

    try {
      await fetchFromApi('/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerableIds: Array.from(selectedIndividualsForConsultation),
          questionSetId: selectedQuestionSetId,
          adminId: 'admin123', // Mock adminId
        }),
      });
      alert(`[API] ${selectedIndividualsForConsultation.size}명에 대한 상담 시작 요청을 보냈습니다.`);
    } catch (error) {
       console.error("Failed to start consultation:", error)
       alert("상담 시작 요청에 실패했습니다. 콘솔을 확인해주세요.")
    }

    setSelectedIndividualsForConsultation(new Set())
    setSelectedQuestionSetId("")
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setFilteredDisplayIndividuals([])
    setStagedForSelection(new Set())
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
            <div className="p-4 border rounded-md space-y-4 bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="filterName">이름</Label>
                  <Input id="filterName" name="name" value={filters.name} onChange={handleFilterChange} placeholder="홍길동" />
                </div>
                <div>
                  <Label htmlFor="filterMinAge">최소 나이</Label>
                  <Input id="filterMinAge" name="minAge" type="number" value={filters.minAge} onChange={handleFilterChange} placeholder="30" />
                </div>
                <div>
                  <Label htmlFor="filterMaxAge">최대 나이</Label>
                  <Input id="filterMaxAge" name="maxAge" type="number" value={filters.maxAge} onChange={handleFilterChange} placeholder="65" />
                </div>
                <div>
                  <Label htmlFor="gender">성별</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={filters.gender}
                    onChange={(e) => handleGenderFilterChange(e.target.value as "" | "M" | "F" | "O")}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">모두</option>
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                    <option value="O">기타</option>
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <Label htmlFor="filterRegion">지역</Label>
                  <Input id="filterRegion" name="region" value={filters.region} onChange={handleFilterChange} placeholder="서울특별시 강남구" />
                </div>
                <div className="lg:col-span-3">
                    <Label htmlFor="filterRiskKeywords">위기 키워드 (쉼표로 구분)</Label>
                    <Input id="filterRiskKeywords" name="riskKeywords" value={filters.riskKeywords} onChange={handleFilterChange} placeholder="월세, 실직, 질병..." />
                </div>
                <div className="lg:col-span-3">
                    <Label htmlFor="filterDesireKeywords">욕구 키워드 (쉼표로 구분)</Label>
                    <Input id="filterDesireKeywords" name="desireKeywords" value={filters.desireKeywords} onChange={handleFilterChange} placeholder="일자리, 건강, 돌봄..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={clearFilters}><FilterX className="mr-2 h-4 w-4" /> 초기화</Button>
                <Button onClick={applyFilters}><Search className="mr-2 h-4 w-4" /> 검색</Button>
              </div>
            </div>
          )}
          
          {filteredDisplayIndividuals.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">검색 결과 ({filteredDisplayIndividuals.length}명)</h3>
                <Button onClick={addStagedToConsultationList} disabled={stagedForSelection.size === 0}>
                  <UserPlus className="mr-2 h-4 w-4" /> {stagedForSelection.size}명 상담 목록에 추가
                </Button>
              </div>
              <ScrollArea className="h-72 rounded-md border">
                <div className="p-4">
                    <div className="flex items-center py-2 px-2">
                        <Checkbox id="selectAllStaged" onCheckedChange={(checked) => handleStageSelectAll(Boolean(checked))} checked={stagedForSelection.size > 0 && stagedForSelection.size === filteredDisplayIndividuals.length}/>
                        <label htmlFor="selectAllStaged" className="ml-2 text-sm font-medium">전체 선택</label>
                    </div>
                    {filteredDisplayIndividuals.map((p) => (
                        <div key={p.user_id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <Checkbox id={`select-${p.user_id}`} onCheckedChange={(checked) => handleStageItemSelect(p.user_id, Boolean(checked))} checked={stagedForSelection.has(p.user_id)} />
                                <div>
                                    <Label htmlFor={`select-${p.user_id}`} className="font-semibold">{p.name}</Label>
                                    <p className="text-xs text-muted-foreground">{p.phone_number} &bull; {p.address.city}, {p.address.state}</p>
                                </div>
                            </div>
                            <Badge variant="outline">{calculateAge(p.birth_date)}세 / {p.gender}</Badge>
                        </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
            <CardTitle>상담 진행 목록 ({selectedIndividualsForConsultation.size}명)</CardTitle>
            <CardDescription>상담을 진행할 대상자 및 질문지 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <ScrollArea className="h-60">
                {selectedIndividualsForConsultation.size > 0 ? (
                    Array.from(selectedIndividualsForConsultation)
                        .filter(userId => allVulnerableIndividuals.some(p => p.user_id === userId))
                        .map(userId => {
                            const individual = allVulnerableIndividuals.find(p => p.user_id === userId);
                            return (
                                <div key={userId} className="flex items-center justify-between p-2 border-b">
                                    <div>
                                        <p className="font-medium">{individual?.name}</p>
                                        <p className="text-sm text-muted-foreground">{individual?.phone_number}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeIndividualFromConsultation(userId)}>
                                        제외
                                    </Button>
                                </div>
                            );
                        })
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">상담 대상자를 추가해주세요.</p>
                    </div>
                )}
              </ScrollArea>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="questionSet">질문 세트 선택</Label>
                <Select onValueChange={setSelectedQuestionSetId} value={selectedQuestionSetId}>
                    <SelectTrigger id="questionSet">
                        <SelectValue placeholder="상담에 사용할 질문 세트를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                        {allQuestionSets.map(qs => (
                            <SelectItem key={qs.id} value={qs.id}>
                                {qs.title} (v{qs.version})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStartConsultation} disabled={selectedIndividualsForConsultation.size === 0 || !selectedQuestionSetId}>
                <PhoneOutgoing className="mr-2 h-4 w-4" />
                상담 시작하기
              </Button>
          </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>실시간 상담 현황</CardTitle>
            <CardDescription>현재 진행중인 상담 상태입니다.</CardDescription>
        </CardHeader>
        <CardContent>
            {Object.keys(liveStatuses).length === 0 ? (
                <p className="text-sm text-muted-foreground">실시간 상담 현황이 없습니다.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>대상자</TableHead>
                            <TableHead>질문 세트</TableHead>
                            <TableHead>상태</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.values(liveStatuses).map(status => (
                            <TableRow key={status.v_id}>
                                <TableCell>{status.v_name}</TableCell>
                                <TableCell>{status.q_title}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        status.status === 'completed' ? 'success' :
                                        status.status === 'in-progress' ? 'default' :
                                        status.status === 'failed' ? 'destructive' : 'secondary'
                                    }>
                                        {status.status}
                                    </Badge>
                                    {status.error_message && <p className="text-xs text-red-600 mt-1">{status.error_message}</p>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

    </div>
  )
} 