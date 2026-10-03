import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/server/auth";
import { chunkNoteContent } from "@/lib/ai/chunking";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { upsertNoteToPinecone, deleteNoteFromPinecone } from "@/lib/ai/pinecone";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await verifyAuthToken(req);

    // 2. Parse request body
    const body = await req.json();
    const { noteId, title, content, version, action } = body;

    if (!noteId) {
      return NextResponse.json({ error: "Missing required noteId" }, { status: 400 });
    }

    // Handle delete action
    if (action === "delete") {
      await deleteNoteFromPinecone(user.uid, noteId);
      return NextResponse.json({ success: true, message: "Note vectors deleted from index" });
    }

    // Handle index action
    if (!content && content !== "") {
      return NextResponse.json({ error: "Missing content for indexing" }, { status: 400 });
    }

    const noteVersion = typeof version === "number" ? version : 1;
    const noteTitle = (title || "Untitled Note").slice(0, 200);

    // 3. Chunk the saved note content
    const chunks = chunkNoteContent(user.uid, noteId, noteVersion, noteTitle, content);

    if (chunks.length === 0) {
      // Empty note or no text content: clean up any old vectors and return success
      await deleteNoteFromPinecone(user.uid, noteId);
      return NextResponse.json({
        success: true,
        chunksCount: 0,
        version: noteVersion,
        message: "Empty note index cleaned",
      });
    }

    // 4. Generate embeddings for chunks
    const chunkTexts = chunks.map((c: any) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts, "passage");

    // 5. Upsert to Pinecone strictly under authenticated user's ID
    await upsertNoteToPinecone(user.uid, noteId, noteVersion, chunks, embeddings);

    return NextResponse.json({
      success: true,
      chunksCount: chunks.length,
      version: noteVersion,
      indexedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("AI Indexing route error:", err);

    if (err.message?.includes("Authentication") || err.message?.includes("Authorization") || err.message?.includes("token")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    if (err.message?.includes("PINECONE_API_KEY") || err.message?.includes("Pinecone")) {
      return NextResponse.json(
        { error: "AI indexing service is temporarily unavailable.", details: err.message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to index note content.", details: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
