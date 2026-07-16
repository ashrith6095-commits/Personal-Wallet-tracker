"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Calendar,
  Target,
  CreditCard,
  ArrowLeftRight,
  Repeat,
  Download,
  Settings,
  TrendingUp,
  DollarSign,
  Bell,
  X,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const toolsNav = [
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/borrow-lend", label: "Borrow & Lend", icon: ArrowLeftRight },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/export", label: "Export", icon: Download },
];

const bottomNav = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive && "text-indigo-500 dark:text-indigo-400")} />
        {label}
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">PurseTrack</span>
          </Link>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {mainNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          <Separator className="my-4" />

          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Tools
          </p>
          <div className="space-y-1">
            {toolsNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <div className="space-y-1">
            {bottomNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
