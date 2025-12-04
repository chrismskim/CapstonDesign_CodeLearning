"use client"

import * as React from "react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, ArrowLeft, Phone } from "lucide-react"
import { registerAccount } from "@/libs/api"

export default function RegisterPage() {
  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validate = () => {
    const e: Record<string, string> = {}
    const trimmedId = userId.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phoneNumber.trim()

    if (!trimmedId) e.userId = "사용자 ID를 입력하세요."
    else if (trimmedId.length < 5 || trimmedId.length > 20) e.userId = "사용자 ID는 5~20자입니다."

    if (!trimmedEmail) e.email = "이메일을 입력하세요."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) e.email = "유효한 이메일을 입력하세요."

    if (!trimmedPhone) e.phoneNumber = "전화번호를 입력하세요."
    else {
      const digits = trimmedPhone.replace(/\D/g, "")
      if (!(digits.length === 10 || digits.length === 11)) e.phoneNumber = "유효한 전화번호(10~11자리)를 입력하세요."
    }

    if (!password) e.password = "비밀번호를 입력하세요."
    else if (password.length < 8) e.password = "비밀번호는 최소 8자 이상이어야 합니다."

    if (confirmPassword !== password) e.confirmPassword = "비밀번호가 일치하지 않습니다."

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const formatPhone = (input: string) => {
    const d = input.replace(/\D/g, "")
    if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
    if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
    return input
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!validate()) return

    setLoading(true)
    try {
      await registerAccount({
        userId: userId.trim(),
        password,
        email: email.trim(),
        phoneNumber: formatPhone(phoneNumber),
      })

      alert("회원가입 요청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.")
      router.push("/login")
    } catch (err: any) {
      const msg = err?.message || "가입 중 오류가 발생했습니다. 다시 시도하세요."
      if (msg.includes("user_id") || msg.includes("아이디")) {
        setErrors({ userId: msg })
      } else if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg })
      } else {
        setErrors({ submit: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <UserPlus className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>새로운 관리자 계정을 생성합니다. 승인이 필요합니다.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister} noValidate>
          <CardContent className="space-y-4">
            {/* 사용자 ID */}
            <div className="space-y-2">
              <Label htmlFor="userId">사용자 ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="사용할 ID를 입력하세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                aria-invalid={!!errors.userId}
                aria-describedby={errors.userId ? "userId-error" : undefined}
              />
              {errors.userId && <p id="userId-error" className="text-sm text-destructive">{errors.userId}</p>}
            </div>

            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* 전화번호 */}
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
                  aria-invalid={!!errors.phoneNumber}
                  aria-describedby={errors.phoneNumber ? "phone-error" : undefined}
                />
              </div>
              {errors.phoneNumber && <p id="phone-error" className="text-sm text-destructive">{errors.phoneNumber}</p>}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && <p id="password-error" className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
              />
              {errors.confirmPassword && <p id="confirm-error" className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
          </CardContent>

          <CardFooter className="flex-col items-center gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "처리 중..." : "가입 요청"}
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
