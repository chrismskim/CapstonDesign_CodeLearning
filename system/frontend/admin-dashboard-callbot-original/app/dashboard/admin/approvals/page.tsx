"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react"
import { getMockAccounts, saveMockAccounts, getCurrentUser } from "@/lib/auth-utils"
import type { Account } from "@/types"

export default function AdminApprovalsPage() {
  const router = useRouter()
  const [pendingAccounts, setPendingAccounts] = React.useState<Account[]>([])
  const [currentUser, setCurrentUser] = React.useState<Account | null>(null)

  React.useEffect(() => {
    const user = getCurrentUser()
    if (!user || !user.is_root_admin) {
      // If not a root admin, redirect to dashboard or login
      router.push("/dashboard")
      return
    }
    setCurrentUser(user)
    const allAccounts = getMockAccounts()
    setPendingAccounts(allAccounts.filter((acc) => acc.status === "pending_approval"))
  }, [router])

  const handleApprovalAction = (accountId: string, action: "approve" | "reject") => {
    const allAccounts = getMockAccounts()
    const accountIndex = allAccounts.findIndex((acc) => acc.id === accountId)

    if (accountIndex !== -1) {
      allAccounts[accountIndex].status = action === "approve" ? "approved" : "rejected"
      saveMockAccounts(allAccounts)
      setPendingAccounts(allAccounts.filter((acc) => acc.status === "pending_approval"))
      alert(`계정 ${accountId}이(가) ${action === "approve" ? "승인" : "거절"}되었습니다.`)
    }
  }

  if (!currentUser || !currentUser.is_root_admin) {
    // Should be handled by useEffect redirect, but as a fallback
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">접근 권한 없음</h1>
        <p className="text-muted-foreground">이 페이지는 루트 관리자만 접근할 수 있습니다.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          대시보드로 돌아가기
        </Button>
      </div>
    )
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
            {pendingAccounts.length > 0
              ? `${pendingAccounts.length}개의 계정이 승인을 기다리고 있습니다.`
              : "현재 승인 대기 중인 계정이 없습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAccounts.length > 0 ? (
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
                {pendingAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.id}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.phoneNumber}</TableCell>
                    <TableCell>{new Date(account.registered_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprovalAction(account.id, "approve")}
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> 승인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprovalAction(account.id, "reject")}
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <XCircle className="mr-2 h-4 w-4" /> 거절
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="mx-auto h-12 w-12 mb-4 text-green-500" />
              <p>모든 가입 요청이 처리되었습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
