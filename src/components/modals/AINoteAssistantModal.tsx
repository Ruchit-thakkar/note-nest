"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  FileText,
  HelpCircle,
  Link2,
  Copy,
  Check,
  PlusCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
  GraduationCap,
  ListOrdered,
  BookMarked,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { Note, ExplainMode } from "@/types";
import {
  summarizeNote,
  explainNote,
  fetchRelatedNotes,
  RelatedNoteItem,
} from "@/services/aiService";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface AINoteAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
  hasUnsavedChanges?: boolean;
  onInsertContent?: (text: string) => void;
}

type TabType = "summary" | "explain" | "related";

export function AINoteAssistantModal({
  isOpen,
  onClose,
  note,
  hasUnsavedChanges = false,
  onInsertContent,
}: AINoteAssistantModalProps) {
  const { user } = useAuth();
  const { setActiveNoteId } = useNotes();

  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [explainMode, setExplainMode] = useState<ExplainMode>("simple");

  // State for AI outputs
  const [summary, setSummary] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [relatedNotes, setRelatedNotes] = useState<RelatedNoteItem[]>([]);

  // Loading & error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);

  // Reset or run tab action when tab changes or note changes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      return;
    }
    // Auto-fetch if empty
    if (activeTab === "summary" && !summary && !loading) {
      handleSummarize();
    } else if (activeTab === "related" && relatedNotes.length === 0 && !loading) {
      handleFetchRelated();
    }
  }, [isOpen, activeTab, note.id]);

  if (!isOpen) return null;

  const handleSummarize = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const result = await summarizeNote(token, note.title, note.content || "");
      setSummary(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (mode: ExplainMode) => {
    if (!user) return;
    setExplainMode(mode);
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const result = await explainNote(token, note.title, note.content || "", mode);
      setExplanation(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate explanation.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRelated = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const items = await fetchRelatedNotes(
        token,
        note.id,
        note.title,
        note.content || ""
      );
      setRelatedNotes(items);
    } catch (err: any) {
      setError(err.message || "Failed to find related notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = (text: string) => {
    if (onInsertContent) {
      onInsertContent(text);
      setInserted(true);
      setTimeout(() => setInserted(false), 2500);
    }
  };

  const handleOpenRelatedNote = (targetNoteId: string) => {
    setActiveNoteId(targetNoteId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Note Assistant</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Groq & Pinecone
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                Analyzing: <span className="font-medium">{note.title || "Untitled Note"}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unsaved changes notice */}
        {hasUnsavedChanges && (
          <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-900/50 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              You have unsaved changes. AI uses the last saved content. Click{" "}
              <strong>Save</strong> in the editor to include recent edits.
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-white dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "summary"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summary</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("explain");
              if (!explanation) handleExplain(explainMode);
            }}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "explain"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explain Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("related")}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "related"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Related Notes</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">AI Assistant Notice</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Concise executive summary of your saved content
                </span>
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={loading}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Regenerate
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <p className="text-xs">Generating summary with Groq...</p>
                </div>
              ) : summary ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <MarkdownRenderer content={summary} />
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No summary generated yet. Click Regenerate above.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPLAIN */}
          {activeTab === "explain" && (
            <div className="space-y-4">
              {/* Explain Mode selector pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleExplain("simple")}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    explainMode === "simple"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold">Plain English</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Simple & direct
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExplain("beginner")}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    explainMode === "beginner"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold">Beginner</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Intuitive analogies
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExplain("key_points")}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    explainMode === "key_points"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold">Key Points</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Core essentials
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExplain("revision")}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    explainMode === "revision"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <BookMarked className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold">Revision Notes</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Study & review quiz
                  </span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <p className="text-xs">Explaining note with Groq...</p>
                </div>
              ) : explanation ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <MarkdownRenderer content={explanation} />
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Select a mode above to explain this note.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RELATED NOTES */}
          {activeTab === "related" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Notes with semantic similarity retrieved via Pinecone
                </span>
                <button
                  type="button"
                  onClick={handleFetchRelated}
                  disabled={loading}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <p className="text-xs">Searching for related notes in Pinecone...</p>
                </div>
              ) : relatedNotes.length > 0 ? (
                <div className="space-y-2.5">
                  {relatedNotes.map((item) => (
                    <div
                      key={item.noteId}
                      onClick={() => handleOpenRelatedNote(item.noteId)}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.noteTitle}
                            </h4>
                            {item.heading && item.heading !== "Section" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {item.heading}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.snippet}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 shrink-0">
                          <span className="text-[10px] font-mono font-medium">
                            {Math.round(item.score * 100)}% match
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No semantically related notes found in your collection yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with safety actions */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            AI output is never automatically merged into your notes.
          </p>

          <div className="flex items-center gap-2">
            {(activeTab === "summary" && summary) || (activeTab === "explain" && explanation) ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(activeTab === "summary" ? summary : explanation)
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {onInsertContent && (
                  <button
                    type="button"
                    onClick={() =>
                      handleInsert(activeTab === "summary" ? summary : explanation)
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {inserted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Inserted!</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Insert at Bottom</span>
                      </>
                    )}
                  </button>
                )}
              </>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
