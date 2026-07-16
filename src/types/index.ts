export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  currency: string;
  timezone: string;
  theme: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string | null;
  color?: string | null;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string | null;
  date: string;
  time?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  location?: string | null;
  tags: string[];
  isRecurring: boolean;
  isQuick: boolean;
  walletId: string;
  wallet?: Wallet;
  createdAt: string;
}

export interface Income {
  id: string;
  amount: number;
  category: string;
  description?: string | null;
  date: string;
  notes?: string | null;
  walletId: string;
  wallet?: Wallet;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category?: string | null;
  month: number;
  year: number;
  walletId?: string | null;
}

export interface Goal {
  id: string;
  name: string;
  icon?: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  isCompleted: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  icon?: string | null;
  amount: number;
  billingCycle: string;
  nextRenewal: string;
  isActive: boolean;
  notes?: string | null;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  category?: string | null;
  frequency: string;
  nextDueDate: string;
  lastGenerated?: string | null;
  isActive: boolean;
  walletId: string;
  wallet?: Wallet;
}

export interface BorrowLend {
  id: string;
  type: string;
  personName: string;
  amount: number;
  settled: number;
  date: string;
  dueDate?: string | null;
  notes?: string | null;
  isSettled: boolean;
  reminder: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardData {
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
  recentTransactions: (Expense | Income)[];
  upcomingBills: Subscription[];
  expenseTrend: { date: string; amount: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  monthlyComparison: { month: string; income: number; expense: number }[];
  financialHealthScore: number;
  dailyStreak: number;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  category?: string;
  walletId?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  tag?: string;
  search?: string;
}
