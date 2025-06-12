"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">계정 설정</h1>
        <p className="text-muted-foreground">관리자 계정 정보를 확인하고 수정합니다.</p>
      </header>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
          <CardDescription>계정 정보를 변경할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">사용자 ID</Label>
            <Input id="userId" readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="이메일을 입력하세요." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="전화번호를 입력하세요."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">현재 비밀번호</Label>
            <Input id="currentPassword" type="password" placeholder="현재 비밀번호" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input id="newPassword" type="password" placeholder="새 비밀번호" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input id="confirmPassword" type="password" placeholder="새 비밀번호 확인" />
          </div>
          <Button onClick={() => alert("구현 예정입니다.")}>정보 변경하기</Button>
        </CardContent>
      </Card>
    </div>
  )
}
