"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black flex items-center justify-center mb-4 animate-bounce shrink-0 shadow-md">
          <Image
            src="/N%20Emblem.png"
            alt="Note Nest"
            width={48}
            height={48}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading Note Nest...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
