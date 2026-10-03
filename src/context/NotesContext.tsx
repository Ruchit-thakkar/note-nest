"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  Note,
  Tag,
  FilterView,
  SortOption,
  SaveState,
  PublicNote,
  ShareSettings,
} from "@/types";
import {
  subscribeNotes,
  subscribeTags,
  createNote as apiCreateNote,
  saveNoteWithVersion as apiSaveNoteWithVersion,
  updateNote as apiUpdateNote,
  moveNoteToTrash,
  restoreNoteFromTrash,
  permanentDeleteNote,
  emptyTrash as apiEmptyTrash,
  toggleFavoriteNote,
  duplicateNote as apiDuplicateNote,
  createTag as apiCreateTag,
  deleteTag as apiDeleteTag,
  publishNote as apiPublishNote,
  unpublishNote as apiUnpublishNote,
  updateShareSettings as apiUpdateShareSettings,
  convertSyncedToPersonal as apiConvertSyncedToPersonal,
  getPublicNote as apiGetPublicNote,
  subscribePublicNote,
  updateNoteAIStatus,
} from "@/services/firestore";
import {
  indexSavedNote,
  deleteNoteFromIndex,
  rebuildUserAIIndex,
} from "@/services/aiService";

interface NotesContextType {
  notes: Note[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  activeNote: Note | null;

  // Views and filtering
  view: FilterView;
  setView: (view: FilterView) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: SortOption;
  setSortOption: (opt: SortOption) => void;

  // Computed lists
  filteredNotes: Note[];
  trashedNotesCount: number;
  favoritesCount: number;
  sharedNotesCount: number;
  publishedNotesCount: number;
  getTagNoteCount: (tag: string) => number;

  // Explicit Save & State (NO AUTOSAVE)
  saveStatus: SaveState;
  setSaveStatus: (status: SaveState) => void;
  saveNote: (
    noteId: string,
    updates: { title?: string; content?: string; tags?: string[] }
  ) => Promise<{ version: number }>;

  // Actions
  createNewNote: () => Promise<string>;
  trashNote: (noteId: string) => Promise<void>;
  restoreNote: (noteId: string) => Promise<void>;
  deletePermanently: (noteId: string) => Promise<void>;
  emptyAllTrash: () => Promise<void>;
  toggleFavorite: (noteId: string) => Promise<void>;
  duplicateNote: (noteId: string) => Promise<string>;
  addTagToNote: (noteId: string, tag: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tag: string) => Promise<void>;

  // Tags CRUD
  createTag: (name: string) => Promise<string>;
  deleteTag: (id: string, name: string) => Promise<void>;

  // Publishing & Sharing
  publishCurrentNote: (
    noteId: string,
    settings?: Partial<ShareSettings>
  ) => Promise<{ publicId: string; version: number }>;
  unpublishCurrentNote: (noteId: string, publicId: string) => Promise<void>;
  updateCurrentNoteShareSettings: (
    publicId: string,
    settings: Partial<ShareSettings>
  ) => Promise<void>;
  convertToPersonal: (noteId: string) => Promise<void>;
  getPublicNoteDetails: (publicId: string) => Promise<PublicNote | null>;

  // Phase 3: AI Vector Indexing
  retryIndexNote: (noteId: string) => Promise<void>;
  rebuildFullAIIndex: () => Promise<{ success: boolean; indexedCount: number; error?: string }>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [view, setView] = useState<FilterView>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("updated_desc");

  // Save State: 'saved' | 'unsaved' | 'saving' | 'error'
  const [saveStatus, setSaveStatus] = useState<SaveState>("saved");

  // Keep a ref to latest notes for listeners
  const notesRef = useRef<Note[]>([]);
  notesRef.current = notes;

  // Active sync subscriptions by sourcePublicId
  const syncListenersRef = useRef<Map<string, () => void>>(new Map());

  // Subscribe to user's notes and tags
  useEffect(() => {
    if (!user) {
      setNotes([]);
      setTags([]);
      setActiveNoteId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubNotes = subscribeNotes(
      user.uid,
      (fetchedNotes) => {
        setNotes(fetchedNotes);
        setLoading(false);
      },
      (err) => {
        console.error("Notes subscription error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubTags = subscribeTags(
      user.uid,
      (fetchedTags) => {
        setTags(fetchedTags);
      },
      (err) => {
        console.error("Tags subscription error:", err);
      }
    );

    return () => {
      unsubNotes();
      unsubTags();
    };
  }, [user]);

  // Real-time listener for synced notes:
  // Detects when the source creator clicks SAVE and publishes a new version
  useEffect(() => {
    if (!user) {
      // Clean up all sync listeners
      syncListenersRef.current.forEach((unsub) => unsub());
      syncListenersRef.current.clear();
      return;
    }

    // Find all active synced notes
    const syncedNotes = notes.filter(
      (n) =>
        (n.copyType === "synced" || n.syncMode === "synced") &&
        !!n.sourcePublicId &&
        !n.isTrash
    );

    const currentPublicIds = new Set(syncedNotes.map((n) => n.sourcePublicId!));

    // Remove subscriptions for notes no longer present as synced
    syncListenersRef.current.forEach((unsub, publicId) => {
      if (!currentPublicIds.has(publicId)) {
        unsub();
        syncListenersRef.current.delete(publicId);
      }
    });

    // Add subscriptions for newly added synced notes
    syncedNotes.forEach((syncedNote) => {
      const publicId = syncedNote.sourcePublicId!;
      if (syncListenersRef.current.has(publicId)) return;

      const unsub = subscribePublicNote(
        publicId,
        async (publicData) => {
          // Find the current note in local state ref
          const currentLocalNote = notesRef.current.find(
            (n) => n.sourcePublicId === publicId && !n.isTrash
          );
          if (!currentLocalNote) return;

          // Case 1: Original note was permanently deleted
          if (!publicData) {
            if (currentLocalNote.sourceStatus !== "deleted") {
              await apiUpdateNote(user.uid, currentLocalNote.id, {
                sourceStatus: "deleted",
                isOriginalDeleted: true,
              });
            }
            return;
          }

          // Case 2: Original note was unpublished
          if (!publicData.isPublished) {
            if (currentLocalNote.sourceStatus !== "unpublished") {
              await apiUpdateNote(user.uid, currentLocalNote.id, {
                sourceStatus: "unpublished",
              });
            }
            return;
          }

          // Case 3: Original note is published. Check if author pressed SAVE on a newer version
          const newVersion = publicData.currentVersion || 1;
          const currentSyncedVersion =
            currentLocalNote.sourceVersion ||
            currentLocalNote.lastSyncedVersion ||
            1;

          if (newVersion > currentSyncedVersion) {
            // Author saved new version -> update User B's synced copy in Firestore
            await apiUpdateNote(user.uid, currentLocalNote.id, {
              title: publicData.title,
              content: publicData.content || "",
              plainText: publicData.plainText || "",
              tags: publicData.tags || [],
              sourceVersion: newVersion,
              lastSyncedVersion: newVersion,
              sourceStatus: "active",
              isOriginalDeleted: false,
            });
          }
        },
        (err) => {
          console.warn("Public note listener error:", err);
        }
      );

      syncListenersRef.current.set(publicId, unsub);
    });
  }, [user, notes]);

  // Clean up sync listeners on unmount
  useEffect(() => {
    return () => {
      syncListenersRef.current.forEach((unsub) => unsub());
      syncListenersRef.current.clear();
    };
  }, []);

  // Compute active note
  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Reset active note if it no longer exists
  useEffect(() => {
    if (activeNoteId && !notes.some((n) => n.id === activeNoteId)) {
      setActiveNoteId(null);
    }
  }, [notes, activeNoteId]);

  // Compute counts
  const trashedNotesCount = useMemo(() => {
    return notes.filter((n) => n.isTrash).length;
  }, [notes]);

  const favoritesCount = useMemo(() => {
    return notes.filter((n) => !n.isTrash && n.isFavorite).length;
  }, [notes]);

  const sharedNotesCount = useMemo(() => {
    return notes.filter((n) => !n.isTrash && !!n.sourcePublicId).length;
  }, [notes]);

  const publishedNotesCount = useMemo(() => {
    return notes.filter((n) => !n.isTrash && !!n.isPublished).length;
  }, [notes]);

  const getTagNoteCount = useCallback(
    (tag: string) => {
      const clean = tag.toLowerCase().replace(/^#/, "");
      return notes.filter(
        (n) =>
          !n.isTrash &&
          n.tags &&
          n.tags.some((t) => t.toLowerCase() === clean)
      ).length;
    },
    [notes]
  );

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by view
    if (view === "trash") {
      result = result.filter((n) => n.isTrash);
    } else {
      result = result.filter((n) => !n.isTrash);

      if (view === "favorites") {
        result = result.filter((n) => n.isFavorite);
      } else if (view === "shared") {
        result = result.filter((n) => !!n.sourcePublicId);
      } else if (view === "published") {
        result = result.filter((n) => !!n.isPublished);
      } else if (view === "tag" && selectedTag) {
        const cleanTag = selectedTag.toLowerCase().replace(/^#/, "");
        result = result.filter(
          (n) => n.tags && n.tags.some((t) => t.toLowerCase() === cleanTag)
        );
      } else if (view === "recent") {
        result = result.slice(0, 15);
      }
    }

    // Filter by search query (Title, Content/PlainText, Tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((note) => {
        const titleMatch = (note.title || "").toLowerCase().includes(q);
        const contentMatch = (note.plainText || note.content || "").toLowerCase().includes(q);
        const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(q));
        return titleMatch || contentMatch || tagMatch;
      });
    }

    // Sort notes
    result.sort((a, b) => {
      const getTime = (ts: any) => {
        if (!ts) return 0;
        if (ts.toMillis) return ts.toMillis();
        if (ts.seconds) return ts.seconds * 1000;
        if (ts instanceof Date) return ts.getTime();
        return new Date(ts).getTime() || 0;
      };

      switch (sortOption) {
        case "updated_desc":
          return getTime(b.updatedAt) - getTime(a.updatedAt);
        case "updated_asc":
          return getTime(a.updatedAt) - getTime(b.updatedAt);
        case "created_desc":
          return getTime(b.createdAt) - getTime(a.createdAt);
        case "created_asc":
          return getTime(a.createdAt) - getTime(b.createdAt);
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "", undefined, {
            sensitivity: "base",
          });
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "", undefined, {
            sensitivity: "base",
          });
        default:
          return getTime(b.updatedAt) - getTime(a.updatedAt);
      }
    });

