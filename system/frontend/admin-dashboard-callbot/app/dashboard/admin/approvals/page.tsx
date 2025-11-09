"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { getPendingAccounts, decideAccount } from "@/lib/api"



type PendingAccount = {
  id: number
  userId: string
  email: string
  phoneNumber?: string
  createdAt?: string
}

export default function AdminApprovalsPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState<string | null>(null) // userId 잠금
  const [error, setError] = React.useState<string | null>(null)
  const [accounts, setAccounts] = React.useState<PendingAccount[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPendingAccounts()
      setAccounts(
        (Array.isArray(data) ? data : []).map((a: any) => ({
          id: a.id,
          userId: a.userId ?? a.id,
          email: a.email,
          phoneNumber: a.phoneNumber,
          createdAt: a.createdAt ?? a.registered_at,
        }))
      )
    } catch (e: any) {
      if (e?.message?.toLowerCase?.().includes("401") || e?.message?.includes("Unauthorized")) {
        router.push("/login")
        return
      }
      setError(e?.message ?? "목록을 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => {
    load()
  }, [load])

  async function onDecide(userId: string, approve: boolean) {
    setSubmitting(userId)
    setError(null)
    try {
      await decideAccount(userId, approve)
      setAccounts(prev => prev.filter(a => a.userId !== userId))
    } catch (e: any) {
      if (e?.message?.toLowerCase?.().includes("401") || e?.message?.includes("Unauthorized")) {
        router.push("/login")
        return
      }
      setError(e?.message ?? "처리 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">관리자 가입 승인</h1>
        <p className="text-muted-foreground">새로운 관리자 계정의 가입 요청을 승인하거나 거절합니다.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>승인 대기 중인 계정</CardTitle>
          <CardDescription>
            {loading
              ? "불러오는 중…"
              : accounts.length > 0
                ? `${accounts.length}개의 계정이 승인을 기다리고 있습니다.`
                : "현재 승인 대기 중인 계정이 없습니다."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              데이터를 불러오는 중입니다…
            </div>
          ) : accounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자 ID</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>요청일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.userId}>
                    <TableCell className="font-medium">{account.userId}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.phoneNumber ?? "-"}</TableCell>
                    <TableCell>
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={submitting === account.userId}
                        onClick={() => onDecide(account.userId, true)}
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        {submitting === account.userId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        승인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={submitting === account.userId}
                        onClick={() => onDecide(account.userId, false)}
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {submitting === account.userId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        거절
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-14 text-muted-foreground">
              <CheckCircle2 className="mx-auto h-12 w-12 mb-4 text-green-500" />
              <p>모든 가입 요청이 처리되었습니다.</p>
              <Button variant="ghost" className="mt-2" onClick={load}>
                새로고침
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
