import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  where,
  increment,
  Unsubscribe,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { Note, Tag, UserProfile, UserSettings, PublicNote, ShareSettings, CopyType, AIIndexStatus } from "@/types";
import { stripHtml } from "@/lib/utils";

// ================= USER PROFILE ================= //
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      photoURL: user.photoURL,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(userRef, newProfile, { merge: true });
    return newProfile;
  } else {
    const data = snap.data() as UserProfile;
    if (user.photoURL && user.photoURL !== data.photoURL) {
      await updateDoc(userRef, { photoURL: user.photoURL, updatedAt: Date.now() });
    }
    return data;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { ...data, updatedAt: Date.now() });
}

// ================= USER SETTINGS ================= //
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const settingsRef = doc(db, "users", userId, "settings", "preferences");
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  const defaultSettings: UserSettings = {
    theme: "system",
    accentColor: "amber",
  };
  await setDoc(settingsRef, defaultSettings, { merge: true });
  return defaultSettings;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const settingsRef = doc(db, "users", userId, "settings", "preferences");
  await setDoc(settingsRef, settings, { merge: true });
}

// ================= NOTES SERVICE ================= //
export function subscribeNotes(
  userId: string,
  onUpdate: (notes: Note[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const notesRef = collection(db, "users", userId, "notes");

  return onSnapshot(
    notesRef,
    (snapshot) => {
      const notes: Note[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId,
          title: data.title || "Untitled",
          content: data.content || "",
          plainText: data.plainText || stripHtml(data.content || ""),
          tags: Array.isArray(data.tags) ? data.tags : [],
          isFavorite: !!data.isFavorite,
          isTrash: !!data.isTrash,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          deletedAt: data.deletedAt || null,
          // Publishing fields
          isPublished: !!data.isPublished,
          publicId: data.publicId || null,
          version: data.version || 1,
          // Relationship fields for synced or personal copies
          sourcePublicId: data.sourcePublicId || null,
          sourceNoteId: data.sourceNoteId || null,
          sourceOwnerId: data.sourceOwnerId || null,
          sourceCreatorName: data.sourceCreatorName || null,
          copyType: (data.copyType || data.syncMode || null) as CopyType | null,
          syncMode: (data.copyType || data.syncMode || null) as CopyType | null,
          sourceVersion: data.sourceVersion || data.lastSyncedVersion || 1,
          lastSyncedVersion: data.sourceVersion || data.lastSyncedVersion || 1,
          sourceStatus: data.sourceStatus || (data.isOriginalDeleted ? "deleted" : "active"),
          isOriginalDeleted: !!data.isOriginalDeleted,
          createdFromSharedNoteAt: data.createdFromSharedNoteAt || null,
          // Phase 3: AI Vector Indexing metadata
          aiIndexStatus: data.aiIndexStatus || "idle",
          aiIndexedVersion: data.aiIndexedVersion || 0,
          aiIndexedAt: data.aiIndexedAt || null,
        } as Note;
      });
      onUpdate(notes);
    },
    (error) => {
      console.error("Firestore subscribeNotes error:", error);
      onError?.(error);
    }
  );
}

export async function createNote(
  userId: string,
  data: Partial<Note> = {}
): Promise<string> {
  const notesRef = collection(db, "users", userId, "notes");
  const content = data.content || "";
  const plainText = data.plainText || stripHtml(content);

  const docRef = await addDoc(notesRef, {
    title: data.title || "Untitled Note",
    content: content,
    plainText: plainText,
    tags: data.tags || [],
    isFavorite: !!data.isFavorite,
    isTrash: false,
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });

  return docRef.id;
}

/**
 * Explicit SAVE button handler:
 * Validates note, updates complete content, updates updatedAt,
 * increases note version, and if published, propagates to publicNotes
 * so synced copies immediately receive the new saved content.
 */
export async function saveNoteWithVersion(
  userId: string,
  noteId: string,
  currentNote: Note,
  updates: { title?: string; content?: string; tags?: string[] }
): Promise<{ version: number }> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  const newVersion = (currentNote.version || 0) + 1;
  const newTitle = (updates.title !== undefined ? updates.title : currentNote.title).trim() || "Untitled Note";
  const newContent = updates.content !== undefined ? updates.content : currentNote.content || "";
  const newPlainText = stripHtml(newContent);
  const newTags = updates.tags !== undefined ? updates.tags : (currentNote.tags || []);

  const notePayload: any = {
    title: newTitle,
    content: newContent,
    plainText: newPlainText,
    tags: newTags,
    version: newVersion,
    updatedAt: serverTimestamp(),
  };

  // 1. Save note in user's collection
  await updateDoc(noteRef, notePayload);

  // 2. If published, propagate immediately to publicNotes so public reader & synced copies receive it
  if (currentNote.isPublished && currentNote.publicId) {
    const pubRef = doc(db, "publicNotes", currentNote.publicId);
    await updateDoc(pubRef, {
      title: newTitle,
      content: newContent,
      plainText: newPlainText,
      tags: newTags,
      currentVersion: newVersion,
      updatedAt: serverTimestamp(),
    });
  }

  return { version: newVersion };
}

