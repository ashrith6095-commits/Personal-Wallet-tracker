"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  parseISO,
} from "date-fns";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Income {
  id: string;
  amount: number;
  source: string;
  description: string;
  date: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getSpendingIntensity(amount: number, maxAmount: number): string {
  if (maxAmount === 0 || amount === 0) return "";
  const ratio = amount / maxAmount;
  if (ratio > 0.75) return "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300";
  if (ratio > 0.5) return "bg-orange-500/20 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300";
  if (ratio > 0.25) return "bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300";
  if (ratio > 0) return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300";
  return "";
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchData = useCallback(async (month: Date) => {
    setLoading(true);
    try {
      const start = format(startOfMonth(month), "yyyy-MM-dd");
      const end = format(endOfMonth(month), "yyyy-MM-dd");

      const [expRes, incRes] = await Promise.all([
        fetch(`/api/expenses?startDate=${start}&endDate=${end}`),
        fetch(`/api/income?startDate=${start}&endDate=${end}`),
      ]);

      if (expRes.ok) {
        const data = await expRes.json();
        setExpenses(data.expenses ?? data ?? []);
      } else {
        setExpenses([]);
      }

      if (incRes.ok) {
        const data = await incRes.json();
        setIncomes(data.incomes ?? data ?? []);
      } else {
        setIncomes([]);
      }
    } catch {
      setExpenses([]);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentMonth);
  }, [currentMonth, fetchData]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const expensesByDay = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const expense of expenses) {
      const dateKey = expense.date?.split("T")[0] ?? expense.date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(expense);
    }
    return map;
  }, [expenses]);

  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const [dateKey, dayExpenses] of expensesByDay) {
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      map.set(dateKey, total);
    }
    return map;
  }, [expensesByDay]);

  const maxDailySpend = useMemo(() => {
    let max = 0;
    for (const total of dailyTotals.values()) {
      if (total > max) max = total;
    }
    return max;
  }, [dailyTotals]);

  const monthlySummary = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    return {
      totalExpenses,
      totalIncome,
      savings: totalIncome - totalExpenses,
    };
  }, [expenses, incomes]);

  const selectedDayExpenses = useMemo(() => {
    if (!selectedDay) return [];
    const dateKey = format(selectedDay, "yyyy-MM-dd");
    return expensesByDay.get(dateKey) ?? [];
  }, [selectedDay, expensesByDay]);

  const selectedDayTotal = useMemo(() => {
    return selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [selectedDayExpenses]);

  const goToPrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const openDayDetail = (day: Date) => {
    setSelectedDay(day);
    setShowDetail(true);
  };

  const monthLabel = format(currentMonth, "MMMM yyyy");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Track your daily expenses at a glance
          </p>
        </div>
        <Calendar className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-xl font-semibold">{monthLabel}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                <AnimatePresence mode="wait">
                  {calendarDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const inMonth = isSameMonth(day, currentMonth);
                    const todayMark = isToday(day);
                    const dayTotal = dailyTotals.get(dateKey) ?? 0;
                    const intensity = getSpendingIntensity(
                      dayTotal,
                      maxDailySpend
                    );

                    return (
                      <motion.button
                        key={dateKey}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => openDayDetail(day)}
                        className={cn(
                          "relative flex flex-col items-center justify-start p-1.5 sm:p-2 rounded-xl min-h-[4rem] sm:min-h-[5.5rem] transition-all duration-200",
                          inMonth
                            ? "hover:bg-muted/80 cursor-pointer"
                            : "opacity-30 cursor-default",
                          intensity,
                          todayMark &&
                            "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-medium",
                            todayMark &&
                              "text-primary font-bold"
                          )}
                        >
                          {format(day, "d")}
                        </span>

                        {dayTotal > 0 && inMonth && (
                          <span className="mt-1 text-[10px] sm:text-xs font-semibold leading-tight truncate max-w-full">
                            {formatCurrency(dayTotal)}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {expenses.length === 0 && incomes.length === 0 && !loading ? (
        <EmptyState
          icon={<Calendar />}
          title="No data for this month"
          description="Start adding expenses and income to see them on the calendar."
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(monthlySummary.totalExpenses)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(monthlySummary.totalIncome)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p
                  className={cn(
                    "text-2xl font-bold",
                    monthlySummary.savings >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {formatCurrency(monthlySummary.savings)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedDay && format(selectedDay, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {selectedDayExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No expenses recorded for this day.
              </p>
            ) : (
              <>
                {selectedDayExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {expense.description || expense.category}
                      </p>
                      {expense.description && expense.category && (
                        <p className="text-xs text-muted-foreground">
                          {expense.category}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="destructive"
                      className="ml-3 shrink-0"
                    >
                      {formatCurrency(expense.amount)}
                    </Badge>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Total
                  </span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(selectedDayTotal)}
                  </span>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
