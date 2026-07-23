"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { goalSchema } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  Target,
  Plus,
  Calendar,
  Trophy,
  Pencil,
  Trash2,
  Wallet,
  Coins,
} from "lucide-react";

type Goal = {
  id: string;
  name: string;
  icon?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isCompleted: boolean;
};

type GoalFormData = {
  name: string;
  icon?: string;
  targetAmount: number;
  deadline?: string;
};

function daysRemaining(deadline?: string): number | null {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: "", icon: "", targetAmount: 0, deadline: "" },
  });

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      const data = await res.json();
      setGoals(data);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedCount = goals.filter((g) => g.isCompleted).length;

  function openAddDialog() {
    setEditingGoal(null);
    form.reset({ name: "", icon: "", targetAmount: 0, deadline: "" });
    setGoalDialogOpen(true);
  }

  function openEditDialog(goal: Goal) {
    setEditingGoal(goal);
    form.reset({
      name: goal.name,
      icon: goal.icon ?? "",
      targetAmount: goal.targetAmount,
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : "",
    });
    setGoalDialogOpen(true);
  }

  function openAddMoney(goal: Goal) {
    setSelectedGoal(goal);
    setAddAmount("");
    setAddMoneyDialogOpen(true);
  }

  function openDeleteConfirm(goal: Goal) {
    setSelectedGoal(goal);
    setDeleteDialogOpen(true);
  }

  async function handleGoalSubmit(data: GoalFormData) {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        icon: data.icon || undefined,
        deadline: data.deadline || undefined,
      };

      if (editingGoal) {
        const res = await fetch("/api/goals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingGoal.id, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update goal");
        toast.success("Goal updated");
      } else {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create goal");
        toast.success("Goal created");
      }
      setGoalDialogOpen(false);
      fetchGoals();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddMoney() {
    if (!selectedGoal || !addAmount) return;
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const newAmount = selectedGoal.currentAmount + amount;
      const isCompleted = newAmount >= selectedGoal.targetAmount;
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGoal.id,
          currentAmount: newAmount,
          isCompleted,
        }),
      });
      if (!res.ok) throw new Error("Failed to add money");
      if (isCompleted && !selectedGoal.isCompleted) {
        toast.success(`Congratulations! You reached your "${selectedGoal.name}" goal!`);
      } else {
        toast.success(`Added ${formatCurrency(amount)} to "${selectedGoal.name}"`);
      }
      setAddMoneyDialogOpen(false);
      fetchGoals();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedGoal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/goals?id=${selectedGoal.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      toast.success("Goal deleted");
      setDeleteDialogOpen(false);
      fetchGoals();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track your savings milestones and watch your progress grow.
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Saved
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaved)}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Target
            </CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Goals Completed
            </CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-2.5 w-full rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-28" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-12 w-12" />}
          title="No goals yet"
          description="Set your first financial goal and start tracking your progress."
          action={
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Goal
            </Button>
          }
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.currentAmount / goal.targetAmount) * 100)
            );
            const days = daysRemaining(goal.deadline);

            return (
              <motion.div key={goal.id} variants={staggerItem}>
                <Card
                  className={cn(
                    "group relative overflow-hidden transition-shadow hover:shadow-lg",
                    goal.isCompleted &&
                      "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent"
                  )}
                >
                  {goal.isCompleted && (
                    <div className="absolute right-3 top-3">
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                      >
                        <Trophy className="h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-xl">
                        {goal.icon || "🎯"}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {goal.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {goal.deadline
                            ? (() => {
                                const d = daysRemaining(goal.deadline);
                                if (d === null) return "No deadline";
                                if (d < 0)
                                  return (
                                    <span className="text-destructive">
                                      Overdue by {Math.abs(d)} days
                                    </span>
                                  );
                                if (d === 0) return "Due today";
                                return (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {d} days left
                                  </span>
                                );
                              })()
                            : "No deadline"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={pct}
                        className={cn(
                          "h-2.5",
                          goal.isCompleted && "[&>div]:bg-amber-500"
                        )}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(goal.currentAmount)} /{" "}
                          {formatCurrency(goal.targetAmount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs tabular-nums",
                            pct >= 100 &&
                              "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {pct}%
                        </Badge>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => openAddMoney(goal)}
                        disabled={goal.isCompleted}
                      >
                        <Coins className="h-3.5 w-3.5" />
                        Add Money
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(goal)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => openDeleteConfirm(goal)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add / Edit Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Goal" : "New Goal"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal
                ? "Update your goal details below."
                : "Set a new financial goal to track your savings."}
            </DialogDescription>
          </DialogHeader>

          <form
            id="goal-form"
            onSubmit={form.handleSubmit(handleGoalSubmit)}
            className="space-y-5 py-2"
          >
            <div className="space-y-2">
              <label
                htmlFor="goal-name"
                className="text-sm font-medium leading-none"
              >
                Goal Name
              </label>
              <Input
                id="goal-name"
                placeholder="e.g. Emergency Fund"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="goal-icon"
                className="text-sm font-medium leading-none"
              >
                Icon{" "}
                <span className="text-muted-foreground font-normal">
                  (emoji or leave blank)
                </span>
              </label>
              <Input
                id="goal-icon"
                placeholder="e.g. 🏠"
                {...form.register("icon")}
              />
              {form.formState.errors.icon && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.icon.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="goal-target"
                className="text-sm font-medium leading-none"
              >
                Target Amount
              </label>
              <Input
                id="goal-target"
                type="number"
                step="0.01"
                min="0"
                placeholder="50000"
                {...form.register("targetAmount", { valueAsNumber: true })}
              />
              {form.formState.errors.targetAmount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.targetAmount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="goal-deadline"
                className="text-sm font-medium leading-none"
              >
                Deadline{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                id="goal-deadline"
                type="date"
                {...form.register("deadline")}
              />
              {form.formState.errors.deadline && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.deadline.message}
                </p>
              )}
            </div>
          </form>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="goal-form" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingGoal
                  ? "Save Changes"
                  : "Create Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={addMoneyDialogOpen} onOpenChange={setAddMoneyDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Money</DialogTitle>
            <DialogDescription>
              Add funds to &ldquo;{selectedGoal?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Progress</p>
              <p className="text-lg font-semibold">
                {selectedGoal && formatCurrency(selectedGoal.currentAmount)} /{" "}
                {selectedGoal && formatCurrency(selectedGoal.targetAmount)}
              </p>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="add-amount"
                className="text-sm font-medium leading-none"
              >
                Amount to Add
              </label>
              <Input
                id="add-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMoney();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleAddMoney} disabled={submitting}>
              {submitting ? "Adding..." : "Add Money"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedGoal?.name}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}