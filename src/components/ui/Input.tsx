"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, leftIcon, rightIcon, ...props }, ref) => {
    const { accentClass } = useTheme();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full rounded-lg border bg-white dark:bg-[#111726] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-rose-500 focus-visible:ring-rose-500"
                : `border-slate-200 dark:border-slate-800 ${accentClass.ring}`,
              leftIcon ? "pl-9" : "",
              rightIcon ? "pr-9" : "",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-slate-400 dark:text-slate-500 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
