"use client";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) return <DashboardSkeleton />;
  if (!user) return null;

  return <AppLayout userName={user.name}>{children}</AppLayout>;
}
