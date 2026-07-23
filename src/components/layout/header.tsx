"use client";

import { useTheme } from "next-themes";
import { Menu, Moon, Sun, Bell, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGreeting } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export function Header({ onMenuClick, userName = "User" }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <h1 className="text-slate-900 font-semibold dark:text-white">
          {getGreeting()}, {userName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => router.push("/notifications")}>
          <Bell className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
