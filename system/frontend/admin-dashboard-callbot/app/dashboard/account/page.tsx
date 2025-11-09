"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { fetchFromApi } from "@/lib/api";

type Me = {
  userId: string;
  email: string;
  phoneNumber?: string;
  approved?: boolean;
  root?: boolean;
};

export default function AccountPage() {
  const router = useRouter();

  const [me, setMe] = React.useState<Me | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingContact, setSavingContact] = React.useState(false);
  const [changingPw, setChangingPw] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const withAuth = React.useCallback(
    async <T,>(cb: () => Promise<T>) => {
      try {
        return await cb();
      } catch (e: any) {
        const msg = (e?.message || "").toLowerCase();
        if (msg.includes("401") || msg.includes("unauthorized")) {
          router.push("/login");
          throw e;
        }
        throw e;
      }
    },
    [router]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const data = await withAuth(() =>
        fetchFromApi("/account/me", {
          method: "GET",
          headers: {},
        })
      );
      setMe(data);
      setEmail(data?.email ?? "");
      setPhone(data?.phoneNumber ?? "");
    } catch (e: any) {
      setError(e?.message ?? "계정 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [withAuth]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function saveContact() {
    setSavingContact(true);
    setError(null);
    setOk(null);
    try {
      await withAuth(() =>
        fetchFromApi("/account/contact", {
          method: "PUT",
          body: JSON.stringify({
            email: email?.trim(),
            phoneNumber: phone?.trim() || null,
          }),
        })
      );
      setOk("연락처 정보가 저장되었습니다.");
      setMe((prev) => (prev ? { ...prev, email, phoneNumber: phone } : prev));
    } catch (e: any) {
      setError(e?.message ?? "연락처 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingContact(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      setError("현재/새 비밀번호를 입력하세요.");
      return;
    }
    if (newPassword.length < 8) {
      setError("새 비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setChangingPw(true);
    setError(null);
    setOk(null);
    try {
      await withAuth(() =>
        fetchFromApi("/account/password", {
          method: "PUT",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        })
      );
      setOk("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message ?? "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">계정 설정</h1>
        <p className="text-muted-foreground">관리자 계정 정보를 확인하고 수정합니다.</p>
      </header>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
          <CardDescription>
            이메일/연락처 수정과 비밀번호 변경을 할 수 있습니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {ok && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {ok}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              불러오는 중…
            </div>
          ) : (
            <>
              {/* 기본 프로필 */}
              <div className="space-y-2">
                <Label htmlFor="userId">사용자 ID</Label>
                <Input id="userId" readOnly value={me?.userId ?? ""} />
              </div>

              {/* 연락처 변경 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="전화번호를 입력하세요."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button onClick={saveContact} disabled={savingContact}>
                  {savingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중…
                    </>
                  ) : (
                    "연락처 저장"
                  )}
                </Button>
              </div>

              <hr className="my-4" />

              {/* 비밀번호 변경 */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">현재 비밀번호</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="현재 비밀번호"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="새 비밀번호 (8자 이상)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="새 비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button variant="secondary" onClick={changePassword} disabled={changingPw}>
                  {changingPw ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      변경 중…
                    </>
                  ) : (
                    "비밀번호 변경"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