export async function updateNote(
  userId: string,
  noteId: string,
  updates: Partial<Note>
): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  const payload: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (updates.content !== undefined) {
    payload.plainText = updates.plainText ?? stripHtml(updates.content);
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  await updateDoc(noteRef, payload);
}

export async function updateNoteAIStatus(
  userId: string,
  noteId: string,
  status: AIIndexStatus,
  version?: number
): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  const payload: any = {
    aiIndexStatus: status,
    updatedAt: serverTimestamp(),
  };
  if (version !== undefined) {
    payload.aiIndexedVersion = version;
    payload.aiIndexedAt = Date.now();
  }
  await updateDoc(noteRef, payload).catch((err) => console.warn("Failed to update AI status:", err));
}

export async function moveNoteToTrash(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isTrash: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function restoreNoteFromTrash(userId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isTrash: false,
    deletedAt: null,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentDeleteNote(
  userId: string,
  noteId: string,
  publicId?: string | null
): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await deleteDoc(noteRef);

  // If this note was published, also delete or mark public record as deleted
  if (publicId) {
    try {
      const pubRef = doc(db, "publicNotes", publicId);
      await deleteDoc(pubRef);
    } catch (e) {
      console.warn("Could not delete public note record:", e);
    }
  }
}

export async function emptyTrash(userId: string, trashedNotes: { id: string; publicId?: string | null }[]): Promise<void> {
  if (trashedNotes.length === 0) return;
  const batch = writeBatch(db);
  trashedNotes.forEach((item) => {
    const ref = doc(db, "users", userId, "notes", item.id);
    batch.delete(ref);
    if (item.publicId) {
      const pubRef = doc(db, "publicNotes", item.publicId);
      batch.delete(pubRef);
    }
  });
  await batch.commit();
}

export async function toggleFavoriteNote(
  userId: string,
  noteId: string,
  currentFavorite: boolean
): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isFavorite: !currentFavorite,
    updatedAt: serverTimestamp(),
  });
}

export async function duplicateNote(userId: string, note: Note): Promise<string> {
  const notesRef = collection(db, "users", userId, "notes");
  const docRef = await addDoc(notesRef, {
    title: `${note.title || "Untitled"} (Copy)`,
    content: note.content || "",
    plainText: note.plainText || "",
    tags: [...note.tags],
    isFavorite: false,
    isTrash: false,
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });
  return docRef.id;
}

// ================= TAGS SERVICE ================= //
export function subscribeTags(
  userId: string,
  onUpdate: (tags: Tag[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const tagsRef = collection(db, "users", userId, "tags");

  return onSnapshot(
    tagsRef,
    (snapshot) => {
      const tags: Tag[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        userId,
        ...docSnap.data(),
      })) as Tag[];
      tags.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      onUpdate(tags);
    },
    (error) => {
      console.error("Firestore subscribeTags error:", error);
      onError?.(error);
    }
  );
}

