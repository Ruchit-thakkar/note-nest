import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/server/auth";
import { explainNoteText } from "@/lib/ai/groq";
import { ExplainMode } from "@/types";

const VALID_MODES: ExplainMode[] = ["simple", "beginner", "key_points", "revision"];

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    await verifyAuthToken(req);

    // 2. Parse request body
    const body = await req.json();
    const { title, content, mode } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "The note does not contain any content to explain." }, { status: 400 });
    }

    const explainMode: ExplainMode = VALID_MODES.includes(mode) ? mode : "simple";

    // 3. Explain saved note content using Groq
    try {
      const explanation = await explainNoteText(title || "Untitled Note", content, explainMode);
      return NextResponse.json({ explanation, mode: explainMode });
    } catch (groqErr: any) {
      console.error("Groq explanation error:", groqErr);
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Could not explain note." },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error("AI Explain route error:", err);
    if (
      err.message?.includes("Authentication") ||
      err.message?.includes("Authorization") ||
      err.message?.includes("token")
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to explain note.", details: err.message },
      { status: 500 }
    );
  }
}
