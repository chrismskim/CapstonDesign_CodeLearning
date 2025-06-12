"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/dashboard")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <LogIn className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-2xl">관리자 로그인</CardTitle>
          <CardDescription>시스템에 접근하려면 로그인하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">사용자 ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="아이디를 입력하세요"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-center gap-4">
            <Button type="submit" className="w-full mb-2">
              로그인
            </Button>
            <Link href="/register" className="text-sm text-primary hover:underline">
              계정이 없으신가요? 회원가입
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
