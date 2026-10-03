"use client";

import React, { useState } from "react";
import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Search,
  X,
  ArrowUpDown,
  Trash2,
  Plus,
  Tag as TagIcon,
  Star,
  Clock,
  BookOpen,
  FileDown,
  Globe,
} from "lucide-react";
import { SortOption } from "@/types";
import { Modal } from "@/components/ui/Modal";

interface NoteListHeaderProps {
  onNewNote: () => void;
}

export function NoteListHeader({ onNewNote }: NoteListHeaderProps) {
  const {
    view,
    selectedTag,
    filteredNotes,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    emptyAllTrash,
    trashedNotesCount,
  } = useNotes();

  const { accentClass } = useTheme();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);

  // Compute title and icon
  let title = "All Notes";
  let Icon = BookOpen;

  if (view === "favorites") {
    title = "Favorites";
    Icon = Star;
  } else if (view === "recent") {
    title = "Recent Notes";
    Icon = Clock;
  } else if (view === "shared") {
    title = "Added from Others";
    Icon = FileDown;
  } else if (view === "published") {
    title = "Published Notes";
    Icon = Globe;
  } else if (view === "trash") {
    title = "Trash";
    Icon = Trash2;
  } else if (view === "tag") {
    title = selectedTag ? `#${selectedTag}` : "Tag";
    Icon = TagIcon;
  }

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: "Recently Edited", value: "updated_desc" },
    { label: "Oldest Edited", value: "updated_asc" },
    { label: "Date Created (Newest)", value: "created_desc" },
    { label: "Date Created (Oldest)", value: "created_asc" },
    { label: "Title (A to Z)", value: "title_asc" },
    { label: "Title (Z to A)", value: "title_desc" },
  ];

  return (
    <div className="shrink-0 p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#111726]/70 backdrop-blur-xs">
      {/* Title & Top Action Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
            {title}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
            {filteredNotes.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {view === "trash" ? (
            trashedNotesCount > 0 && (
              <button
                type="button"
                onClick={() => setShowEmptyTrashModal(true)}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                Empty Trash
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onNewNote}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-medium shadow-xs hover:opacity-95 transition-all ${accentClass.bg}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          )}

          {/* Sort Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Sort Notes"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161d2f] shadow-lg z-30 py-1 text-xs">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortOption(opt.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 ${sortOption === opt.value
                        ? "text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/50 dark:bg-amber-950/20"
                        : "text-slate-600 dark:text-slate-300"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c101b] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Empty Trash Confirmation Modal */}
      <Modal
        isOpen={showEmptyTrashModal}
        onClose={() => setShowEmptyTrashModal(false)}
        title="Empty Trash?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            This will permanently delete all {trashedNotesCount} notes in the trash.
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEmptyTrashModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                await emptyAllTrash();
                setShowEmptyTrashModal(false);
              }}
              className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium"
            >
              Empty All Trash
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
