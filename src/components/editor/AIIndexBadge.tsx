"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useNotes } from "@/context/NotesContext";
import { Note } from "@/types";

interface AIIndexBadgeProps {
  note: Note;
}

export function AIIndexBadge({ note }: AIIndexBadgeProps) {
  const { retryIndexNote } = useNotes();
  const [retrying, setRetrying] = useState(false);

  const status = note.aiIndexStatus || "idle";

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (retrying) return;
    setRetrying(true);
    try {
      await retryIndexNote(note.id);
    } finally {
      setRetrying(false);
    }
  };

  if (status === "processing" || retrying) {
    return (
      <div
        title="AI vector indexing in progress..."
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 select-none animate-pulse"
      >
        <Loader2 className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="hidden sm:inline">AI index:</span> Processing...
      </div>
    );
  }

  if (status === "indexed") {
    return (
      <div
        title={`AI vector index is ready (v${note.aiIndexedVersion || note.version || 1})`}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/60 select-none"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span className="hidden sm:inline">AI index:</span> Ready
      </div>
    );
  }

  if (status === "failed") {
    return (
      <button
        type="button"
        onClick={handleRetry}
        title="AI indexing failed. Click to retry."
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors select-none"
      >
        <AlertTriangle className="w-3 h-3 text-rose-500" />
        <span>AI: Retry</span>
        <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
      </button>
    );
  }

  return null;
}
