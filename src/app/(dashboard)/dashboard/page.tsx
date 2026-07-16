"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Target,
  Flame,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,

} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency, formatDate, getGreeting, getCategoryLabel, getCategoryColor } from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import type { DashboardData } from "@/types";

function isExpenseTx(tx: { category: string; paymentMethod?: string | null; isRecurring?: boolean }): boolean {
  return "paymentMethod" in tx;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full rounded-xl" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-xl" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  gradient: string;
  iconBg: string;
}

function StatCard({ icon, label, value, change, changeType, gradient, iconBg }: StatCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
        <div className={cn("absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity", gradient)} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
              {change && (
                <div className="flex items-center gap-1">
                  {changeType === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : changeType === "down" ? (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                  ) : null}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      changeType === "up" && "text-emerald-600",
                      changeType === "down" && "text-red-600",
                      changeType === "neutral" && "text-slate-500"
                    )}
                  >
                    {change}
                  </span>
                </div>
              )}
            </div>
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBg)}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MiniStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
}

function MiniStatCard({ icon, label, value, iconBg }: MiniStatCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
              <p className="text-lg font-bold tracking-tight text-white truncate">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function AreaChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function BarChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: idx === 0 ? "#22C55E" : "#DC2626" }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function CustomPieLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-slate-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
              <Activity className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Unable to load dashboard</h3>
              <p className="text-sm text-slate-500 mt-1">{error || "No data available"}</p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ duration: 0.5 }}>
          <h1 className="text-white md:text-3xl font-bold text-slate-900 tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Here&apos;s your financial overview for today
          </p>
        </motion.div>

        {/* Top Row: Primary Stat Cards */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <StatCard
            icon={<CreditCard className="h-5 w-5 text-red-500" />}
            label="Today's Expense"
            value={formatCurrency(data.todayExpense)}
            change={data.todayExpense > data.avgDailySpending ? "Above avg" : "Below avg"}
            changeType={data.todayExpense > data.avgDailySpending ? "up" : "down"}
            gradient="bg-gradient-to-br from-red-400 to-red-500"
            iconBg="bg-red-50"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="Today's Income"
            value={formatCurrency(data.todayIncome)}
            change={data.todayIncome > 0 ? "Earned today" : "No income yet"}
            changeType={data.todayIncome > 0 ? "up" : "neutral"}
            gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
            iconBg="bg-emerald-100"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5 text-indigo-500" />}
            label="Wallet Balance"
            value={formatCurrency(data.walletBalance)}
            change={`${data.netSavingsPercent >= 0 ? "+" : ""}${data.netSavingsPercent.toFixed(1)}% savings rate`}
            changeType={data.netSavingsPercent >= 0 ? "up" : "down"}
            gradient="bg-gradient-to-br from-indigo-400 to-indigo-500"
            iconBg="bg-indigo-100"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
            label="Monthly Savings"
            value={formatCurrency(data.savings)}
            change={data.savings >= 0 ? "On track" : "Over budget"}
            changeType={data.savings >= 0 ? "up" : "down"}
            gradient="bg-gradient-to-br from-blue-400 to-cyan-500"
            iconBg="bg-blue-100"
          />
        </motion.div>

        {/* Second Row: Secondary Stat Cards */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <MiniStatCard
            icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
            label="Avg Daily Spending"
            value={formatCurrency(data.avgDailySpending)}
            iconBg="bg-rose-100"
          />
          <MiniStatCard
            icon={<Target className="h-5 w-5 text-amber-600" />}
            label="Predicted Month End"
            value={formatCurrency(data.predictedMonthEnd)}
            iconBg="bg-amber-100"
          />
          <MiniStatCard
            icon={<Activity className="h-5 w-5 text-indigo-600" />}
            label="Financial Health"
            value={`${data.financialHealthScore}/100`}
            iconBg="bg-indigo-100"
          />
          <MiniStatCard
            icon={<Flame className="h-5 w-5 text-orange-600" />}
            label="Daily Streak"
            value={`${data.dailyStreak} days`}
            iconBg="bg-orange-100"
          />
        </motion.div>

        {/* Financial Health Score Progress */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.4, duration: 0.5 }}>
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Financial Health Score</h3>
                  <p className="text-xs text-slate-500">
                    {data.financialHealthScore >= 80
                      ? "Excellent! Keep it up"
                      : data.financialHealthScore >= 60
                        ? "Good, but room to improve"
                        : "Needs attention"}
                  </p>
                </div>
                <Badge
                  variant={data.financialHealthScore >= 80 ? "success" : data.financialHealthScore >= 60 ? "default" : "warning"}
                >
                  {data.financialHealthScore >= 80 ? "Excellent" : data.financialHealthScore >= 60 ? "Good" : "Fair"}
                </Badge>
              </div>
              <Progress value={data.financialHealthScore} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Usage */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.45, duration: 0.5 }}>
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Monthly Budget Usage</h3>
                  <p className="text-xs text-slate-500">
                    {data.highestCategory ? `Highest spending: ${getCategoryLabel(data.highestCategory)}` : "No expenses recorded"}
                  </p>
                </div>
                <span className="text-lg font-bold text-slate-900">{data.budgetUsage.toFixed(0)}%</span>
              </div>
              <Progress value={data.budgetUsage} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row: Expense Trend + Category Breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Expense Trend Area Chart */}
          <motion.div
            className="lg:col-span-2"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Expense Trend</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    This Month
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {data.expenseTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.expenseTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<AreaChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#DC2626"
                        strokeWidth={2.5}
                        fill="url(#expenseGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "#DC2626", fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                    No expense data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown Pie Chart */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {data.categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.categoryBreakdown}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {data.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend content={<CustomPieLegend />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.7, duration: 0.5 }}>
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Monthly Comparison</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-500">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-xs text-slate-500">Expense</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {data.monthlyComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.monthlyComparison} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<BarChartTooltip />} />
                    <Bar dataKey="income" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={20} name="Income" />
                    <Bar dataKey="expense" fill="#DC2626" radius={[6, 6, 0, 0]} barSize={20} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  No comparison data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.8, duration: 0.5 }}>
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                <Badge variant="secondary">
                  {data.recentTransactions.length} transaction{data.recentTransactions.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {data.recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                        <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment</th>
                        <th className="pb-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence>
                        {data.recentTransactions.slice(0, 8).map((tx, idx) => (
                          <motion.tr
                            key={tx.id}
                            className="group hover:bg-slate-50/50 transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * idx }}
                          >
                            <td className="py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: getCategoryColor(tx.category) }}
                                >
                                  {getCategoryLabel(tx.category).charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-900">
                                  {getCategoryLabel(tx.category)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className="text-sm text-slate-600 truncate max-w-[200px] block">
                                {tx.description || "—"}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className="text-sm text-slate-500">{formatDate(tx.date)}</span>
                            </td>
                            <td className="py-3.5">
                              <Badge variant="outline" className="text-xs font-normal">
                                {"paymentMethod" in tx ? (tx.paymentMethod || "—") : "—"}
                              </Badge>
                            </td>
                            <td className="py-3.5 text-right">
                              <span className={cn(
                                "text-sm font-semibold",
                                isExpenseTx(tx) ? "text-slate-900" : "text-emerald-600"
                              )}>
                                {isExpenseTx(tx) ? "-" : "+"}{formatCurrency(tx.amount)}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                  No recent transactions
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Bills */}
        {data.upcomingBills.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.9, duration: 0.5 }}>
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Upcoming Bills</CardTitle>
                  <Badge variant="warning">
                    {data.upcomingBills.length} due
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.upcomingBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                          <CreditCard className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{bill.name}</p>
                          <p className="text-xs text-slate-500">Due {formatDate(bill.nextRenewal)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(bill.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Floating Quick Add Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-110 transition-all duration-300"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
