import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/server/auth";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";
import { searchSimilarChunks } from "@/lib/ai/pinecone";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await verifyAuthToken(req);

    // 2. Parse request body
    const body = await req.json();
    const { noteId, title, content } = body;

    if (!noteId) {
      return NextResponse.json({ error: "Missing required noteId" }, { status: 400 });
    }

    const queryText = `${title || ""} ${(content || "").replace(/<[^>]*>/g, " ").slice(0, 600)}`.trim();
    if (!queryText) {
      return NextResponse.json({ relatedNotes: [] });
    }

    // 3. Generate query embedding from note content
    let queryVector: number[];
    try {
      queryVector = await generateQueryEmbedding(queryText);
    } catch (embErr: any) {
      console.error("Embedding generation failed in related notes:", embErr);
      return NextResponse.json(
        { error: "AI related notes search is temporarily unavailable." },
        { status: 503 }
      );
    }

    // 4. Search Pinecone for similar chunks belonging to this user, excluding the current note
    const chunks = await searchSimilarChunks(user.uid, queryVector, 8, noteId);

    // 5. Deduplicate by noteId, keeping highest scoring chunk
    const uniqueNotesMap = new Map<
      string,
      {
        noteId: string;
        noteTitle: string;
        heading: string;
        snippet: string;
        score: number;
      }
    >();

    for (const chunk of chunks) {
      if (!uniqueNotesMap.has(chunk.noteId)) {
        uniqueNotesMap.set(chunk.noteId, {
          noteId: chunk.noteId,
          noteTitle: chunk.noteTitle || "Untitled Note",
          heading: chunk.heading || "Section",
          snippet: chunk.content.slice(0, 150) + (chunk.content.length > 150 ? "..." : ""),
          score: chunk.score,
        });
      }
    }

    const relatedNotes = Array.from(uniqueNotesMap.values()).slice(0, 4);

    return NextResponse.json({ relatedNotes });
  } catch (err: any) {
    console.error("AI Related route error:", err);
    if (
      err.message?.includes("Authentication") ||
      err.message?.includes("Authorization") ||
      err.message?.includes("token")
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to find related notes.", details: err.message },
      { status: 500 }
    );
  }
}
