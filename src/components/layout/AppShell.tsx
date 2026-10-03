"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { NoteList } from "@/components/notes/NoteList";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { AskMyNotesModal } from "@/components/modals/AskMyNotesModal";
import { useNotes } from "@/context/NotesContext";
import { Menu, Plus, X, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function AppShell() {
  const { activeNoteId, setActiveNoteId, createNewNote } = useNotes();
  const { accentClass } = useTheme();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [askAIOpen, setAskAIOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+J or Cmd+J to open Ask AI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAskAIOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
  };

  const handleBackMobile = () => {
    setActiveNoteId(null);
  };

  const handleCreateNewNoteMobile = async () => {
    const id = await createNewNote();
    setActiveNoteId(id);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#090d16]">
      {/* Mobile Top App Bar (visible on md:hidden) */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] bg-white dark:bg-[#111726] border-b border-slate-200 dark:border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-black shrink-0 flex items-center justify-center">
              <Image
                src="/N%20Emblem.png"
                alt="Note Nest"
                width={24}
                height={24}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Note Nest
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreateNewNoteMobile}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium shadow-xs ${accentClass.bg}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Responsive Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block shrink-0 h-full">
          <Sidebar
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenAskAI={() => setAskAIOpen(true)}
          />
        </div>

        {/* Mobile Sidebar Drawer Modal */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Slide-out drawer */}
            <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
              <Sidebar
                onOpenSettings={() => {
                  setMobileSidebarOpen(false);
                  setSettingsOpen(true);
                }}
                onCloseMobile={() => setMobileSidebarOpen(false)}
                onOpenAskAI={() => {
                  setMobileSidebarOpen(false);
                  setAskAIOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Note List Column */}
        {/* On mobile: show note list when no note is active; hide when note is active */}
        <div
          className={`h-full md:w-80 lg:w-96 shrink-0 transition-all ${
            activeNoteId ? "hidden md:block" : "w-full"
          }`}
        >
          <NoteList onSelectNote={handleSelectNote} />
        </div>

        {/* Editor Column */}
        {/* On mobile: show full-screen editor when activeNoteId exists; hide when null */}
        <div
          className={`h-full flex-1 min-w-0 ${
            activeNoteId ? "w-full md:w-auto" : "hidden md:flex"
          }`}
        >
          <RichTextEditor onBackMobile={handleBackMobile} />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Ask My Notes AI Modal */}
      <AskMyNotesModal isOpen={askAIOpen} onClose={() => setAskAIOpen(false)} />
    </div>
  );
}
