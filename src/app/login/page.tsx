"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginForm() {
  const { user, loading, signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTarget);
    }
  }, [user, loading, router, redirectTarget]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await signInWithEmail(email, password);
      router.push(redirectTarget);
    } catch (err: any) {
      console.error("Login error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setErrorMessage("Invalid email or password. Please check your credentials.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMessage("Too many failed attempts. Please try again later or reset password.");
      } else {
        setErrorMessage(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    setErrorMessage("");

    try {
      await signInWithGoogle();
      router.push(redirectTarget);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMessage(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand header */}
      <div className="text-center mb-8">
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
          Welcome back
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to access your organized notes and knowledge
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-7 shadow-sm">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleSubmitting || isSubmitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#161d2f] text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs mb-4 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-white dark:bg-[#111726] px-3 text-slate-400">
              Or sign in with email
            </span>
          </div>
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
        </form>
      </div>

      {/* Footer Link */}
      <p className="text-center text-xs text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${redirectTarget !== "/app" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
          className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      <Suspense fallback={
        <div className="text-xs text-slate-400 font-medium">Loading Sign In...</div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
