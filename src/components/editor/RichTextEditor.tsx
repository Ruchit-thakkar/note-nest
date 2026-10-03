"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import { EditorToolbar } from "./EditorToolbar";
import { formatNoteDate, stripHtml } from "@/lib/utils";
import {
  Star,
  Trash2,
  Tag as TagIcon,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Plus,
  X,
  ArrowLeft,
  Share2,
  Globe,
  Save,
  Loader2,
  RefreshCw,
  FileText,
  Sparkles,
} from "lucide-react";
import { ShareModal } from "@/components/modals/ShareModal";
import { AIIndexBadge } from "./AIIndexBadge";
import { AINoteAssistantModal } from "@/components/modals/AINoteAssistantModal";

interface RichTextEditorProps {
  onBackMobile?: () => void;
}

export function RichTextEditor({ onBackMobile }: RichTextEditorProps) {
  const {
    activeNote,
    saveNote,
    saveStatus,
    setSaveStatus,
    tags,
    addTagToNote,
    removeTagFromNote,
    toggleFavorite,
    trashNote,
    duplicateNote,
    deletePermanently,
    restoreNote,
    convertToPersonal,
  } = useNotes();

  const { accentClass } = useTheme();

  const [title, setTitle] = useState("");
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const isInitialLoad = useRef(true);
  const activeNoteIdRef = useRef<string | null>(null);

  const isSynced =
    activeNote?.copyType === "synced" || activeNote?.syncMode === "synced";

  // Initialize TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-amber-600 dark:text-amber-400 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: "Type your notes here...",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[350px] text-slate-800 dark:text-slate-100 px-6 py-4",
      },
    },
    editable: !isSynced && !activeNote?.isTrash,
    onUpdate: () => {
      // Typing alone NEVER saves automatically
      if (isInitialLoad.current) return;
      if (!activeNote || activeNote.isTrash || isSynced) return;
      setSaveStatus("unsaved");
    },
    immediatelyRender: false,
  });

  // When activeNote changes, sync title and editor content
  useEffect(() => {
    if (!activeNote) {
      setTitle("");
      editor?.commands.setContent("");
      activeNoteIdRef.current = null;
      return;
    }

    if (activeNoteIdRef.current !== activeNote.id) {
      activeNoteIdRef.current = activeNote.id;
      isInitialLoad.current = true;
      setTitle(activeNote.title || "");

      if (editor) {
        editor.commands.setContent(activeNote.content || "");
        editor.setEditable(!isSynced && !activeNote.isTrash);
      }

      setSaveStatus("saved");

      setTimeout(() => {
        isInitialLoad.current = false;
      }, 100);
    } else {
      // If note content updated from outside (e.g. real-time sync from author save)
      if (isSynced && editor) {
        const currentHtml = editor.getHTML();
        if (activeNote.content && currentHtml !== activeNote.content) {
          editor.commands.setContent(activeNote.content);
          setTitle(activeNote.title || "");
        }
      }
    }
  }, [activeNote, editor, isSynced, setSaveStatus]);

  // Handle title changes (manual save required)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSynced || activeNote?.isTrash) return;
    setTitle(e.target.value);
    setSaveStatus("unsaved");
  };

  // Explicit Save Handler
  const handleSave = useCallback(async () => {
    if (!activeNote || isSynced || activeNote.isTrash) return;
    const content = editor?.getHTML() || "";
    try {
      await saveNote(activeNote.id, {
        title: title.trim() || "Untitled Note",
        content,
      });
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [activeNote, isSynced, editor, title, saveNote]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Prevent accidental navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved" || saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // Handle adding tag
  const handleAddTag = (raw: string) => {
    if (!activeNote || isSynced || !raw.trim()) return;
    addTagToNote(activeNote.id, raw.trim());
    setTagInput("");
    setShowTagMenu(false);
  };

  if (!activeNote) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-base font-medium text-slate-700 dark:text-slate-300">
          No note selected
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Select a note from the list on the left, or create a new note to start writing.
        </p>
      </div>
    );
  }

  // Calculate words and characters
  const plainText = activeNote.plainText || stripHtml(activeNote.content || "");
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#111726] border-l border-slate-200/80 dark:border-slate-800/80 overflow-hidden relative">
      {/* Top Meta Bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 text-xs text-slate-500">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {/* Mobile Back Button */}
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Back to list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Save State Indicator */}
          {!isSynced && !activeNote.isTrash && (
            <div className="flex items-center gap-1.5 font-medium select-none">
              {saveStatus === "unsaved" && (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved changes</span>
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === "error" && (
                <span
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-rose-500 cursor-pointer hover:underline"
                  title="Click to retry saving"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Save failed — try again</span>
                </span>
              )}

              {/* Version pill */}
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 ml-1">
                v{activeNote.version || 1}
              </span>
            </div>
          )}

          {/* Synced Copy Read-Only Badge */}
          {isSynced && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold text-[11px] border border-sky-200 dark:border-sky-800/60">
              <RefreshCw className="w-3 h-3 text-sky-500 shrink-0" />
              <span>Synced Copy (Read-Only)</span>
              <span className="text-[10px] opacity-75">• v{activeNote.sourceVersion || 1}</span>
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeNote.isTrash ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-500 font-medium text-xs">In Trash</span>
              <button
                type="button"
                onClick={() => restoreNote(activeNote.id)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => deletePermanently(activeNote.id)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium"
              >
                Delete Forever
              </button>
            </div>
          ) : (
            <>
              {/* SAVE BUTTON (Prominent, for normal/personal notes) */}
              {!isSynced && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  title="Save note (Ctrl+S)"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                    saveStatus === "unsaved"
                      ? `${accentClass.bg} text-white hover:opacity-95 active:scale-[0.98]`
                      : saveStatus === "error"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : saveStatus === "saving"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {saveStatus === "saving" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : saveStatus === "saved" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : saveStatus === "error" ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {saveStatus === "saving"
                      ? "Saving..."
                      : saveStatus === "saved"
                      ? "Saved"
                      : saveStatus === "error"
                      ? "Save failed — try again"
                      : "Save"}
                  </span>
                </button>
              )}

              {/* AI Index Status Badge */}
              <AIIndexBadge note={activeNote} />

              {/* AI Assistant Button (Summarize, Explain, Related Notes) */}
              <button
                type="button"
                onClick={() => setShowAIAssistant(true)}
                title="AI Tools (Summarize, Explain, Related Notes)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all shadow-2xs group"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">AI Tools</span>
              </button>

              {/* Make Personal button for synced copies */}
              {isSynced && (
                <button
                  type="button"
                  onClick={() => convertToPersonal(activeNote.id)}
                  title="Convert to independent personal copy"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Make Personal</span>
                </button>
              )}

              {/* Share & Publish Button (only for original notes) */}
              {!isSynced && (
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  title={
                    activeNote.isPublished
                      ? "Published note - click to manage link and share settings"
                      : "Share & Publish Note"
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeNote.isPublished
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {activeNote.isPublished ? (
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {activeNote.isPublished ? "Published" : "Share"}
                  </span>
                </button>
              )}

              {/* Favorite Toggle */}
              <button
                type="button"
                onClick={() => toggleFavorite(activeNote.id)}
                title={activeNote.isFavorite ? "Unfavorite" : "Favorite"}
                className={`p-1.5 rounded-md transition-colors ${
                  activeNote.isFavorite
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Star
                  className="w-4 h-4"
                  fill={activeNote.isFavorite ? "currentColor" : "none"}
                />
              </button>

              {/* Duplicate */}
              <button
                type="button"
                onClick={() => duplicateNote(activeNote.id)}
                title="Duplicate Note"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>

              {/* Trash */}
              <button
                type="button"
                onClick={() => trashNote(activeNote.id)}
                title="Move to Trash"
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Formatting Toolbar (only for editable notes) */}
      {!activeNote.isTrash && !isSynced && <EditorToolbar editor={editor} />}

      {/* Scrollable Writing Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl w-full mx-auto">
        {/* Synced Note Banner */}
        {isSynced && (
          <div className="mb-6 p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wider">
                    Synced Copy (Read-Only)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-200/60 dark:bg-sky-900/80 text-sky-800 dark:text-sky-300 font-medium">
                    v{activeNote.sourceVersion || 1}
                  </span>
                </div>
                <p className="text-xs text-sky-700 dark:text-sky-300 mt-0.5 leading-relaxed">
                  {activeNote.sourceStatus === "deleted"
                    ? "Original note is no longer available. You can keep this content by converting it to a Personal Copy."
                    : activeNote.sourceStatus === "unpublished"
                    ? "Original note is no longer publicly available. You can keep this content by converting it to a Personal Copy."
                    : `Published by ${activeNote.sourceCreatorName || "Creator"}. Automatically updates when the author saves changes.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => convertToPersonal(activeNote.id)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Convert to Personal Copy</span>
            </button>
          </div>
        )}

        {/* Title */}
        {isSynced ? (
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 select-text">
            {activeNote.title || "Untitled Note"}
          </h1>
        ) : (
          <input
            type="text"
            value={title}
            disabled={activeNote.isTrash}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="w-full text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 bg-transparent border-none outline-none mb-3"
          />
        )}

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6 text-xs">
          {activeNote.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
            >
              #{tag}
              {!activeNote.isTrash && !isSynced && (
                <button
                  type="button"
                  onClick={() => removeTagFromNote(activeNote.id, tag)}
                  className="hover:text-rose-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}

          {!activeNote.isTrash && !isSynced && (
            <div className="relative">
              {showTagMenu ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTag(tagInput);
                      if (e.key === "Escape") setShowTagMenu(false);
                    }}
                    autoFocus
                    className="w-24 text-xs px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111726] text-slate-800 dark:text-slate-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="p-1 rounded bg-amber-600 text-white"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTagMenu(false)}
                    className="p-1 text-slate-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTagMenu(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add tag</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* TipTap Rich Editor Body */}
        <div className="relative">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom Status / Stats Bar */}
      <div className="shrink-0 flex items-center justify-between px-6 py-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{readTimeMin} min read</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>Updated {formatNoteDate(activeNote.updatedAt)}</span>
        </div>
      </div>

      {/* Share & Publish Modal */}
      {!isSynced && (
        <ShareModal
          note={activeNote}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* AI Note Assistant Modal */}
      <AINoteAssistantModal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        note={activeNote}
        hasUnsavedChanges={saveStatus === "unsaved"}
        onInsertContent={(contentToInsert) => {
          if (editor) {
            const currentHtml = editor.getHTML();
            const formatted = `<hr/><p><strong>AI Assistant Output:</strong></p><p>${contentToInsert.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
            editor.commands.setContent(currentHtml + formatted);
            setSaveStatus("unsaved");
          }
        }}
      />
    </div>
  );
}
