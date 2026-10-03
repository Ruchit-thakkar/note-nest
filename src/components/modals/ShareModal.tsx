"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Note, PublicNote, ShareSettings } from "@/types";
import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Eye,
  FileDown,
  Layers,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface ShareModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ note, isOpen, onClose }: ShareModalProps) {
  const {
    publishCurrentNote,
    unpublishCurrentNote,
    updateCurrentNoteShareSettings,
    getPublicNoteDetails,
  } = useNotes();
  const { accentClass } = useTheme();

  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicData, setPublicData] = useState<PublicNote | null>(null);

  // Share settings state
  const [allowCopy, setAllowCopy] = useState(true);
  const [showCreator, setShowCreator] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [allowIndexing, setAllowIndexing] = useState(false);

  // Load public note data if already published
  useEffect(() => {
    if (note?.publicId && isOpen) {
      getPublicNoteDetails(note.publicId).then((data) => {
        if (data) {
          setPublicData(data);
          setAllowCopy(data.allowCopy ?? true);
          setShowCreator(data.showCreator ?? true);
          setShowTags(data.showTags ?? true);
          setAllowIndexing(data.allowIndexing ?? false);
        }
      });
    }
  }, [note, isOpen, getPublicNoteDetails]);

  if (!note) return null;

  const publicUrl =
    typeof window !== "undefined" && note.publicId
      ? `${window.location.origin}/n/${note.publicId}`
      : "";

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await publishCurrentNote(note.id, {
        allowCopy,
        showCreator,
        showTags,
        allowIndexing,
      });
      const data = await getPublicNoteDetails(res.publicId);
      setPublicData(data);
    } catch (err) {
      console.error("Publishing error:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!note.publicId) return;
    setIsUnpublishing(true);
    try {
      await unpublishCurrentNote(note.id, note.publicId);
      setPublicData((prev) => (prev ? { ...prev, isPublished: false } : null));
    } catch (err) {
      console.error("Unpublish error:", err);
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleToggleSetting = async (
    key: "allowCopy" | "showCreator" | "showTags" | "allowIndexing",
    value: boolean
  ) => {
    if (!note.publicId) return;
    if (key === "allowCopy") setAllowCopy(value);
    if (key === "showCreator") setShowCreator(value);
    if (key === "showTags") setShowTags(value);
    if (key === "allowIndexing") setAllowIndexing(value);

    setIsUpdatingSettings(true);
    try {
      await updateCurrentNoteShareSettings(note.publicId, {
        [key]: value,
      });
      setPublicData((prev) => (prev ? { ...prev, [key]: value } : null));
    } catch (err) {
      console.error("Failed to update share setting:", err);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const isCurrentlyPublished = note.isPublished && publicData?.isPublished;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Publish Note"
      description={note.title || "Untitled Note"}
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {!isCurrentlyPublished ? (
          /* UNPUBLISHED STATE */
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Publish to the Web
                </p>
                <p className="leading-relaxed">
                  Generate a secure, non-guessable link so anyone can read this note without needing an account. Your other notes remain 100% private.
                </p>
              </div>
            </div>

            {/* Pre-publish settings */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Public Settings
              </h4>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Allow readers to &ldquo;Add to My Notes&rdquo;
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Permits viewers to save a Synced or Personal copy to their account
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowCopy}
                    onChange={(e) => setAllowCopy(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Show creator profile
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Display your name and author attribution on the public page
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCreator}
                    onChange={(e) => setShowCreator(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Show note tags
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Make #tags visible on the public viewer
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showTags}
                    onChange={(e) => setShowTags(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePublish} isLoading={isPublishing}>
                Publish Note
              </Button>
            </div>
          </div>
        ) : (
          /* PUBLISHED STATE */
          <div className="space-y-6">
            {/* Status & Public Link */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live on the web (v{publicData?.currentVersion || 1})
                </span>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                  <span>Open link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c101b] text-slate-700 dark:text-slate-300 select-all outline-none font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0 gap-1.5"
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
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                <Eye className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {publicData?.viewsCount || 0}
                </span>
                <p className="text-[10px] text-slate-400 uppercase">Views</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                <FileDown className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {publicData?.copiesCount || 0}
                </span>
                <p className="text-[10px] text-slate-400 uppercase">Copies</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                <Layers className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  v{publicData?.currentVersion || 1}
                </span>
                <p className="text-[10px] text-slate-400 uppercase">Version</p>
              </div>
            </div>

            {/* Share Settings Toggles */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Live Permissions
              </h4>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Allow Add to My Notes
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Permits readers to save Synced or Personal copies
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowCopy}
                  onChange={(e) => handleToggleSetting("allowCopy", e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Show creator attribution
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Display your name as author
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showCreator}
                  onChange={(e) => handleToggleSetting("showCreator", e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Show tags
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Display note tags
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showTags}
                  onChange={(e) => handleToggleSetting("showTags", e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Search engine indexing
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Allow Google and search engines to discover this note
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowIndexing}
                  onChange={(e) => handleToggleSetting("allowIndexing", e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Action Buttons: Update Version & Unpublish */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublish}
                isLoading={isPublishing}
                className="gap-1.5"
                title="Updates the live published note with your latest edits and increments version"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Publish Updates</span>
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleUnpublish}
                isLoading={isUnpublishing}
              >
                Unpublish Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
