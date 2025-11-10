"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const userId = (form.querySelector("#userId") as HTMLInputElement).value;
  const password = (form.querySelector("#password") as HTMLInputElement).value;

  const res = await fetch(
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") + "/api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    }
  );

  if (!res.ok) {
    const msg = (await res.json().catch(() => null))?.message || "로그인 실패";
    alert(msg);
    return;
  }

  const data = await res.json();
  localStorage.setItem("token", data.token);
  location.href = "/dashboard";
};

async function loginApi(userId: string, password: string) {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/+$/,'');
  const url = `${base}/api/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ userId, password }),
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const msg = data?.message || data?.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data as { accessToken: string; refreshToken?: string; isRoot?: boolean; };
}

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { accessToken, refreshToken, isRoot } = await loginApi(userId, password);

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (isRoot !== undefined) localStorage.setItem("isRoot", String(isRoot));

      router.replace("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력하세요"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            {err && <p className="text-red-600 text-sm">{err}</p>}
          </CardContent>

          <CardFooter className="flex-col items-center gap-4">
            <Button type="submit" className="w-full mb-2" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
            <Link href="/register" className="text-sm text-primary hover:underline">
              계정이 없으신가요? 회원가입
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
