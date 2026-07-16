"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Add Expense", icon: TrendingDown, href: "/expenses", color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  { label: "Add Income", icon: TrendingUp, href: "/income", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { label: "Add Wallet", icon: Wallet, href: "/wallets", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  { label: "Add Budget", icon: DollarSign, href: "/budgets", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { label: "Add Goal", icon: Target, href: "/goals", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
];

export function QuickActionMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  return (
    <div ref={menuRef} className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-16 right-0 mb-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.15 }}
                onClick={() => {
                  close();
                  router.push(action.href);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.bg}`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                {action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          size="icon"
          onClick={() => setOpen((prev) => !prev)}
          className="h-14 w-14 rounded-full shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-110 transition-all duration-300"
          aria-label="Quick actions"
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </motion.span>
        </Button>
      </motion.div>
    </div>
  );
}
