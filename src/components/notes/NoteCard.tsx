"use client";

import React from "react";
import { Note } from "@/types";
import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import { formatNoteDate, cn } from "@/lib/utils";
import { Star, Globe, RefreshCw, FileText } from "lucide-react";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
}

export function NoteCard({ note, isSelected, onSelect }: NoteCardProps) {
  const { toggleFavorite } = useNotes();
  const { accentClass } = useTheme();

  const snippet = note.plainText || "No additional text";
  const isSynced = note.copyType === "synced" || note.syncMode === "synced";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none text-left",
        isSelected
          ? "border-amber-500/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500/50 shadow-xs"
          : "border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-[#111726] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
      )}
    >
      {/* Top Row: Title + Status Badges + Star */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 truncate">
          <h4
            className={cn(
              "text-sm font-semibold truncate leading-tight",
              isSelected
                ? "text-amber-900 dark:text-amber-100"
                : "text-slate-800 dark:text-slate-100"
            )}
          >
            {note.title || "Untitled Note"}
          </h4>

          {note.isPublished && (
            <span
              title="Published publicly"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shrink-0"
            >
              <Globe className="w-2.5 h-2.5" />
              <span>Pub</span>
            </span>
          )}

          {isSynced && (
            <span
              title="Synced Copy (Read-Only)"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 shrink-0"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Sync</span>
            </span>
          )}
        </div>

        {!note.isTrash && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(note.id);
            }}
            title={note.isFavorite ? "Unfavorite" : "Favorite"}
            className={cn(
              "shrink-0 p-0.5 rounded transition-colors",
              note.isFavorite
                ? "text-amber-500"
                : "text-slate-300 dark:text-slate-600 hover:text-slate-400 group-hover:opacity-100 opacity-0 md:opacity-0"
            )}
          >
            <Star
              className="w-3.5 h-3.5"
              fill={note.isFavorite ? "currentColor" : "none"}
            />
          </button>
        )}
      </div>

      {/* Snippet */}
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
        {snippet}
      </p>

      {/* Bottom Metadata: Date, Author, Tags */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100/60 dark:border-slate-800/40">
        <div className="flex items-center gap-1.5 truncate">
          <span>{formatNoteDate(note.updatedAt)}</span>
          {note.sourceCreatorName && (
            <>
              <span>•</span>
              <span className="truncate text-indigo-600 dark:text-indigo-400 font-medium max-w-[100px]">
                by {note.sourceCreatorName}
              </span>
            </>
          )}
        </div>

        {/* Tags preview */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1 shrink-0 overflow-hidden max-w-[100px]">
            <span className="truncate px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">
              #{note.tags[0]}
            </span>
            {note.tags.length > 1 && (
              <span className="text-[10px] text-slate-400">
                +{note.tags.length - 1}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
