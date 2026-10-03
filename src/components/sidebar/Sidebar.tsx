"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import {
  FileText,
  Star,
  Clock,
  Trash2,
  Tag as TagIcon,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  Globe,
  FileDown,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FilterView } from "@/types";

interface SidebarProps {
  onOpenSettings: () => void;
  onCloseMobile?: () => void;
  onOpenAskAI?: () => void;
}

export function Sidebar({ onOpenSettings, onCloseMobile, onOpenAskAI }: SidebarProps) {
  const { userProfile } = useAuth();
  const {
    notes,
    tags,
    view,
    setView,
    selectedTag,
    setSelectedTag,
    createNewNote,
    trashedNotesCount,
    favoritesCount,
    sharedNotesCount,
    publishedNotesCount,
    getTagNoteCount,
    createTag,
    deleteTag,
  } = useNotes();

  const { resolvedTheme, setTheme, accentClass } = useTheme();

  // Tags collapsible toggle
  const [tagsOpen, setTagsOpen] = useState(true);

  // Tag creation modal state
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagName, setTagName] = useState("");

  const activeNotesCount = notes.filter((n) => !n.isTrash).length;

  const handleNavClick = (
    newView: FilterView,
    tag: string | null = null
  ) => {
    setView(newView);
    setSelectedTag(tag);
    onCloseMobile?.();
  };

  const handleCreateNewNote = async () => {
    await createNewNote();
    onCloseMobile?.();
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    await createTag(tagName.trim());
    setTagName("");
    setShowTagModal(false);
  };

  const navItemClass = (isActive: boolean) =>
    cn(
      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none group",
      isActive
        ? `${accentClass.lightBg} font-semibold`
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
    );

  return (
    <aside className="w-64 h-full flex flex-col bg-white dark:bg-[#111726] border-r border-slate-200/80 dark:border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0 bg-black flex items-center justify-center">
            <Image
              src="/N%20Emblem.png"
              alt="Note Nest"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Note Nest
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Personal Knowledge</p>
          </div>
        </div>

        {/* Quick theme switch */}
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-3 space-y-2">
        <button
          type="button"
          onClick={handleCreateNewNote}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white font-medium text-xs shadow-xs hover:opacity-95 active:scale-[0.99] transition-all ${accentClass.bg}`}
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>

        {/* Ask My Notes AI Button */}
        <button
          type="button"
          onClick={() => {
            onOpenAskAI?.();
            onCloseMobile?.();
          }}
          title="Ask questions about your saved notes (Ctrl+J)"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border border-indigo-200/70 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-medium text-xs transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>Ask My Notes</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-600 text-white">
            AI
          </span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5">
        {/* Main Navigation */}
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => handleNavClick("all")}
            className={navItemClass(view === "all")}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>All Notes</span>
            </div>
            <span className="text-[11px] opacity-70">{activeNotesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("favorites")}
            className={navItemClass(view === "favorites")}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Favorites</span>
            </div>
            <span className="text-[11px] opacity-70">{favoritesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("recent")}
            className={navItemClass(view === "recent")}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-500" />
              <span>Recent</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("shared")}
            className={navItemClass(view === "shared")}
          >
            <div className="flex items-center gap-2.5">
              <FileDown className="w-4 h-4 text-indigo-500" />
              <span>Added from Others</span>
            </div>
            {sharedNotesCount > 0 && (
              <span className="text-[11px] opacity-70">{sharedNotesCount}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("published")}
            className={navItemClass(view === "published")}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>Published</span>
            </div>
            {publishedNotesCount > 0 && (
              <span className="text-[11px] opacity-70">{publishedNotesCount}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("trash")}
            className={navItemClass(view === "trash")}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Trash</span>
            </div>
            {trashedNotesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold">
                {trashedNotesCount}
              </span>
            )}
          </button>
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <button
              type="button"
              onClick={() => setTagsOpen(!tagsOpen)}
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {tagsOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span>Tags</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTagName("");
                setShowTagModal(true);
              }}
              title="Add Tag"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {tagsOpen && (
            <div className="flex flex-wrap gap-1 px-1 py-1 mt-1">
              {tags.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-slate-400 dark:text-slate-600 italic">
                  No tags yet.
                </p>
              ) : (
                tags.map((tag) => {
                  const isSelected = view === "tag" && selectedTag === tag.name;
                  const count = getTagNoteCount(tag.name);

                  return (
                    <div
                      key={tag.id}
                      className={cn(
                        "group inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-md text-[11px] font-medium transition-colors select-none",
                        isSelected
                          ? `${accentClass.bg} text-white`
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleNavClick("tag", tag.name)}
                        className="flex items-center gap-1 truncate"
                      >
                        <span>#{tag.name}</span>
                        <span className="opacity-60 text-[10px]">({count})</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTag(tag.id, tag.name);
                        }}
                        title={`Remove #${tag.name} tag`}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-500 dark:hover:text-rose-400 rounded p-0.5 ml-0.5 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Profile & Settings Footer */}
      <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0c101b]/50">
        <div className="flex items-center justify-between">
          <div
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors flex-1 min-w-0"
          >
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-center text-xs shrink-0">
              {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : "U"}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {userProfile?.displayName || "My Account"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userProfile?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tag Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="Create New Tag"
      >
        <form onSubmit={handleSaveTag} className="space-y-4">
          <Input
            autoFocus
            label="Tag Name"
            placeholder="e.g. react, idea, todo"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTagModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Tag
            </Button>
          </div>
        </form>
      </Modal>
    </aside>
  );
}
