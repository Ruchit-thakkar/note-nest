"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Send,
  Loader2,
  FileText,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database,
  CheckCircle2,
  HelpCircle,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { ChatMessage, AISourceCitation } from "@/types";
import { askMyNotes } from "@/services/aiService";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface AskMyNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PROMPTS = [
  "What are the key points in my latest notes?",
  "What did I write about authentication and security?",
  "Summarize my JavaScript and React notes.",
  "Which notes talk about database design or SQL?",
];

export function AskMyNotesModal({ isOpen, onClose }: AskMyNotesModalProps) {
  const { user } = useAuth();
  const { notes, setActiveNoteId, rebuildFullAIIndex } = useNotes();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reindex state
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexStatus, setReindexStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk || question).trim();
    if (!q || loading || !user) return;

    setError(null);
    setQuestion("");

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: q,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = await user.getIdToken();
      // Pass previous context (role and content) for conversation flow
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askMyNotes(token, q, history);

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        timestamp: Date.now(),
      };

      setMessages([...newMessages, assistantMsg]);
    } catch (err: any) {
      console.error("Ask AI error:", err);
      setError(err.message || "AI is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setQuestion("");
    inputRef.current?.focus();
  };

  const handleOpenSourceNote = (noteId: string) => {
    setActiveNoteId(noteId);
    onClose();
  };

  const handleRebuildIndex = async () => {
    if (isReindexing) return;
    setIsReindexing(true);
    setReindexStatus("Rebuilding AI index...");
    try {
      const res = await rebuildFullAIIndex();
      if (res.success) {
        setReindexStatus(`Indexed ${res.indexedCount} notes successfully!`);
        setTimeout(() => setReindexStatus(null), 3500);
      } else {
        setReindexStatus(`Reindex issue: ${res.error || "Failed"}`);
        setTimeout(() => setReindexStatus(null), 4000);
      }
    } catch (e: any) {
      setReindexStatus("Reindex failed");
      setTimeout(() => setReindexStatus(null), 3000);
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] max-h-[750px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Ask My Notes
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  RAG Knowledge Search
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Answers generated strictly using your personal saved notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat / Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto py-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/40">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                What would you like to know from your notes?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Note Nest searches your saved notes using Pinecone vector embeddings and answers your question with Groq AI, complete with source citations.
              </p>

              {/* Sample prompts */}
              <div className="w-full mt-6 space-y-2 text-left">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Try asking
                </span>
                {SAMPLE_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(promptText)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 text-xs text-slate-700 dark:text-slate-300 transition-all text-left flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{promptText}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-xs shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
                      }`}
                  >
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    {/* Sources Citations for AI messages */}
                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Sources used:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleOpenSourceNote(src.noteId)}
                              title={`Open note: ${src.noteTitle}\n"${src.chunkSnippet}"`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-2xs group"
                            >
                              <span className="truncate max-w-[160px] font-medium">
                                📄 {src.noteTitle}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="flex items-start">
                  <div className="p-4 rounded-2xl rounded-bl-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Searching your saved notes & formulating answer...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Search Notice</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar & Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your saved notes..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xs"
            />
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Ask AI</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Utility Bar: Rebuild Index & Privacy Note */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Strict user isolation: only your own notes are ever searched.</span>
            </span>

            <button
              type="button"
              onClick={handleRebuildIndex}
              disabled={isReindexing}
              title="Synchronize all your saved notes into the vector index"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <Database className="w-3 h-3" />
              <span>{reindexStatus || (isReindexing ? "Reindexing..." : "Rebuild AI Index")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
