"use client";

import React, { useState, useEffect } from "react";
import { Note, PublicNote } from "@/types";
import { useNotes } from "@/context/NotesContext";
import {
  RefreshCw,
  CheckCircle,
  FileText,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SyncStatusBadgeProps {
  note: Note;
}

export function SyncStatusBadge({ note }: SyncStatusBadgeProps) {
  const { convertToPersonal, getPublicNoteDetails } = useNotes();
  const [sourceData, setSourceData] = useState<PublicNote | null>(null);
  const [showPopover, setShowPopover] = useState(false);

  const isSynced = note.copyType === "synced" || note.syncMode === "synced";

  // Fetch source details when note changes
  useEffect(() => {
    if (isSynced && note.sourcePublicId) {
      getPublicNoteDetails(note.sourcePublicId).then((data) => {
        setSourceData(data);
      });
    }
  }, [isSynced, note.sourcePublicId, note.sourceVersion, getPublicNoteDetails]);

  if (!isSynced || !note.sourcePublicId) {
    if ((note.copyType === "personal" || note.syncMode === "personal") && note.sourceCreatorName) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-medium">
          <FileText className="w-3 h-3 text-slate-400" />
          <span>Personal copy (derived from {note.sourceCreatorName})</span>
        </span>
      );
    }
    return null;
  }

  const isUnavailable =
    !sourceData ||
    !sourceData.isPublished ||
    note.sourceStatus === "deleted" ||
    note.sourceStatus === "unpublished";

  const handleMakePersonal = async () => {
    await convertToPersonal(note.id);
    setShowPopover(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors border select-none ${
          isUnavailable
            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
            : "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800"
        }`}
      >
        {isUnavailable ? (
          <>
            <XCircle className="w-3 h-3" />
            <span>Source Unavailable</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-3 h-3 text-sky-500" />
            <span>Synced (v{note.sourceVersion || 1})</span>
          </>
        )}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {/* Sync Info Popover */}
      {showPopover && (
        <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161d2f] shadow-xl z-30 p-3.5 text-xs text-left">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Synced Copy Status
            </span>
            <span className="text-[10px] text-slate-400">
              v{note.sourceVersion || 1}
            </span>
          </div>

          <div className="space-y-2 mb-3 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            {isUnavailable ? (
              <p className="text-rose-600 dark:text-rose-400">
                The original author has unpublished or deleted this note. You can convert this copy into an independent Personal Copy to keep and edit it.
              </p>
            ) : (
              <p>
                Connected to original by <strong className="text-slate-700 dark:text-slate-200">{note.sourceCreatorName || "author"}</strong>.
                Updates automatically whenever the author saves changes.
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full justify-center gap-1.5 text-xs"
            onClick={handleMakePersonal}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Convert to Personal Copy</span>
          </Button>
        </div>
      )}
    </div>
  );
}
