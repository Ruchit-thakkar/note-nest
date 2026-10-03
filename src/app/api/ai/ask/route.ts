import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/server/auth";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";
import { searchSimilarChunks } from "@/lib/ai/pinecone";
import { generateAnswerWithContext } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await verifyAuthToken(req);

    // 2. Parse request body
    const body = await req.json();
    const { question, conversationHistory } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Please provide a valid question." }, { status: 400 });
    }

    const trimmedQuestion = question.trim().slice(0, 1000);

    // 3. Generate query embedding
    let queryVector: number[];
    try {
      queryVector = await generateQueryEmbedding(trimmedQuestion);
    } catch (embErr: any) {
      console.error("Embedding generation failed:", embErr);
      return NextResponse.json(
        { error: "AI search is temporarily unavailable. (Embedding service error)" },
        { status: 503 }
      );
    }

    // 4. Vector search in Pinecone strictly isolated to user.uid
    let relevantChunks = [];
    try {
      relevantChunks = await searchSimilarChunks(user.uid, queryVector, 6);
    } catch (pineconeErr: any) {
      console.error("Pinecone search failed:", pineconeErr);
      return NextResponse.json(
        { error: "AI search is temporarily unavailable. (Vector database error)" },
        { status: 503 }
      );
    }

    // 5. Generate AI answer using Groq with retrieved note chunks
    try {
      const { answer, sources } = await generateAnswerWithContext(
        trimmedQuestion,
        relevantChunks,
        Array.isArray(conversationHistory) ? conversationHistory : []
      );

      return NextResponse.json({
        answer,
        sources,
        chunksRetrieved: relevantChunks.length,
      });
    } catch (groqErr: any) {
      console.error("Groq generation failed:", groqErr);
      return NextResponse.json(
        { error: "AI is temporarily unavailable. (LLM generation error)" },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error("AI Ask route error:", err);

    if (
      err.message?.includes("Authentication") ||
      err.message?.includes("Authorization") ||
      err.message?.includes("token")
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred while processing your question.", details: err.message },
      { status: 500 }
    );
  }
}
