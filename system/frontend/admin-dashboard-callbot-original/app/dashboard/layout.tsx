"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import {
  Users,
  MessageSquarePlus,
  ListChecks,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  PhoneCall,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getCurrentUser, logoutUser } from "@/lib/auth-utils" // Import getCurrentUser and logoutUser
import type { Account } from "@/types"

const baseNavItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/dashboard/vulnerable", label: "취약 계층", icon: Users },
  { href: "/dashboard/questions", label: "질문 관리", icon: MessageSquarePlus },
  { href: "/dashboard/consultations", label: "상담 시작", icon: PhoneCall },
  { href: "/dashboard/history", label: "상담 이력", icon: ListChecks },
  { href: "/dashboard/statistics", label: "통계", icon: BarChart3 },
  { href: "/dashboard/account", label: "계정 설정", icon: Settings },
]

const rootAdminNavItem = {
  href: "/dashboard/admin/approvals",
  label: "가입 승인",
  icon: UserCheck,
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<Account | null>(null)

  React.useEffect(() => {
    const user = getCurrentUser()
    if (!user || !user.isLoggedIn || user.status !== "approved") {
      logoutUser() // Clear any partial login state
      router.push("/login")
    } else {
      setCurrentUser(user)
    }
  }, [router, pathname]) // Re-check on pathname change if needed, or just once

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
  }

  const navItems = React.useMemo(() => {
    if (currentUser?.is_root_admin) {
      // Insert approvals link before '계정 설정' or at a specific position
      const settingsIndex = baseNavItems.findIndex((item) => item.href === "/dashboard/account")
      if (settingsIndex !== -1) {
        const newNavItems = [...baseNavItems]
        newNavItems.splice(settingsIndex, 0, rootAdminNavItem)
        return newNavItems
      }
      return [...baseNavItems, rootAdminNavItem] // Fallback if settings not found
    }
    return baseNavItems
  }, [currentUser])

  if (!currentUser) {
    // Still loading user or redirecting, can show a loader
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading user data...</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-10 flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-60" : "w-16",
          )}
        >
          <div className="flex h-16 items-center border-b px-4 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <MessageSquarePlus className="h-6 w-6 text-primary" />
              {isSidebarOpen && <span className="">콜봇 관리자</span>}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="sr-only">{isSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}</span>
            </Button>
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <div className="grid items-start gap-1 px-2">
              {navItems.map((item) => (
                <Tooltip key={item.label} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className={cn("w-full justify-start", !isSidebarOpen && "justify-center")}
                      >
                        <item.icon className={cn("h-5 w-5", isSidebarOpen && "mr-2")} />
                        {isSidebarOpen ? item.label : <span className="sr-only">{item.label}</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {!isSidebarOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
                </Tooltip>
              ))}
            </div>
          </nav>
          <div className="mt-auto border-t p-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start", !isSidebarOpen && "justify-center")}
                  onClick={handleLogout}
                >
                  <LogOut className={cn("h-5 w-5", isSidebarOpen && "mr-2")} />
                  {isSidebarOpen ? "로그아웃" : <span className="sr-only">로그아웃</span>}
                </Button>
              </TooltipTrigger>
              {!isSidebarOpen && <TooltipContent side="right">로그아웃</TooltipContent>}
            </Tooltip>
          </div>
        </aside>
        <div
          className={cn(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out",
            isSidebarOpen ? "ml-60" : "ml-16",
          )}
        >
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
