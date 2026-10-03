import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/server/auth";
import { chunkNoteContent } from "@/lib/ai/chunking";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { upsertNoteToPinecone } from "@/lib/ai/pinecone";

interface NotePayload {
  id: string;
  title: string;
  content: string;
  version?: number;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await verifyAuthToken(req);

    // 2. Parse request body
    const body = await req.json();
    const notes: NotePayload[] = body.notes;

    if (!Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json(
        { error: "No saved notes provided for rebuilding the AI index." },
        { status: 400 }
      );
    }

    // Safeguard: limit batch size to 50 notes per request to prevent timeouts
    const batch = notes.slice(0, 50);
    let successfullyIndexed = 0;

    for (const note of batch) {
      if (!note.id || (!note.content && note.content !== "")) continue;

      const noteVersion = typeof note.version === "number" ? note.version : 1;
      const chunks = chunkNoteContent(
        user.uid,
        note.id,
        noteVersion,
        note.title || "Untitled Note",
        note.content
      );

      if (chunks.length > 0) {
        const chunkTexts = chunks.map((c: any) => c.content);
        const embeddings = await generateEmbeddings(chunkTexts, "passage");
        await upsertNoteToPinecone(user.uid, note.id, noteVersion, chunks, embeddings);
        successfullyIndexed++;
      }
    }

    return NextResponse.json({
      success: true,
      indexedCount: successfullyIndexed,
      totalSubmitted: batch.length,
    });
  } catch (err: any) {
    console.error("AI Reindex route error:", err);
    if (
      err.message?.includes("Authentication") ||
      err.message?.includes("Authorization") ||
      err.message?.includes("token")
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to reindex notes.", details: err.message },
      { status: 500 }
    );
  }
}
