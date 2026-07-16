"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, getCategoryColor, getCategoryLabel } from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  iconBg: string;
}

function StatCard({ icon, label, value, gradient, iconBg }: StatCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group dark:bg-slate-800">
        <div className={cn("absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity", gradient)} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
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

function ChartTooltipContent({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-xl dark:text-slate-100">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: entry.color || "#1f2937" }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltipContent({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{payload[0].name}</p>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function CustomPieLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-slate-600 dark:text-slate-300">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-12 w-80 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="dark:bg-slate-800">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DashboardData {
  todayExpense: number;
  todayIncome: number;
  walletBalance: number;
  monthExpense: number;
  monthIncome: number;
  savings: number;
  netSavingsPercent: number;
  avgDailySpending: number;
  predictedMonthEnd: number;
  budgetUsage: number;
  highestCategory: string;
  recentTransactions: unknown[];
  upcomingBills: unknown[];
  expenseTrend: { date: string; amount: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  monthlyComparison: { month: string; income: number; expense: number }[];
  financialHealthScore: number;
  dailyStreak: number;
}

interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  date: string;
}

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [incomes, setIncomes] = useState<{ amount: number; date: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

        const [dashRes, expRes, incRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch(`/api/expenses?startDate=${yearAgo.toISOString()}`),
          fetch(`/api/income?startDate=${sixMonthsAgo.toISOString()}`),
        ]);

        if (dashRes.ok) setDashboardData(await dashRes.json());
        if (expRes.ok) setExpenses(await expRes.json());
        if (incRes.ok) setIncomes(await incRes.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalIncome = useMemo(
    () => incomes.reduce((s, i) => s + i.amount, 0),
    [incomes]
  );
  const totalExpense = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({
        name: getCategoryLabel(name),
        value,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const expenseTrend = useMemo(() => {
    const now = new Date();
    const days = period === "daily" ? 30 : period === "weekly" ? 90 : period === "yearly" ? 365 : 30;
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key =
        period === "yearly"
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          : d.toISOString().split("T")[0];
      map[key] = (map[key] || 0) + e.amount;
    });

    const result: { date: string; amount: number }[] = [];
    if (period === "yearly") {
      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        result.push({ date: key, amount: map[key] || 0 });
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        result.push({ date: key, amount: map[key] || 0 });
      }
    }
    return result;
  }, [expenses, period]);

  const savingsTrend = useMemo(() => {
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};
    incomes.forEach((i) => {
      const key = new Date(i.date).toISOString().split("T")[0];
      incomeMap[key] = (incomeMap[key] || 0) + i.amount;
    });
    expenses.forEach((e) => {
      const key = new Date(e.date).toISOString().split("T")[0];
      expenseMap[key] = (expenseMap[key] || 0) + e.amount;
    });

    const now = new Date();
    const days = 90;
    let cumulative = 0;
    const result: { date: string; savings: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayIncome = incomeMap[key] || 0;
      const dayExpense = expenseMap[key] || 0;
      cumulative += dayIncome - dayExpense;
      result.push({
        date: key,
        savings: cumulative,
      });
    }
    return result;
  }, [expenses, incomes]);

  const cashFlowData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    incomes.forEach((i) => {
      const key = new Date(i.date).toISOString().split("T")[0];
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key].income += i.amount;
    });
    expenses.forEach((e) => {
      const key = new Date(e.date).toISOString().split("T")[0];
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key].expense += e.amount;
    });

    const now = new Date();
    let cumulative = 0;
    const result: { date: string; cashFlow: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const day = map[key] || { income: 0, expense: 0 };
      cumulative += day.income - day.expense;
      result.push({ date: key, cashFlow: cumulative });
    }
    return result;
  }, [expenses, incomes]);

  const categoryComparison = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const key = e.category;
      map[key] = (map[key] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: getCategoryLabel(cat),
        amount,
        color: getCategoryColor(cat),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [expenses]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
            Deep dive into your financial data and trends
          </p>
        </motion.div>

        {/* Period Tabs */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }}>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <TabsTrigger value="daily" className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="yearly" className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Yearly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="Total Income"
            value={formatCurrency(totalIncome)}
            gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
            iconBg="bg-emerald-100"
          />
          <StatCard
            icon={<TrendingDown className="h-5 w-5 text-red-500" />}
            label="Total Expense"
            value={formatCurrency(totalExpense)}
            gradient="bg-gradient-to-br from-red-400 to-red-500"
            iconBg="bg-red-50"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5 text-purple-500" />}
            label="Net Savings"
            value={formatCurrency(netSavings)}
            gradient="bg-gradient-to-br from-purple-400 to-purple-500"
            iconBg="bg-purple-100"
          />
          <StatCard
            icon={<PiggyBank className="h-5 w-5 text-blue-600" />}
            label="Savings Rate"
            value={`${savingsRate}%`}
            gradient="bg-gradient-to-br from-blue-400 to-cyan-500"
            iconBg="bg-blue-100"
          />
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Income vs Expense Bar Chart */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full dark:bg-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Income vs Expense</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Expense</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {dashboardData?.monthlyComparison && dashboardData.monthlyComparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.monthlyComparison} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="income" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={20} name="Income" />
                      <Bar dataKey="expense" fill="#DC2626" radius={[6, 6, 0, 0]} barSize={20} name="Expense" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                    No comparison data available
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
            transition={{ delay: 0.35 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltipContent />} />
                      <Legend content={<CustomPieLegend />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Expense Trend Area Chart */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full dark:bg-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Expense Trend</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {expenseTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={expenseTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="expenseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#DC2626" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(v) => {
                          const d = new Date(v);
                          return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#DC2626"
                        strokeWidth={2.5}
                        fill="url(#expenseAreaGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "#DC2626", fill: "#fff" }}
                        name="Expense"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                    No expense data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Savings Trend Line Chart */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.45 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Savings Trend</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {savingsTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={savingsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(v) => {
                          const d = new Date(v);
                          return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="savings"
                        stroke="#7C3AED"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "#7C3AED", fill: "#fff" }}
                        name="Cumulative Savings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                    No savings data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Cash Flow Area Chart */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Cash Flow</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {cashFlowData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cashFlowData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(v) => {
                          const d = new Date(v);
                          return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cashFlow"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        fill="url(#cashFlowGradient)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "#2563EB", fill: "#fff" }}
                        name="Cash Flow"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                    No cash flow data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Comparison Bar Chart */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.55 }}
          >
            <Card className="border-0 shadow-md overflow-hidden h-full dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Category Comparison</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {categoryComparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={categoryComparison}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip
                        content={<ChartTooltipContent />}
                      />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18} name="Amount">
                        {categoryComparison.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
