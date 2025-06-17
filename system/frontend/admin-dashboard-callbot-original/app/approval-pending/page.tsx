"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hourglass, ArrowLeft } from "lucide-react"

export default function ApprovalPendingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Hourglass className="w-16 h-16 mx-auto text-yellow-500" />
          <CardTitle className="text-2xl mt-4">승인 대기 중</CardTitle>
          <CardDescription className="mt-2">귀하의 계정은 현재 관리자 승인 대기 중입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            계정이 승인되면 시스템에 로그인할 수 있습니다. <br />
            승인이 지연되는 경우 시스템 관리자에게 문의하시기 바랍니다.
          </p>
        </CardContent>
        <CardContent>
          <Button asChild>
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인 페이지로 돌아가기
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
