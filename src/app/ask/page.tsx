"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { ChatMessage } from "@/types";
import { askMyNotes } from "@/services/aiService";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  Sparkles,
  ArrowLeft,
  Send,
  Loader2,
  FileText,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database,
  Info,
} from "lucide-react";

const SAMPLE_PROMPTS = [
  "What are the key points in my latest notes?",
  "What did I write about authentication and security?",
  "Summarize my JavaScript and React notes.",
  "Which notes discuss databases or SQL?",
];

function AskPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setActiveNoteId, rebuildFullAIIndex } = useNotes();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexStatus, setReindexStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk || question).trim();
    if (!q || loading || !user) return;

    setError(null);
    setQuestion("");

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
    router.push("/app");
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
        setReindexStatus(`Reindex note: ${res.error || "Failed"}`);
        setTimeout(() => setReindexStatus(null), 4000);
      }
    } catch {
      setReindexStatus("Reindex failed");
      setTimeout(() => setReindexStatus(null), 3000);
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="px-4 sm:px-6 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#111726]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Notes</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ask My Notes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  AI Knowledge System
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRebuildIndex}
            disabled={isReindexing}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>{reindexStatus || (isReindexing ? "Rebuilding..." : "Rebuild Index")}</span>
          </button>
        </div>
      </header>

      {/* Main Conversation Flow */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto py-12">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Ask your personal saved notes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Every answer is generated from the saved notes in your Note Nest collection using Pinecone vector embeddings and Groq AI.
            </p>

            <div className="w-full mt-8 space-y-2 text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Suggested questions
              </span>
              {SAMPLE_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(promptText)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 text-xs text-slate-700 dark:text-slate-300 transition-all text-left flex items-center justify-between group shadow-2xs"
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
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-xs shadow-xs"
                      : "bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/80 dark:border-slate-800 shadow-xs"
                    }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}

                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-750">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Sources:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleOpenSourceNote(src.noteId)}
                            title={`Open note: ${src.noteTitle}\n"${src.chunkSnippet}"`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-2xs group"
                          >
                            <span className="truncate max-w-[200px] font-medium">
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
                <div className="p-4 rounded-2xl rounded-bl-xs bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Searching your saved notes & formulating answer...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
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

      {/* Bottom Sticky Input Bar */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#111726]/80 backdrop-blur-md shrink-0">
        <div className="max-w-4xl mx-auto space-y-2">
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
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xs"
            />
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs shrink-0"
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

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Strict user isolation: only your own notes are ever searched.</span>
            </span>
            <span>Manual save only: AI searches saved note content.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <ProtectedRoute>
      <AskPageContent />
    </ProtectedRoute>
  );
}
