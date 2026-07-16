"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
  }
>(({ className, value, indicatorClassName, ...props }, ref) => {
  const percentage = Math.min(value || 0, 100);
  let colorClass = "bg-indigo-500";
  if (percentage >= 100) colorClass = "bg-red-500";
  else if (percentage >= 80) colorClass = "bg-amber-500";

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClass, indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
