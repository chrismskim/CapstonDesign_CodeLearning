"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn } from "lucide-react"
import { loginUser } from "@/lib/api"
import { saveUserSession } from "@/lib/auth-utils"

export default function LoginPage() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = await loginUser({ userId, password })

      if (data.success) {
        if (data.account.approved) {
          saveUserSession(data.account, data.token)
          router.push("/dashboard")
        } else {
          router.push("/approval-pending")
        }
      } else {
        // API 응답 자체는 성공했으나, 비즈니스 로직 상 실패 (사실상 이 케이스는 적음)
        setError(data.message || "로그인에 실패했습니다.")
      }
    } catch (err: any) {
      setError(err.message || "로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
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
            {error && <p className="text-sm text-center text-red-500">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="userId">사용자 ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="아이디를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-center gap-4">
            <Button type="submit" className="w-full mb-2" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
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
