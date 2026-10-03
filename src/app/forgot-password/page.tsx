"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await sendPasswordReset(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setErrorMessage("No account exists with this email address.");
      } else {
        setErrorMessage(err.message || "Failed to send reset link. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 mb-3 group"
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/N%20Emblem.png"
                alt="Note Nest"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Note Nest</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-7 shadow-sm">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Check your inbox
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                We sent a password reset link to <strong>{email}</strong>. Check your spam or junk mail if it doesn&apos;t arrive in a few minutes.
              </p>
              <div className="pt-3">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to login</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
