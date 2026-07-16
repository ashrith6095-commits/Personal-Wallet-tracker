import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "₹"): string {
  return `${currency}${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getMonthName(month: number): string {
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return names[month - 1];
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function calculateFinancialHealthScore(data: {
  savingsRate: number;
  budgetUsage: number;
  hasEmergencyFund: boolean;
  incomeVsExpense: number;
}): number {
  let score = 50;
  if (data.savingsRate > 20) score += 15;
  else if (data.savingsRate > 10) score += 10;
  else if (data.savingsRate > 0) score += 5;
  if (data.budgetUsage <= 80) score += 15;
  else if (data.budgetUsage <= 100) score += 5;
  else score -= 10;
  if (data.hasEmergencyFund) score += 10;
  if (data.incomeVsExpense > 0) score += 10;
  return Math.max(0, Math.min(100, score));
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    FOOD: "#f97316",
    FUEL: "#6366f1",
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
  return colors[category] || "#94a3b8";
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    FOOD: "Food & Dining",
    FUEL: "Fuel",
    TRANSPORT: "Transport",
    SHOPPING: "Shopping",
    MEDICAL: "Medical",
    BILLS: "Bills & Utilities",
    RENT: "Rent",
    ENTERTAINMENT: "Entertainment",
    RECHARGE: "Recharge",
    EDUCATION: "Education",
    TRAVEL: "Travel",
    INVESTMENT: "Investment",
    GIFT: "Gift",
    OTHERS: "Others",
    SALARY: "Salary",
    BUSINESS: "Business",
    FREELANCING: "Freelancing",
    REFUND: "Refund",
    INTEREST: "Interest",
  };
  return labels[category] || category;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
