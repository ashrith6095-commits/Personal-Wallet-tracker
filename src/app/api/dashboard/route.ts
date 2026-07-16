import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#f97316",
  FUEL: "#3b82f6",
  TRANSPORT: "#06b6d4",
  SHOPPING: "#ec4899",
  MEDICAL: "#ef4444",
  BILLS: "#8b5cf6",
  RENT: "#14b8a6",
  ENTERTAINMENT: "#f43f5e",
  RECHARGE: "#0ea5e9",
  EDUCATION: "#22c55e",
  TRAVEL: "#a855f7",
  INVESTMENT: "#3b82f6",
  GIFT: "#eab308",
  OTHERS: "#94a3b8",
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      todayExpenses, todayIncomes, wallets, monthExpenses, monthIncomes,
      recentExpenses, recentIncomes, expenseTrendData, categoryData,
      monthIncomesForComp, monthExpensesForComp, budgets, subscriptions, expensesForStreak,
    ] = await Promise.all([
      db.expense.findMany({ where: { userId, date: { gte: todayStart, lte: todayEnd } } }),
      db.income.findMany({ where: { userId, date: { gte: todayStart, lte: todayEnd } } }),
      db.wallet.findMany({ where: { userId }, select: { balance: true } }),
      db.expense.findMany({ where: { userId, date: { gte: monthStart, lte: monthEnd } } }),
      db.income.findMany({ where: { userId, date: { gte: monthStart, lte: monthEnd } } }),
      db.expense.findMany({ where: { userId }, include: { wallet: true }, orderBy: { date: "desc" }, take: 10 }),
      db.income.findMany({ where: { userId }, include: { wallet: true }, orderBy: { date: "desc" }, take: 10 }),
      db.expense.findMany({ where: { userId, date: { gte: thirtyDaysAgo } }, select: { amount: true, date: true }, orderBy: { date: "asc" } }),
      db.expense.findMany({ where: { userId, date: { gte: monthStart, lte: monthEnd } }, select: { amount: true, category: true } }),
      db.income.findMany({ where: { userId, date: { gte: sixMonthsAgo } }, select: { amount: true, date: true } }),
      db.expense.findMany({ where: { userId, date: { gte: sixMonthsAgo } }, select: { amount: true, date: true } }),
      db.budget.findMany({ where: { userId, month: now.getMonth() + 1, year: now.getFullYear() }, select: { amount: true } }),
      db.subscription.findMany({ where: { userId, isActive: true }, orderBy: { nextRenewal: "asc" }, take: 6 }),
      db.expense.findMany({ where: { userId }, select: { date: true }, orderBy: { date: "desc" }, take: 60 }),
    ]);

    const todayExpense = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayIncome = todayIncomes.reduce((sum, i) => sum + i.amount, 0);
    const walletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const monthExpense = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
    const savings = monthIncome - monthExpense;
    const netSavingsPercent = monthIncome > 0 ? Math.round((savings / monthIncome) * 100) : 0;
    const avgDailySpending = dayOfMonth > 0 ? monthExpense / dayOfMonth : 0;
    const predictedMonthEnd = avgDailySpending * daysInMonth;

    const recentTransactions = [...recentExpenses, ...recentIncomes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const dailyExpenses: Record<string, number> = {};
    for (const e of expenseTrendData) {
      const dateStr = new Date(e.date).toISOString().split("T")[0];
      dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + e.amount;
    }
    const expenseTrend: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      expenseTrend.push({ date: dateStr, amount: dailyExpenses[dateStr] || 0 });
    }

    const categoryMap: Record<string, number> = {};
    for (const e of categoryData) {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    }
    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name] || "#78909C",
    }));

    const monthlyComparisonMap: Record<string, { income: number; expense: number }> = {};
    for (const i of monthIncomesForComp) {
      const d = new Date(i.date);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!monthlyComparisonMap[key]) monthlyComparisonMap[key] = { income: 0, expense: 0 };
      monthlyComparisonMap[key].income += i.amount;
    }
    for (const e of monthExpensesForComp) {
      const d = new Date(e.date);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!monthlyComparisonMap[key]) monthlyComparisonMap[key] = { income: 0, expense: 0 };
      monthlyComparisonMap[key].expense += e.amount;
    }
    const monthlyComparison = Object.entries(monthlyComparisonMap)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetUsage = totalBudget > 0 ? (monthExpense / totalBudget) * 100 : 0;
    const highestCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    const totalIncome6m = monthIncomesForComp.reduce((s, i) => s + i.amount, 0);
    const totalExpense6m = monthExpensesForComp.reduce((s, e) => s + e.amount, 0);
    const savingsRate6m = totalIncome6m > 0 ? ((totalIncome6m - totalExpense6m) / totalIncome6m) * 100 : 0;
    let financialHealthScore = 50;
    if (savingsRate6m > 20) financialHealthScore += 15;
    else if (savingsRate6m > 10) financialHealthScore += 10;
    else if (savingsRate6m > 0) financialHealthScore += 5;
    if (budgetUsage <= 80) financialHealthScore += 15;
    else if (budgetUsage <= 100) financialHealthScore += 5;
    else financialHealthScore -= 10;
    if (walletBalance > 0) financialHealthScore += 10;
    if (savings > 0) financialHealthScore += 10;
    financialHealthScore = Math.max(0, Math.min(100, financialHealthScore));

    let dailyStreak = 0;
    const todayDateStr = todayStart.toISOString().split("T")[0];
    const expenseDates = new Set(
      expensesForStreak.map((e) => new Date(e.date).toISOString().split("T")[0])
    );
    const streakDate = new Date(now);
    if (!expenseDates.has(todayDateStr)) {
      streakDate.setDate(streakDate.getDate() - 1);
    }
    while (true) {
      const dateStr = streakDate.toISOString().split("T")[0];
      if (expenseDates.has(dateStr)) {
        dailyStreak++;
        streakDate.setDate(streakDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      todayExpense,
      todayIncome,
      walletBalance,
      monthExpense,
      monthIncome,
      savings,
      netSavingsPercent,
      avgDailySpending,
      predictedMonthEnd,
      recentTransactions,
      expenseTrend,
      categoryBreakdown,
      monthlyComparison,
      upcomingBills: subscriptions,
      budgetUsage,
      highestCategory,
      financialHealthScore,
      dailyStreak,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
