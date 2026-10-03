"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Sparkles,
  Shield,
  Tag,
  Search,
  CheckCircle,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  FileText,
  Lock,
  Palette,
  Star,
  Globe,
  RefreshCw,
  Save,
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { resolvedTheme, setTheme, accentClass } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/N%20Emblem.png"
                alt="Note Nest"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="font-bold text-base tracking-tight">Note Nest</span>
          </Link>

          <div className="flex items-center gap-3">
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

            {!loading && user ? (
              <Link
                href="/app"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white ${accentClass.bg} shadow-xs hover:opacity-95 transition-all`}
              >
                <span>Go to Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white ${accentClass.bg} shadow-xs hover:opacity-95 transition-all`}
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Phase 1 — Pure, Fast, Distraction-Free Notes</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15] mb-6">
              Where your thoughts nest and{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500">
                knowledge thrives.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Capture your ideas, organize with tags and favorites, and write in a distraction-free rich editor. Take control with explicit version saves, public note publishing, and live synced copies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={user ? "/app" : "/register"}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white ${accentClass.bg} shadow-md hover:opacity-95 active:scale-[0.99] transition-all`}
              >
                <span>{user ? "Open Your Notes" : "Start Writing for Free"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
              >
                <span>Sign in with Existing Account</span>
              </Link>
            </div>
          </div>

          {/* Interactive UI Mockup Preview */}
          <div className="max-w-5xl mx-auto mt-14 px-4 sm:px-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111726] p-2 sm:p-3 shadow-2xl shadow-amber-500/5">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c101b] overflow-hidden text-left flex flex-col md:flex-row h-[380px] sm:h-[440px]">
                {/* Mockup Sidebar */}
                <div className="hidden md:flex flex-col w-56 border-r border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-[#111726]">
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-black shrink-0 flex items-center justify-center">
                      <Image
                        src="/N%20Emblem.png"
                        alt="Note Nest"
                        width={24}
                        height={24}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-bold text-xs">Note Nest</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> All Notes
                      </span>
                      <span>12</span>
                    </div>
                    <div className="px-2.5 py-1.5 text-slate-500 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500" /> Favorites
                    </div>
                    <div className="px-2.5 py-1.5 text-slate-500 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" /> Published
                    </div>
                    <div className="px-2.5 py-1.5 text-slate-500 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-500" /> Synced Copies
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold uppercase px-2 mb-1">
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1 px-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">#react</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">#nextjs</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">#ideas</span>
                  </div>
                </div>

                {/* Mockup Note List */}
                <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-[#090d16]/50 space-y-2">
                  <div className="p-2.5 rounded-xl border border-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      System Architecture Notes
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      Designed modular firestore data layer with user-scoped isolation...
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                      <span>#react</span>
                      <span>#database</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs opacity-75">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      Weekly Sprint Goals
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      Finalize TipTap rich editor integration, keyboard shortcuts...
                    </p>
                  </div>
                </div>

                {/* Mockup Editor Content */}
                <div className="flex-1 p-6 bg-white dark:bg-[#111726] overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved
                    </span>
                    <span>Last edited 2m ago</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    System Architecture Notes
                  </h3>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      Note Nest utilizes a clean user-scoped Firestore pattern at{" "}
                      <code className="text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1 py-0.5 rounded">
                        users/&#123;userId&#125;/notes
                      </code>
                      .
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Manual save control with automatic version tracking</li>
                      <li>Rich formatting with headings, code blocks &amp; task checklists</li>
                      <li>Instant search filtering by title, body, and tags</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars Feature Grid */}
        <section className="py-16 sm:py-20 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c101b]/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                Everything you need to think clearly
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
                Carefully crafted with modern ergonomics, responsive layouts, and zero unnecessary bloat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Rich Text Writing Experience
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Headings, formatted lists, task checklists, blockquotes, code blocks, and dividers. Focus on writing without wrestling with complicated toolbars.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Save className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  One-Click Save &amp; Version History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Total peace of mind with explicit Save controls. Every save automatically increments your note version and synchronizes with any public or synced copies.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Tags, Favorites &amp; Trash Safety
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Organize your ideas with tags and star key notes for quick access. Accidental deletions go to Trash where you can restore them anytime.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Fast Instant Local Search
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Instant search across titles, note content, and tags. Responsive sorting by recently edited, created date, or alphabetical title.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Light / Dark & Curated Themes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Stunning contrast for day and night. Pick from curated accents like Amber, Indigo, Emerald, Rose, Sky, and Violet to personalize your space.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Strict Data Isolation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your notes belong only to you. User-scoped Firestore collections and hardened security rules prevent unauthorized access.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/80 py-8 bg-white dark:bg-[#090d16]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-black shrink-0 flex items-center justify-center">
              <Image
                src="/N%20Emblem.png"
                alt="Note Nest"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Note Nest
            </span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