    return result;
  }, [notes, view, selectedTag, searchQuery, sortOption]);

  // Actions
  const createNewNote = async (): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    const initialTags: string[] =
      view === "tag" && selectedTag ? [selectedTag.replace(/^#/, "")] : [];

    const newId = await apiCreateNote(user.uid, {
      title: "Untitled Note",
      content: "",
      tags: initialTags,
    });

    setActiveNoteId(newId);
    setSaveStatus("saved");
    return newId;
  };

  const indexNoteInBackground = useCallback(
    async (noteId: string, version: number, title: string, content: string) => {
      if (!user) return;
      try {
        await updateNoteAIStatus(user.uid, noteId, "processing");
        const token = await user.getIdToken();
        const res = await indexSavedNote(token, {
          noteId,
          title,
          content,
          version,
        });
        if (res.success) {
          await updateNoteAIStatus(user.uid, noteId, "indexed", version);
        } else {
          console.warn("AI index warning:", res.error);
          await updateNoteAIStatus(user.uid, noteId, "failed");
        }
      } catch (err) {
        console.warn("AI index error:", err);
        await updateNoteAIStatus(user.uid, noteId, "failed");
      }
    },
    [user]
  );

  /**
   * Explicit SAVE handler (no autosave).
   * Validates note, updates content, updates updatedAt,
   * increases version, and propagates to publicNotes if published.
   */
  const saveNote = async (
    noteId: string,
    updates: { title?: string; content?: string; tags?: string[] }
  ): Promise<{ version: number }> => {
    if (!user) throw new Error("User not authenticated");
    const target = notes.find((n) => n.id === noteId);
    if (!target) throw new Error("Note not found");

    if (target.copyType === "synced" || target.syncMode === "synced") {
      throw new Error("Cannot save changes to a read-only Synced Copy");
    }

    setSaveStatus("saving");
    try {
      const res = await apiSaveNoteWithVersion(user.uid, noteId, target, updates);
      setSaveStatus("saved");

      // Phase 3: Trigger asynchronous non-blocking AI vector indexing
      const newTitle = updates.title !== undefined ? updates.title : target.title;
      const newContent = updates.content !== undefined ? updates.content : target.content || "";
      indexNoteInBackground(noteId, res.version, newTitle, newContent);

      return res;
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      throw err;
    }
  };

  const retryIndexNote = useCallback(
    async (noteId: string) => {
      const target = notes.find((n) => n.id === noteId);
      if (!target) return;
      await indexNoteInBackground(target.id, target.version || 1, target.title, target.content || "");
    },
    [notes, indexNoteInBackground]
  );

  const rebuildFullAIIndex = useCallback(async () => {
    if (!user) return { success: false, indexedCount: 0, error: "Not authenticated" };
    try {
      const activeNotes = notes.filter((n) => !n.isTrash);
      const token = await user.getIdToken();
      return await rebuildUserAIIndex(
        token,
        activeNotes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content || "",
          version: n.version || 1,
        }))
      );
    } catch (err: any) {
      return { success: false, indexedCount: 0, error: err.message };
    }
  }, [user, notes]);

  const trashNote = async (noteId: string) => {
    if (!user) return;
    await moveNoteToTrash(user.uid, noteId);
  };

  const restoreNote = async (noteId: string) => {
    if (!user) return;
    await restoreNoteFromTrash(user.uid, noteId);
  };

  const deletePermanently = async (noteId: string) => {
    if (!user) return;
    const target = notes.find((n) => n.id === noteId);
    await permanentDeleteNote(user.uid, noteId, target?.publicId);
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
    }
    // Clean up vectors from Pinecone in background
    user.getIdToken().then((token) => deleteNoteFromIndex(token, noteId)).catch(() => {});
  };

  const emptyAllTrash = async () => {
    if (!user) return;
    const trashed = notes
      .filter((n) => n.isTrash)
      .map((n) => ({ id: n.id, publicId: n.publicId }));
    await apiEmptyTrash(user.uid, trashed);
    if (activeNoteId && trashed.some((t) => t.id === activeNoteId)) {
      setActiveNoteId(null);
    }
    // Clean up vectors from Pinecone in background
    user.getIdToken().then((token) => {
      trashed.forEach((t) => deleteNoteFromIndex(token, t.id).catch(() => {}));
    }).catch(() => {});
  };

  const toggleFavorite = async (noteId: string) => {
    if (!user) return;
    const target = notes.find((n) => n.id === noteId);
    if (target) {
      await toggleFavoriteNote(user.uid, noteId, target.isFavorite);
    }
  };

  const duplicateNote = async (noteId: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    const target = notes.find((n) => n.id === noteId);
    if (!target) throw new Error("Note not found");
    const newId = await apiDuplicateNote(user.uid, target);
    setActiveNoteId(newId);
    setSaveStatus("saved");
    return newId;
  };

  const addTagToNote = async (noteId: string, rawTag: string) => {
    if (!user) return;
    const clean = rawTag.trim().toLowerCase().replace(/^#/, "");
    if (!clean) return;

    const target = notes.find((n) => n.id === noteId);
    if (target) {
      const existing = target.tags || [];
      if (!existing.includes(clean)) {
        await apiUpdateNote(user.uid, noteId, { tags: [...existing, clean] });
      }
    }

    await apiCreateTag(user.uid, clean);
  };

  const removeTagFromNote = async (noteId: string, rawTag: string) => {
    if (!user) return;
    const clean = rawTag.trim().toLowerCase().replace(/^#/, "");
    const target = notes.find((n) => n.id === noteId);
    if (target) {
      const updated = (target.tags || []).filter((t) => t.toLowerCase() !== clean);
      await apiUpdateNote(user.uid, noteId, { tags: updated });
    }
  };

  const createTag = async (name: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    return await apiCreateTag(user.uid, name);
  };

  const deleteTag = async (id: string, name: string): Promise<void> => {
    if (!user) return;
    await apiDeleteTag(user.uid, id, name);
    if (selectedTag === name) {
      setSelectedTag(null);
      setView("all");
    }
  };

  // Publishing & Sharing Actions
  const publishCurrentNote = async (
    noteId: string,
    settings?: Partial<ShareSettings>
  ): Promise<{ publicId: string; version: number }> => {
    if (!user) throw new Error("User not authenticated");
    const target = notes.find((n) => n.id === noteId);
    if (!target) throw new Error("Note not found");

    const creatorName =
      userProfile?.displayName ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Note Nest Creator";
    return await apiPublishNote(user.uid, creatorName, target, settings);
  };

  const unpublishCurrentNote = async (
    noteId: string,
    publicId: string
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    await apiUnpublishNote(user.uid, noteId, publicId);
  };

  const updateCurrentNoteShareSettings = async (
    publicId: string,
    settings: Partial<ShareSettings>
  ): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    await apiUpdateShareSettings(publicId, settings);
  };

  const convertToPersonal = async (noteId: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    await apiConvertSyncedToPersonal(user.uid, noteId);
  };

  const getPublicNoteDetails = async (
    publicId: string
  ): Promise<PublicNote | null> => {
    return await apiGetPublicNote(publicId);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        tags,
        loading,
        error,
        activeNoteId,
        setActiveNoteId,
        activeNote,
        view,
        setView,
        selectedTag,
        setSelectedTag,
        searchQuery,
        setSearchQuery,
        sortOption,
        setSortOption,
        filteredNotes,
        trashedNotesCount,
        favoritesCount,
        sharedNotesCount,
        publishedNotesCount,
        getTagNoteCount,
        saveStatus,
        setSaveStatus,
        saveNote,
        createNewNote,
        trashNote,
        restoreNote,
        deletePermanently,
        emptyAllTrash,
        toggleFavorite,
        duplicateNote,
        addTagToNote,
        removeTagFromNote,
        createTag,
        deleteTag,
        publishCurrentNote,
        unpublishCurrentNote,
        updateCurrentNoteShareSettings,
        convertToPersonal,
        getPublicNoteDetails,
        retryIndexNote,
        rebuildFullAIIndex,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
