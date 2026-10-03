"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AccentColor, ThemeMode } from "@/types";
import {
  Sun,
  Moon,
  Laptop,
  Check,
  User,
  Palette,
  Shield,
  LogOut,
  Tag,
  FileText,
  Share2,
  Globe,
  FileDown,
  ExternalLink,
  RefreshCw,
  Copy,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, userProfile, logout, updateUserDisplayName } = useAuth();
  const {
    notes,
    tags,
    unpublishCurrentNote,
    convertToPersonal,
    setActiveNoteId,
    setView,
  } = useNotes();
  const { theme, setTheme, accentColor, setAccentColor, accentClass } = useTheme();

  const [activeTab, setActiveTab] = useState<"appearance" | "profile" | "sharing" | "account">("appearance");
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const activeNotes = notes.filter((n) => !n.isTrash).length;
  const publishedNotes = notes.filter((n) => !n.isTrash && !!n.isPublished);
  const sharedNotes = notes.filter((n) => !n.isTrash && !!n.sourcePublicId);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsUpdatingName(true);
    try {
      await updateUserDisplayName(displayName.trim());
      setNameSavedSuccess(true);
      setTimeout(() => setNameSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleCopyPublicUrl = (publicId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/n/${publicId}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(publicId);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleOpenNote = (noteId: string) => {
    setActiveNoteId(noteId);
    setView("all");
    onClose();
  };

  const accentColors: { id: AccentColor; name: string; hex: string }[] = [
    { id: "amber", name: "Amber (Default)", hex: "#f59e0b" },
    { id: "indigo", name: "Indigo", hex: "#6366f1" },
    { id: "emerald", name: "Emerald", hex: "#10b981" },
    { id: "rose", name: "Rose", hex: "#f43f5e" },
    { id: "sky", name: "Sky", hex: "#0284c7" },
    { id: "violet", name: "Violet", hex: "#8b5cf6" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="lg">
      <div className="flex flex-col sm:flex-row gap-6 min-h-[420px]">
        {/* Settings Navigation Tabs */}
        <div className="sm:w-44 flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 pb-3 sm:pb-0 sm:pr-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              activeTab === "appearance"
                ? `${accentClass.lightBg} font-semibold`
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              activeTab === "profile"
                ? `${accentClass.lightBg} font-semibold`
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sharing")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              activeTab === "sharing"
                ? `${accentClass.lightBg} font-semibold`
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Sharing &amp; Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
              activeTab === "account"
                ? `${accentClass.lightBg} font-semibold`
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Account</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              {/* Color Mode */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Theme Mode
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "light" as ThemeMode, label: "Light", icon: Sun },
                    { id: "dark" as ThemeMode, label: "Dark", icon: Moon },
                    { id: "system" as ThemeMode, label: "System", icon: Laptop },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <ItemIcon className="w-4 h-4 mb-1.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Selection */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Accent Color
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {accentColors.map((color) => {
                    const isSelected = accentColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setAccentColor(color.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? "border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-800/80 font-semibold"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-white"
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span className="truncate">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-lg flex items-center justify-center shrink-0">
                  {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {userProfile?.displayName || "User"}
                  </h4>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateName} className="space-y-4">
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                />

                <div className="flex items-center justify-between pt-2">
                  {nameSavedSuccess ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Name updated successfully
                    </span>
                  ) : (
                    <span />
                  )}

                  <Button type="submit" size="sm" isLoading={isUpdatingName}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Phase 2: Sharing & Sync Management Tab */}
          {activeTab === "sharing" && (
            <div className="space-y-6">
              {/* My Published Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>My Published Notes ({publishedNotes.length})</span>
                  </h4>
                </div>

                {publishedNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    You haven&apos;t published any notes yet. Open any note in the editor and click &ldquo;Share&rdquo; to publish.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {publishedNotes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {n.title || "Untitled Note"}
                          </p>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            v{n.version || 1} • Public
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {n.publicId && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyPublicUrl(n.publicId!)}
                                title="Copy public link"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                              >
                                {copiedLink === n.publicId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <a
                                href={`/n/${n.publicId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open public view"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              <button
                                type="button"
                                onClick={() => unpublishCurrentNote(n.id, n.publicId!)}
                                title="Unpublish note"
                                className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                Unpublish
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes Added From Others */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Added From Others ({sharedNotes.length})</span>
                  </h4>
                </div>

                {sharedNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    You haven&apos;t added any shared notes from other creators yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sharedNotes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {n.title || "Untitled Note"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">
                              by {n.sourceCreatorName || "Creator"}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                n.syncMode === "synced"
                                  ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {n.syncMode === "synced" ? "Synced Copy" : "Personal Copy"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenNote(n.id)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Open
                          </button>

                          {(n.copyType === "synced" || n.syncMode === "synced") && (
                            <button
                              type="button"
                              onClick={() => convertToPersonal(n.id)}
                              title="Convert to Personal Copy (disconnects future sync updates)"
                              className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Make Personal
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-5">
              {/* Account Stats */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                  Knowledge Stats
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-center">
                    <FileText className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {activeNotes}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase">Notes</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-center">
                    <Globe className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {publishedNotes.length}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase">Published</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-center">
                    <Tag className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {tags.length}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase">Tags</p>
                  </div>
                </div>
              </div>

              {/* Security info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Data Isolation &amp; Privacy
                </p>
                <p className="text-[11px] leading-relaxed">
                  Your notes are scoped strictly to your user account and secured with Firestore security rules.
                </p>
              </div>

              {/* Logout Action */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Note Nest</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
