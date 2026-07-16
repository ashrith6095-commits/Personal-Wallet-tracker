"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Wallet,
  Banknote,
  Building2,
  Smartphone,
  CreditCard,
  PiggyBank,
  Edit3,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { walletSchema, type WalletInput } from "@/lib/validations";
import { cn, formatCurrency } from "@/lib/utils";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import type { Wallet as WalletType } from "@/types";

const WALLET_TYPES = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "BANK", label: "Bank Account", icon: Building2 },
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
  { value: "DEBIT_CARD", label: "Debit Card", icon: CreditCard },
  { value: "SAVINGS_ACCOUNT", label: "Savings Account", icon: PiggyBank },
] as const;

const WALLET_COLORS = [
  { value: "#8b5cf6", label: "Violet" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#10b981", label: "Emerald" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#ec4899", label: "Pink" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#f97316", label: "Orange" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#6366f1", label: "Indigo" },
];

const TYPE_GRADIENTS: Record<string, string> = {
  CASH: "from-emerald-500 to-teal-500",
  BANK: "from-blue-500 to-indigo-500",
  UPI: "from-violet-500 to-purple-500",
  CREDIT_CARD: "from-rose-500 to-pink-500",
  DEBIT_CARD: "from-amber-500 to-orange-500",
  SAVINGS_ACCOUNT: "from-cyan-500 to-blue-500",
};

const TYPE_ICON_BG: Record<string, string> = {
  CASH: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  BANK: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  UPI: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  CREDIT_CARD: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  DEBIT_CARD: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  SAVINGS_ACCOUNT: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
};

function getWalletIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    CASH: <Banknote className="h-5 w-5" />,
    BANK: <Building2 className="h-5 w-5" />,
    UPI: <Smartphone className="h-5 w-5" />,
    CREDIT_CARD: <CreditCard className="h-5 w-5" />,
    DEBIT_CARD: <CreditCard className="h-5 w-5" />,
    SAVINGS_ACCOUNT: <PiggyBank className="h-5 w-5" />,
  };
  return map[type] || <Wallet className="h-5 w-5" />;
}

function getWalletTypeLabel(type: string) {
  return WALLET_TYPES.find((t) => t.value === type)?.label || type;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<WalletInput>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      type: "CASH",
      balance: 0,
      color: "#8b5cf6",
      isDefault: false,
    },
  });

  const watchType = watch("type");
  const watchColor = watch("color");
  const watchIsDefault = watch("isDefault");

  async function fetchWallets() {
    try {
      const res = await fetch("/api/wallets");
      if (!res.ok) throw new Error("Failed to load wallets");
      const data = await res.json();
      setWallets(data);
    } catch {
      toast.error("Failed to load wallets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWallets();
  }, []);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  function openCreateDialog() {
    setEditingWallet(null);
    reset({ name: "", type: "CASH", balance: 0, color: "#8b5cf6", isDefault: false });
    setDialogOpen(true);
  }

  function openEditDialog(wallet: WalletType) {
    setEditingWallet(wallet);
    reset({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      color: wallet.color || "#8b5cf6",
      isDefault: wallet.isDefault,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: WalletInput) {
    setSaving(true);
    try {
      const url = editingWallet ? `/api/wallets/${editingWallet.id}` : "/api/wallets";
      const method = editingWallet ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save wallet");

      toast.success(editingWallet ? "Wallet updated" : "Wallet created");
      setDialogOpen(false);
      reset();
      setEditingWallet(null);
      await fetchWallets();
    } catch {
      toast.error("Failed to save wallet");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete wallet");
      toast.success("Wallet deleted");
      await fetchWallets();
    } catch {
      toast.error("Failed to delete wallet");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Wallets</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
              Manage your wallets and track balances
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Wallet
          </Button>
        </motion.div>

        {/* Total Balance Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-md">
            <div className="absolute inset-0 bg-indigo-500" />
            <CardContent className="relative p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">Total Balance</p>
                  <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {formatCurrency(totalBalance)}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    Across {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wallet Grid */}
        {wallets.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}>
            <EmptyState
              icon={<Wallet className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
              title="No wallets yet"
              description="Create your first wallet to start tracking your finances"
              action={
                <Button onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Wallet
                </Button>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <AnimatePresence>
              {wallets.map((wallet) => (
                <motion.div key={wallet.id} variants={staggerItem} layout>
                  <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full">
                    {/* Color Accent Stripe */}
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b",
                        TYPE_GRADIENTS[wallet.type] || "from-slate-400 to-slate-500"
                      )}
                      style={
                        wallet.color
                          ? { background: wallet.color }
                          : undefined
                      }
                    />

                    <CardContent className="relative p-5 pl-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl",
                              wallet.color ? "" : TYPE_ICON_BG[wallet.type]
                            )}
                            style={
                              wallet.color
                                ? { backgroundColor: `${wallet.color}15`, color: wallet.color }
                                : undefined
                            }
                          >
                            {getWalletIcon(wallet.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{wallet.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px] font-medium">
                                {getWalletTypeLabel(wallet.type)}
                              </Badge>
                              {wallet.isDefault && (
                                <Badge variant="default" className="text-[10px] font-medium gap-0.5">
                                  <Star className="h-2.5 w-2.5" />
                                  Default
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
                        {formatCurrency(wallet.balance)}
                      </p>

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(wallet)}
                          className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(wallet.id)}
                          disabled={deletingId === wallet.id}
                          className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {deletingId === wallet.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWallet ? "Edit Wallet" : "Create Wallet"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Wallet Name"
              placeholder="e.g. Main Savings"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet Type</label>
              <Select
                value={watchType}
                onValueChange={(val) => setValue("type", val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        {getWalletIcon(t.value)}
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
            </div>

            <Input
              label="Starting Balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.balance?.message}
              {...register("balance", { valueAsNumber: true })}
            />

            {/* Color Picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
              <div className="flex flex-wrap gap-2">
                {WALLET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue("color", c.value, { shouldValidate: true })}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200 hover:scale-110",
                      watchColor === c.value
                        ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110"
                        : ""
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Default Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Set as Default</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Use this wallet by default</p>
              </div>
              <Switch
                checked={watchIsDefault}
                onCheckedChange={(val) => setValue("isDefault", val)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingWallet(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingWallet ? "Save Changes" : "Create Wallet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