export async function createTag(
  userId: string,
  name: string,
  color: string = "slate"
): Promise<string> {
  const cleanName = name.trim().toLowerCase().replace(/^#/, "");
  if (!cleanName) return "";

  const tagsRef = collection(db, "users", userId, "tags");
  const q = query(tagsRef, where("name", "==", cleanName));
  const existing = await getDocs(q);
  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const docRef = await addDoc(tagsRef, {
    name: cleanName,
    color,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteTag(
  userId: string,
  tagId: string,
  tagName?: string
): Promise<void> {
  const tagRef = doc(db, "users", userId, "tags", tagId);
  await deleteDoc(tagRef);

  if (tagName) {
    const clean = tagName.trim().toLowerCase().replace(/^#/, "");
    const notesRef = collection(db, "users", userId, "notes");
    const q = query(notesRef, where("tags", "array-contains", clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const updated = (data.tags || []).filter((t: string) => t.toLowerCase() !== clean);
        batch.update(docSnap.ref, { tags: updated, updatedAt: serverTimestamp() });
      });
      await batch.commit();
    }
  }
}

// ================= PUBLISHING & SHARING ================= //

export function generatePublicId(length: number = 11): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function publishNote(
  userId: string,
  userDisplayName: string,
  note: Note,
  settings?: Partial<ShareSettings>
): Promise<{ publicId: string; version: number }> {
  const publicId = note.publicId || generatePublicId(11);
  const currentVersion = note.version || 1;
  const pubRef = doc(db, "publicNotes", publicId);
  const snap = await getDoc(pubRef);
  const existing = snap.exists() ? (snap.data() as Partial<PublicNote>) : null;

  const payload: any = {
    publicId,
    noteId: note.id,
    ownerId: userId,
    creatorName: userDisplayName || "Note Nest User",
    title: note.title || "Untitled Note",
    content: note.content || "",
    plainText: note.plainText || stripHtml(note.content || ""),
    tags: note.tags || [],
    isPublished: true,
    publishedAt: existing?.publishedAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    currentVersion: currentVersion,
    allowCopy: settings?.allowCopy ?? existing?.allowCopy ?? true,
    showCreator: settings?.showCreator ?? existing?.showCreator ?? true,
    showTags: settings?.showTags ?? existing?.showTags ?? true,
    allowIndexing: settings?.allowIndexing ?? existing?.allowIndexing ?? false,
    viewsCount: existing?.viewsCount || 0,
    copiesCount: existing?.copiesCount || 0,
    accessType: settings?.accessType || existing?.accessType || "free",
    price: settings?.price || existing?.price || 0,
    currency: settings?.currency || existing?.currency || "USD",
  };

  await setDoc(pubRef, payload, { merge: true });

  // Update original note document
  const noteRef = doc(db, "users", userId, "notes", note.id);
  await updateDoc(noteRef, {
    isPublished: true,
    publicId,
    version: currentVersion,
    updatedAt: serverTimestamp(),
  });

  return { publicId, version: currentVersion };
}

export async function unpublishNote(
  userId: string,
  noteId: string,
  publicId: string
): Promise<void> {
  const pubRef = doc(db, "publicNotes", publicId);
  await updateDoc(pubRef, {
    isPublished: false,
    updatedAt: serverTimestamp(),
  });

  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    isPublished: false,
    updatedAt: serverTimestamp(),
  });
}

export async function updateShareSettings(
  publicId: string,
  settings: Partial<ShareSettings>
): Promise<void> {
  const pubRef = doc(db, "publicNotes", publicId);
  await updateDoc(pubRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  });
}

export async function getPublicNote(publicId: string): Promise<PublicNote | null> {
  const pubRef = doc(db, "publicNotes", publicId);
  const snap = await getDoc(pubRef);
  if (!snap.exists()) return null;
  return snap.data() as PublicNote;
}

export function subscribePublicNote(
  publicId: string,
  onUpdate: (note: PublicNote | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const pubRef = doc(db, "publicNotes", publicId);
  return onSnapshot(
    pubRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate(snap.data() as PublicNote);
      }
    },
    (err) => {
      console.warn("Firestore subscribePublicNote error:", err);
      onError?.(err);
    }
  );
}

export async function incrementPublicNoteViews(publicId: string): Promise<void> {
  try {
    const pubRef = doc(db, "publicNotes", publicId);
    await updateDoc(pubRef, {
      viewsCount: increment(1),
    });
  } catch (err) {
    console.warn("Failed to increment views:", err);
  }
}

/**
 * Creates either a Synced Copy (read-only, linked to source)
 * or a Personal Copy (independent, editable).
 * Full rich content is saved.
 */
export async function addPublicNoteToMyNotes(
  userId: string,
  publicNote: PublicNote,
  copyType: CopyType
): Promise<string> {
  const notesRef = collection(db, "users", userId, "notes");

  // Check if user already added this note as a synced copy
  if (copyType === "synced") {
    const q = query(
      notesRef,
      where("sourcePublicId", "==", publicNote.publicId),
      where("isTrash", "==", false)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      return existing.docs[0].id;
    }
  }

  const isSynced = copyType === "synced";

  const docRef = await addDoc(notesRef, {
    title: publicNote.title,
    content: publicNote.content || "",
    plainText: publicNote.plainText || "",
    tags: publicNote.showTags ? [...(publicNote.tags || [])] : [],
    isFavorite: false,
    isTrash: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    // Relationship fields
    copyType: copyType,
    syncMode: copyType,
    sourcePublicId: isSynced ? publicNote.publicId : null,
    sourceNoteId: isSynced ? publicNote.noteId : null,
    sourceOwnerId: isSynced ? publicNote.ownerId : null,
    sourceCreatorName: publicNote.showCreator ? publicNote.creatorName : "Note Nest User",
    sourceVersion: isSynced ? (publicNote.currentVersion || 1) : 1,
    lastSyncedVersion: isSynced ? (publicNote.currentVersion || 1) : 1,
    sourceStatus: "active",
    version: 1,
    isOriginalDeleted: false,
    createdFromSharedNoteAt: Date.now(),
  });

  // Increment copies counter on public note
  try {
    const pubRef = doc(db, "publicNotes", publicNote.publicId);
    await updateDoc(pubRef, {
      copiesCount: increment(1),
    });
  } catch (err) {
    console.warn("Failed to increment copies count:", err);
  }

  return docRef.id;
}

/**
 * Converts a Synced Copy to an independent Personal Copy.
 * Immediately unlocks editing and breaks the link to future original saves.
 */
export async function convertSyncedToPersonal(
  userId: string,
  noteId: string
): Promise<void> {
  const noteRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(noteRef, {
    copyType: "personal",
    syncMode: "personal",
    sourcePublicId: null,
    sourceNoteId: null,
    sourceOwnerId: null,
    sourceStatus: null,
    updatedAt: serverTimestamp(),
  });
}
