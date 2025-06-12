"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, ArrowLeft, Phone } from "lucide-react"
import { getMockAccounts, saveMockAccounts } from "@/lib/auth-utils"
import type { Account } from "@/types"

export default function RegisterPage() {
  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    const accounts = getMockAccounts()
    if (accounts.find((acc) => acc.id === userId)) {
      alert("이미 사용 중인 사용자 ID입니다.")
      return
    }
    if (accounts.find((acc) => acc.email === email)) {
      alert("이미 사용 중인 이메일입니다.")
      return
    }

    const newAccount: Account = {
      id: userId,
      email,
      phoneNumber,
      password_hash: password, // In a real app, hash this password
      status: "pending_approval",
      is_root_admin: false, // New users are not root admins by default
      registered_at: new Date().toISOString(),
    }

    accounts.push(newAccount)
    saveMockAccounts(accounts)

    alert("회원가입 요청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.")
    router.push("/login")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <UserPlus className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>새로운 관리자 계정을 생성합니다. 승인이 필요합니다.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">사용자 ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="사용할 ID를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">전화번호</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="pl-8"
                />
              </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-center gap-4">
            <Button type="submit" className="w-full">
              가입 요청
            </Button>
            <Button variant="link" asChild className="text-sm text-muted-foreground">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-1" />
                로그인 페이지로 돌아가기
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
