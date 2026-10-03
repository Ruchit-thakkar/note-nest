import Groq from "groq-sdk";
import { RetrievedChunk } from "./pinecone";
import { AISourceCitation, ExplainMode } from "@/types";

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in server environment variables.");
  }
  return new Groq({ apiKey });
}

// Fallback models in priority order: first env, then ultra-fast Groq models
const FALLBACK_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
].filter(Boolean) as string[];

/**
 * Resilient Groq completions caller with automatic model fallback.
 */
async function callGroqWithFallback(
  groq: Groq,
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  temperature = 0.2,
  max_tokens = 1024
): Promise<string> {
  const models = Array.from(new Set(FALLBACK_MODELS));
  let lastError: any = null;

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (content) return content;
    } catch (err: any) {
      lastError = err;
      // If model not found or decommissioned, try next in list
      if (
        err.status === 404 ||
        err.message?.includes("model") ||
        err.error?.code === "model_not_found"
      ) {
        console.warn(`Groq model '${model}' not available. Trying fallback...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("All Groq models failed to respond.");
}

/**
 * Answers a user's question using strictly retrieved note context.
 * Adheres strictly to the anti-hallucination and truthfulness guidelines.
 */
export async function generateAnswerWithContext(
  question: string,
  contextChunks: RetrievedChunk[],
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ answer: string; sources: AISourceCitation[] }> {
  // If no chunks were retrieved at all, return an honest not-found answer immediately without calling Groq
  if (!contextChunks || contextChunks.length === 0) {
    return {
      answer:
        "I couldn't find any relevant information in your saved notes to answer this question. Make sure your notes are saved and try rephrasing your search.",
      sources: [],
    };
  }

  const groq = getGroqClient();

  // Deduplicate and prepare source citations
  const sourcesMap = new Map<string, AISourceCitation>();
  for (const chunk of contextChunks) {
    if (!sourcesMap.has(chunk.noteId)) {
      sourcesMap.set(chunk.noteId, {
        noteId: chunk.noteId,
        noteTitle: chunk.noteTitle || "Untitled Note",
        chunkSnippet:
          chunk.content.slice(0, 160) + (chunk.content.length > 160 ? "..." : ""),
        version: chunk.version,
        score: chunk.score,
      });
    }
  }
  const sources = Array.from(sourcesMap.values());

  // Format retrieved context blocks
  const formattedContext = contextChunks
    .map(
      (chunk, i) =>
        `--- Context Item [${i + 1}] ---\nNote Title: "${chunk.noteTitle}"\nHeading: "${chunk.heading}"\nContent:\n${chunk.content}\n`
    )
    .join("\n");

  const systemPrompt = `You are the user's personal notes assistant in Note Nest.
Your task is to answer the user's question using ONLY the provided note context below.

CRITICAL RULES:
1. Answer using ONLY the provided note context.
2. Do not invent, extrapolate, or hallucinate information that is not directly supported by the context.
3. If the answer cannot be found in the user's notes, clearly and honestly state: "I couldn't find that information in your notes."
4. Do not claim that information came from the user's notes unless it actually exists in the retrieved context.
5. Format your response cleanly using Markdown (bullet points, bold text, code blocks if applicable).
6. Mention which note(s) contributed to the answer where appropriate.

RETRIEVED NOTE CONTEXT:
${formattedContext}`;

  // Limit conversation history to last 4 messages to save context space
  const recentHistory = conversationHistory.slice(-4).map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: question },
  ];

  const answer = await callGroqWithFallback(groq, messages, 0.2, 1024);

  return {
    answer,
    sources,
  };
}

/**
 * Summarizes a saved note's content without modifying the note.
 */
export async function summarizeNoteText(title: string, content: string): Promise<string> {
  const groq = getGroqClient();

  const prompt = `You are an expert personal knowledge assistant in Note Nest.
Please provide a comprehensive yet concise summary of the following note.

Note Title: "${title || "Untitled"}"

Note Content:
${content}

Format your summary with:
- 📌 **Core Summary** (1-2 sentences)
- 🔑 **Key Takeaways & Highlights** (bullet points)
- 💡 **Action Items / Next Steps** (if applicable)

Keep the formatting clean, professional, and directly rooted in the note.`;

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You summarize personal notes accurately and concisely using clean markdown.",
    },
    { role: "user", content: prompt },
  ];

  return await callGroqWithFallback(groq, messages, 0.3, 800);
}

/**
 * Explains a note in different modes (simple, beginner, key_points, revision).
 */
export async function explainNoteText(
  title: string,
  content: string,
  mode: ExplainMode
): Promise<string> {
  const groq = getGroqClient();

  let modeInstruction = "";
  switch (mode) {
    case "simple":
      modeInstruction =
        "Explain this note in plain, direct, and straightforward language. Avoid unnecessary jargon, break down complex concepts into everyday terms, and keep it crisp.";
      break;
    case "beginner":
      modeInstruction =
        "Explain this note as if teaching a complete beginner. Use intuitive analogies, define any technical terms clearly, and guide the reader step-by-step.";
      break;
    case "key_points":
      modeInstruction =
        "Extract the most essential key points, core facts, and critical concepts from this note into a structured, prioritized bulleted list.";
      break;
    case "revision":
      modeInstruction =
        "Turn this note into high-yield revision and study notes. Include a quick-review summary, key formula/definitions, and 3-4 self-assessment review questions with answers.";
      break;
    default:
      modeInstruction = "Explain the core concepts and context of this note clearly.";
  }

  const prompt = `Note Title: "${title || "Untitled"}"

Content:
${content}

Instruction:
${modeInstruction}

Please format the response nicely with Markdown.`;

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are an empathetic, insightful tutor and personal knowledge assistant in Note Nest.",
    },
    { role: "user", content: prompt },
  ];

  return await callGroqWithFallback(groq, messages, 0.3, 1024);
}
