import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/server/auth";
import { summarizeNoteText } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    await verifyAuthToken(req);

    // 2. Parse request body
    const body = await req.json();
    const { title, content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "The note does not contain any content to summarize." }, { status: 400 });
    }

    // 3. Summarize saved note content using Groq
    try {
      const summary = await summarizeNoteText(title || "Untitled Note", content);
      return NextResponse.json({ summary });
    } catch (groqErr: any) {
      console.error("Groq summarization error:", groqErr);
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Could not summarize note." },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error("AI Summarize route error:", err);
    if (
      err.message?.includes("Authentication") ||
      err.message?.includes("Authorization") ||
      err.message?.includes("token")
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate summary.", details: err.message },
      { status: 500 }
    );
  }
}
