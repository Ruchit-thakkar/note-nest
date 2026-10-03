"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicNote } from "@/types";
import { getPublicNote, incrementPublicNoteViews } from "@/services/firestore";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import { formatNoteDate } from "@/lib/utils";
import { AddToMyNotesModal } from "@/components/modals/AddToMyNotesModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Copy,
  Check,
  Sun,
  Moon,
  Clock,
  User,
  Plus,
  ArrowRight,
  Shield,
  FileQuestion,
  Lock,
} from "lucide-react";

interface PublicNoteViewerProps {
  publicId: string;
}

export function PublicNoteViewer({ publicId }: PublicNoteViewerProps) {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { notes } = useNotes();
  const { resolvedTheme, setTheme, accentClass } = useTheme();

  const [note, setNote] = useState<PublicNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    getPublicNote(publicId)
      .then((data) => {
        setNote(data);
        if (data && data.isPublished) {
          incrementPublicNoteViews(publicId);
        }
      })
      .finally(() => setLoading(false));
  }, [publicId]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if current user already has this note
  const existingNote = notes.find(
    (n) => n.sourcePublicId === publicId && !n.isTrash
  );

  const handleAddClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleGoogleSignInFromModal = async () => {
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      setShowAddModal(true);
    } catch (err) {
      console.error("Google sign-in error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#090d16] text-slate-800 dark:text-slate-200">
        <div suppressHydrationWarning className="w-10 h-10 rounded-2xl overflow-hidden bg-black flex items-center justify-center mb-4 animate-bounce shrink-0 shadow-md">
          <Image
            src="/N%20Emblem.png"
            alt="Note Nest"
            width={40}
            height={40}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading Note...
        </p>
      </div>
    );
  }

  if (!note || !note.isPublished) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
        <header className="border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl overflow-hidden bg-black flex items-center justify-center shrink-0">
                <Image
                  src="/N%20Emblem.png"
                  alt="Note Nest"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-sm">Note Nest</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Note Not Available
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            This note has either been unpublished by its author or does not exist.
          </p>
          <Link href="/">
            <Button size="md" className="gap-2">
              <span>Go to Note Nest</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/N%20Emblem.png"
                alt="Note Nest"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight">Note Nest</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Public Note</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>

            {/* Theme switcher */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Add to My Notes CTA */}
            {note.allowCopy !== false && (
              <Button
                size="sm"
                onClick={handleAddClick}
                className="gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{existingNote ? "In My Notes" : "Add to My Notes"}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Reading Canvas */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-4 leading-tight">
          {note.title || "Untitled Note"}
        </h1>

        {/* Metadata Header Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-6 mb-8 border-b border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          {note.showCreator && (
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center">
                {note.creatorName ? note.creatorName[0].toUpperCase() : "U"}
              </div>
              <span>{note.creatorName || "Author"}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <span>Updated {formatNoteDate(note.updatedAt || note.publishedAt)}</span>
          </div>

          <span className="px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            v{note.currentVersion || 1}
          </span>

          {note.showTags && note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Note Prose Body */}
        <article
          className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-base"
          dangerouslySetInnerHTML={{ __html: note.content || "<p><em>This note has no written text.</em></p>" }}
        />

        {/* Bottom CTA Card */}
        {note.allowCopy !== false && (
          <div className="mt-14 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#111726]/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Save this note to your Note Nest
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                Save a live Synced Copy to automatically receive future updates from {note.creatorName || "the author"}, or a Personal Copy to modify independently.
              </p>
            </div>
            <Button size="md" onClick={handleAddClick} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              <span>Add to My Notes</span>
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/80 py-6 mt-12 bg-white dark:bg-[#090d16]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <Link href="/" className="flex items-center gap-2 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-black shrink-0 flex items-center justify-center">
              <Image
                src="/N%20Emblem.png"
                alt="Note Nest"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold">Note Nest</span>
            <span>— Personal Notes &amp; Knowledge Management</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/register" className="text-amber-600 dark:text-amber-400 hover:underline">
              Create your own free notes
            </Link>
          </div>
        </div>
      </footer>

      {/* Add To My Notes Modal (for logged-in users) */}
      <AddToMyNotesModal
        publicNote={note}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        alreadySavedNoteId={existingNote?.id}
      />

      {/* Sign-in Prompt Modal (for unauthenticated visitors) */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In to Save This Note"
        description="Sign in or create a Note Nest account to save Synced or Personal copies of this note."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignInFromModal}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#161d2f] text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white dark:bg-[#111726] px-2 text-slate-400">or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/login?redirect=/n/${publicId}`}
              className="w-full inline-flex items-center justify-center py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-center"
            >
              Sign In
            </Link>
            <Link
              href={`/register?redirect=/n/${publicId}`}
              className="w-full inline-flex items-center justify-center py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold text-center"
            >
              Register
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
