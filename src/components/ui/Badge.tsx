"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "accent";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center font-medium rounded-md tracking-tight transition-colors select-none";

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  const variants = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    secondary: "bg-slate-200/70 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200",
    outline: "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400",
    accent: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  };

  return (
    <span className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
