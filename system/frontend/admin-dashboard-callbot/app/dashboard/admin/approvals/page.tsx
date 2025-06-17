"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle } from "lucide-react"

const DUMMY_ACCOUNTS = [
  {
    id: "newadmin1",
    email: "newadmin1@example.com",
    phoneNumber: "010-1234-5679",
    registered_at: new Date().toISOString(),
  },
  {
    id: "newadmin2",
    email: "newadmin2@example.com",
    phoneNumber: "010-9876-5432",
    registered_at: new Date().toISOString(),
  },
]

export default function AdminApprovalsPage() {
  const handleApprovalAction = () => {
    alert("구현 예정입니다.")
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
            {DUMMY_ACCOUNTS.length > 0
              ? `${DUMMY_ACCOUNTS.length}개의 계정이 승인을 기다리고 있습니다.`
              : "현재 승인 대기 중인 계정이 없습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {DUMMY_ACCOUNTS.length > 0 ? (
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
                {DUMMY_ACCOUNTS.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.id}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.phoneNumber}</TableCell>
                    <TableCell>{new Date(account.registered_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleApprovalAction}
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> 승인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleApprovalAction}
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
