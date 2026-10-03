"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const { accentClass } = useTheme();

    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-8 w-8 p-0 shrink-0",
    };

    let variantStyles = "";

    switch (variant) {
      case "primary":
        variantStyles = `${accentClass.bg} text-white hover:opacity-95 shadow-xs ${accentClass.ring}`;
        break;
      case "secondary":
        variantStyles =
          "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 focus-visible:ring-slate-400";
        break;
      case "outline":
        variantStyles =
          "border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 focus-visible:ring-slate-400";
        break;
      case "ghost":
        variantStyles =
          "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-slate-400";
        break;
      case "danger":
        variantStyles =
          "bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500 shadow-xs";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles, className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
