import {
  AISearchResult,
  AISourceCitation,
  AIIndexStatus,
  ExplainMode,
  Note,
} from "@/types";

export interface AskMyNotesResponse {
  answer: string;
  sources: AISourceCitation[];
  chunksRetrieved?: number;
}

export interface RelatedNoteItem {
  noteId: string;
  noteTitle: string;
  heading: string;
  snippet: string;
  score: number;
}

/**
 * Pings the server AI Index route to chunk, embed, and index a saved note.
 * Non-blocking for the user. Never blocks Firestore saving.
 */
export async function indexSavedNote(
  idToken: string,
  payload: {
    noteId: string;
    title: string;
    content: string;
    version: number;
  }
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    const res = await fetch("/api/ai/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: data.error || `Indexing failed with HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return { success: true, version: data.version };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error during indexing" };
  }
}

/**
 * Deletes vectors for a note from Pinecone index.
 */
export async function deleteNoteFromIndex(
  idToken: string,
  noteId: string
): Promise<{ success: boolean }> {
  try {
    const res = await fetch("/api/ai/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ noteId, action: "delete" }),
    });
    return { success: res.ok };
  } catch (err) {
    console.warn("deleteNoteFromIndex failed:", err);
    return { success: false };
  }
}

/**
 * Asks a natural language question about the authenticated user's saved notes.
 */
export async function askMyNotes(
  idToken: string,
  question: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<AskMyNotesResponse> {
  const res = await fetch("/api/ai/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ question, conversationHistory }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "AI service is temporarily unavailable.");
  }

  return await res.json();
}

/**
 * Generates an on-demand summary for a saved note.
 */
export async function summarizeNote(
  idToken: string,
  title: string,
  content: string
): Promise<string> {
  const res = await fetch("/api/ai/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "AI is temporarily unavailable.");
  }

  const data = await res.json();
  return data.summary;
}

/**
 * Explains a saved note in the selected mode.
 */
export async function explainNote(
  idToken: string,
  title: string,
  content: string,
  mode: ExplainMode
): Promise<string> {
  const res = await fetch("/api/ai/explain", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ title, content, mode }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "AI is temporarily unavailable.");
  }

  const data = await res.json();
  return data.explanation;
}

/**
 * Fetches semantically related notes for the active note.
 */
export async function fetchRelatedNotes(
  idToken: string,
  noteId: string,
  title: string,
  content: string
): Promise<RelatedNoteItem[]> {
  const res = await fetch("/api/ai/related", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ noteId, title, content }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not retrieve related notes.");
  }

  const data = await res.json();
  return data.relatedNotes || [];
}

/**
 * Rebuilds the user's AI Index for all their saved notes.
 */
export async function rebuildUserAIIndex(
  idToken: string,
  notes: { id: string; title: string; content: string; version?: number }[]
): Promise<{ success: boolean; indexedCount: number; error?: string }> {
  try {
    const res = await fetch("/api/ai/reindex", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ notes }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        indexedCount: 0,
        error: data.error || "Failed to rebuild index.",
      };
    }

    const data = await res.json();
    return {
      success: true,
      indexedCount: data.indexedCount || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      indexedCount: 0,
      error: err.message || "Network error while rebuilding index.",
    };
  }
}
