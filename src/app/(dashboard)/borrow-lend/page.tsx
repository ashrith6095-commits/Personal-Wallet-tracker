"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  HandCoins,
  Plus,
  Search,
  Calendar,
  User,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  borrowLendSchema,
  type BorrowLendInput,
} from "@/lib/validations";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import type { BorrowLend } from "@/types";

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-md dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-md dark:bg-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  gradient,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  iconBg: string;
}) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group dark:bg-slate-900">
        <div className={cn("absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity", gradient)} />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
            </div>
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconBg)}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getStatus(item: BorrowLend) {
  if (item.isSettled) return "settled";
  if (item.dueDate && new Date(item.dueDate) < new Date()) return "overdue";
  return "pending";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "settled":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Settled
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    default:
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

export default function BorrowLendPage() {
  const [items, setItems] = useState<BorrowLend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [settleItem, setSettleItem] = useState<BorrowLend | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BorrowLendInput>({
    resolver: zodResolver(borrowLendSchema),
    defaultValues: {
      type: "LEND",
      personName: "",
      amount: 0,
      dueDate: "",
      notes: "",
      reminder: false,
    },
  });

  const watchType = watch("type");
  const watchReminder = watch("reminder");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/borrow-lend");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function onSubmit(data: BorrowLendInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/borrow-lend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success(`${data.type === "LEND" ? "Lend" : "Borrow"} entry created`);
      setAddOpen(false);
      reset();
      fetchItems();
    } catch {
      toast.error("Failed to create entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSettle() {
    if (!settleItem) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const newSettled = settleItem.settled + amount;
      const isFullySettled = newSettled >= settleItem.amount;
      const res = await fetch(`/api/borrow-lend/${settleItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settleItem,
          settled: newSettled,
          isSettled: isFullySettled,
        }),
      });
      if (!res.ok) throw new Error("Failed to settle");
      toast.success(isFullySettled ? "Fully settled!" : "Partial settlement recorded");
      setSettleItem(null);
      setSettleAmount("");
      fetchItems();
    } catch {
      toast.error("Failed to settle");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/borrow-lend/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Entry deleted");
      fetchItems();
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  const totalGiven = items
    .filter((i) => i.type === "LEND")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalBorrowed = items
    .filter((i) => i.type === "BORROW")
    .reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = items
    .filter((i) => !i.isSettled)
    .reduce((sum, i) => sum + (i.amount - i.settled), 0);

  const filtered = items.filter((i) =>
    i.personName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Borrow & Lend
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track money given to and borrowed from others
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <SummaryCard
          icon={<ArrowUpRight className="h-5 w-5 text-emerald-600" />}
          label="Total Given"
          value={formatCurrency(totalGiven)}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <SummaryCard
          icon={<ArrowDownRight className="h-5 w-5 text-orange-600" />}
          label="Total Borrowed"
          value={formatCurrency(totalBorrowed)}
          gradient="bg-gradient-to-br from-orange-400 to-red-500"
          iconBg="bg-orange-100 dark:bg-orange-900/30"
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5 text-indigo-600" />}
          label="Pending Amount"
          value={formatCurrency(pendingAmount)}
          gradient="bg-gradient-to-br from-indigo-400 to-indigo-600"
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
        />
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by person name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-slate-100 pl-10 pr-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2             focus-visible:ring-indigo-500 focus-visible:border-transparent"
          />
        </div>
      </motion.div>

      {/* Tabs + List */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.3 }}>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lend" className="gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              Money Given
            </TabsTrigger>
            <TabsTrigger value="borrow" className="gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-orange-500" />
              Money Borrowed
            </TabsTrigger>
          </TabsList>

          {(["all", "lend", "borrow"] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-3">
                {filtered
                  .filter((i) =>
                    tab === "all" ? true : tab === "lend" ? i.type === "LEND" : i.type === "BORROW"
                  )
                  .map((item, idx) => {
                    const status = getStatus(item);
                    const remaining = item.amount - item.settled;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * idx }}
                      >
                        <Card
                          className={cn(
                            "border-0 shadow-md hover:shadow-lg transition-all duration-200 dark:bg-slate-900",
                            item.type === "LEND"
                              ? "border-l-4 border-l-emerald-500"
                              : "border-l-4 border-l-orange-500"
                          )}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                                  item.type === "LEND" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-orange-100 dark:bg-orange-900/30"
                                )}
                              >
                                {item.type === "LEND" ? (
                                  <ArrowUpRight className="h-6 w-6 text-emerald-600" />
                                ) : (
                                  <ArrowDownRight className="h-6 w-6 text-orange-600" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {item.personName}
                                  </p>
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {item.type === "LEND" ? "Lent" : "Borrowed"}
                                  </Badge>
                                  {getStatusBadge(status)}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(item.date)}
                                  </span>
                                  {item.dueDate && (
                                    <span className="flex items-center gap-1">
                                      Due: {formatDate(item.dueDate)}
                                    </span>
                                  )}
                                  {!item.isSettled && (
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {formatCurrency(remaining)} remaining
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                                    {item.notes}
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(item.amount)}
                                </p>
                                {item.settled > 0 && !item.isSettled && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Settled: {formatCurrency(item.settled)}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {!item.isSettled && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => {
                                      setSettleItem(item);
                                      setSettleAmount(String(remaining));
                                    }}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Settle
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}

                {filtered.filter((i) =>
                  tab === "all" ? true : tab === "lend" ? i.type === "LEND" : i.type === "BORROW"
                ).length === 0 && (
                  <EmptyState
                    icon={<HandCoins className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
                    title="No entries found"
                    description={
                      tab === "all"
                        ? "Add your first borrow or lend entry to get started"
                        : tab === "lend"
                          ? "No money given records yet"
                          : "No money borrowed records yet"
                    }
                    action={
                      <Button onClick={() => setAddOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Entry
                      </Button>
                    }
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Add Borrow / Lend Entry</DialogTitle>
            <DialogDescription>
              Record money you&apos;ve lent or borrowed
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={watchType === "LEND" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setValue("type", "LEND", { shouldValidate: true })}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Lend
                </Button>
                <Button
                  type="button"
                  variant={watchType === "BORROW" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setValue("type", "BORROW", { shouldValidate: true })}
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Borrow
                </Button>
              </div>
            </div>

            <Input
              label="Person Name"
              placeholder="e.g. John Doe"
              icon={<User className="h-4 w-4" />}
              error={errors.personName?.message}
              {...register("personName")}
            />

            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />

            <Input
              label="Due Date (optional)"
              type="date"
              icon={<Calendar className="h-4 w-4" />}
              error={errors.dueDate?.message}
              {...register("dueDate")}
            />

            <Textarea
              label="Notes (optional)"
              placeholder="Any additional details..."
              error={errors.notes?.message}
              {...register("notes")}
            />

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Set Reminder
              </label>
              <Switch
                checked={watchReminder}
                onCheckedChange={(checked) => setValue("reminder", checked)}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settle Dialog */}
      <Dialog open={!!settleItem} onOpenChange={(open) => { if (!open) { setSettleItem(null); setSettleAmount(""); } }}>
        <DialogContent className="max-w-sm dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Settle Amount</DialogTitle>
            <DialogDescription>
              {settleItem && (
                <>
                  Recording payment from <strong>{settleItem.personName}</strong>.
                  Remaining: {formatCurrency(settleItem.amount - settleItem.settled)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              label="Settlement Amount"
              type="number"
              step="0.01"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSettle} disabled={submitting} variant="success">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
