"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

export default function AppPage() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}
