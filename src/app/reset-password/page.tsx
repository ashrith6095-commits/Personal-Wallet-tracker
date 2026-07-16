"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Lock, ArrowRight, DollarSign, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ResetPasswordInput = { password: string; confirmPassword: string };

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordInput) {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Failed to reset password");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-slate-800/80">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Reset Password
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Enter your new password
              </p>
            </div>

            {!token ? (
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Invalid or missing reset token. Please request a new reset link.
                </p>
                <Link
                  href="/forgot-password"
                  className="mt-4 inline-block font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
                >
                  Get new reset link
                </Link>
              </div>
            ) : isSuccess ? (
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Password Reset!
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Redirecting you to login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register("password")}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm new password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Reset Password
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <Link
                href="/login"
                className="font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
              >
                Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
