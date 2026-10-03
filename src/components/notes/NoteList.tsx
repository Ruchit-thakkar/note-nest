"use client";

import React from "react";
import { useNotes } from "@/context/NotesContext";
import { NoteCard } from "./NoteCard";
import { NoteListHeader } from "./NoteListHeader";
import { NoteCardSkeleton } from "@/components/ui/Skeleton";
import {
  FileText,
  Star,
  Trash2,
  SearchX,
  Tag as TagIcon,
  Plus,
  FileDown,
  Globe,
} from "lucide-react";

interface NoteListProps {
  onSelectNote: (id: string) => void;
}

export function NoteList({ onSelectNote }: NoteListProps) {
  const {
    filteredNotes,
    activeNoteId,
    loading,
    view,
    searchQuery,
    createNewNote,
    setSearchQuery,
  } = useNotes();

  const handleCreateNote = async () => {
    const newId = await createNewNote();
    onSelectNote(newId);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 dark:bg-[#090d16]/50 select-none overflow-hidden">
      {/* Header with Search and Sort */}
      <NoteListHeader onNewNote={handleCreateNote} />

      {/* Note List / Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="space-y-2.5">
            <NoteCardSkeleton />
            <NoteCardSkeleton />
            <NoteCardSkeleton />
            <NoteCardSkeleton />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center text-slate-500">
            {searchQuery ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
                  <SearchX className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No notes found
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  No notes match &ldquo;{searchQuery}&rdquo;. Try another keyword.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
                >
                  Clear search query
                </button>
              </>
            ) : view === "favorites" ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-3 text-amber-500">
                  <Star className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No favorite notes
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Click the star icon on any note to bookmark it for quick access here.
                </p>
              </>
            ) : view === "trash" ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Trash is empty
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Deleted notes will appear here before being permanently removed.
                </p>
              </>
            ) : view === "shared" ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-3 text-indigo-500">
                  <FileDown className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No notes added from others
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                  When you open public notes and click &ldquo;Add to My Notes&rdquo;, your Synced and Personal copies will appear here.
                </p>
              </>
            ) : view === "published" ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-3 text-emerald-500">
                  <Globe className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No published notes yet
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                  Open any of your notes and click &ldquo;Share&rdquo; to publish a public link for others to read and save.
                </p>
              </>
            ) : view === "tag" ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
                  <TagIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No notes with this tag
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Add this tag to your notes in the editor to see them grouped here.
                </p>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create note with tag</span>
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No notes yet
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Create your first note to start writing and capturing your knowledge.
                </p>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Note</span>
                </button>
              </>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={note.id === activeNoteId}
              onSelect={() => onSelectNote(note.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
