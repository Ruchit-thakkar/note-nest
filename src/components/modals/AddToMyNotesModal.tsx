"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PublicNote, SyncMode } from "@/types";
import { addPublicNoteToMyNotes } from "@/services/firestore";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { RefreshCw, FileText, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

interface AddToMyNotesModalProps {
  publicNote: PublicNote;
  isOpen: boolean;
  onClose: () => void;
  alreadySavedNoteId?: string | null;
}

export function AddToMyNotesModal({
  publicNote,
  isOpen,
  onClose,
  alreadySavedNoteId,
}: AddToMyNotesModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { setActiveNoteId, setView } = useNotes();

  const [copyMode, setCopyMode] = useState<SyncMode>("synced");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (forceNewCopy: boolean = false) => {
    if (!user) {
      router.push(`/login?redirect=/n/${publicNote.publicId}`);
      return;
    }

    if (alreadySavedNoteId && !forceNewCopy) {
      setActiveNoteId(alreadySavedNoteId);
      setView("all");
      router.push("/app");
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const newId = await addPublicNoteToMyNotes(user.uid, publicNote, copyMode);
      setCreatedNoteId(newId);
      setSavedSuccess(true);
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenNote = () => {
    const targetId = createdNoteId || alreadySavedNoteId;
    if (targetId) {
      setActiveNoteId(targetId);
      setView("all");
    }
    router.push("/app");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to My Notes"
      description={`Save "${publicNote.title}" to your personal Note Nest workspace.`}
      maxWidth="md"
    >
      {savedSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Successfully Saved!
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {copyMode === "synced"
                ? "Saved as a Synced Copy. You will be notified when the creator publishes updates."
                : "Saved as an independent Personal Copy. You have complete freedom to edit."}
            </p>
          </div>
          <div className="pt-2">
            <Button size="md" onClick={handleOpenNote} className="gap-2 mx-auto">
              <span>Open in Note Nest</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : alreadySavedNoteId ? (
        /* DUPLICATION DETECTION */
        <div className="space-y-5 py-2">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-semibold text-sm">Already in your notes</p>
            <p className="text-[11px] leading-relaxed">
              You have already saved a copy of this note to your workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button
              size="md"
              className="flex-1"
              onClick={() => handleSave(false)}
            >
              Open Existing Note
            </Button>
            <Button
              size="md"
              variant="outline"
              className="flex-1"
              onClick={() => handleSave(true)}
              isLoading={isSaving}
            >
              Create Another Copy
            </Button>
          </div>
        </div>
      ) : (
        /* CHOOSE COPY MODE */
        <div className="space-y-4 pt-1">
          <div className="space-y-3">
            {/* Synced Copy Option */}
            <div
              onClick={() => setCopyMode("synced")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                copyMode === "synced"
                  ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    copyMode === "synced"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Synced Copy (Read-Only)
                    </h4>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      Live sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    A read-only copy that automatically displays the latest content whenever the creator presses Save. You can convert it to a Personal Copy anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Copy Option */}
            <div
              onClick={() => setCopyMode("personal")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                copyMode === "personal"
                  ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    copyMode === "personal"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Personal Copy (Editable)
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Independent
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Create an independent note that you can freely edit, format, and save. Future saves by the creator will not modify your personal copy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Saved privately in your personal account. Creator cannot see your private edits.</span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => handleSave(false)} isLoading={isSaving}>
              Save to My Notes
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
