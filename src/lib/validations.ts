import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  walletId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  isQuick: z.boolean().optional(),
});

export const incomeSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  walletId: z.string().optional(),
});

export const walletSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  balance: z.number().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const budgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  walletId: z.string().optional(),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  targetAmount: z.number().positive("Target amount must be positive"),
  deadline: z.string().optional(),
});

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  billingCycle: z.string().min(1, "Billing cycle is required"),
  nextRenewal: z.string().min(1, "Next renewal date is required"),
  notes: z.string().optional(),
});

export const borrowLendSchema = z.object({
  type: z.enum(["BORROW", "LEND"]),
  personName: z.string().min(1, "Person name is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  reminder: z.boolean().optional(),
});

export const recurringSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["EXPENSE", "INCOME"]),
  category: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  nextDueDate: z.string().min(1, "Next due date is required"),
  walletId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type WalletInput = z.infer<typeof walletSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type BorrowLendInput = z.infer<typeof borrowLendSchema>;
export type RecurringInput = z.infer<typeof recurringSchema>;
