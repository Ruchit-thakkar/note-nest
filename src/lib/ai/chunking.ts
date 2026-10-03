import { NoteChunk } from "@/types";

interface ChunkingOptions {
  maxChunkSize?: number; // Target max characters per chunk (default: 800)
  overlapSize?: number;  // Overlap characters between chunks (default: 100)
}

/**
 * Cleanly strips HTML tags while preserving text breaks for paragraphs, headings, and list items.
 */
export function cleanHtmlToSections(html: string): { heading: string; text: string }[] {
  if (!html || !html.trim()) return [];

  // Replace block elements with distinct markers
  let formatted = html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n### $1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<blockquote[^>]*>/gi, "\n> ")
    .replace(/<\/blockquote>/gi, "\n")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ") // Remove all other tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const lines = formatted.split("\n").map((l) => l.trim()).filter(Boolean);

  const sections: { heading: string; text: string }[] = [];
  let currentHeading = "Overview";
  let currentBuffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (currentBuffer.length > 0) {
        sections.push({
          heading: currentHeading,
          text: currentBuffer.join("\n"),
        });
        currentBuffer = [];
      }
      currentHeading = line.replace(/^###\s+/, "").trim() || "Section";
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentBuffer.length > 0) {
    sections.push({
      heading: currentHeading,
      text: currentBuffer.join("\n"),
    });
  }

  return sections;
}

/**
 * Splits saved note content into context-rich, semantic chunks.
 * Preserves note title, section heading, and sentence boundaries.
 */
export function chunkNote(
  note: {
    id: string;
    userId: string;
    title: string;
    version: number;
    content: string;
  },
  options: ChunkingOptions = {}
): NoteChunk[] {
  const maxChunkSize = options.maxChunkSize || 800;
  const overlapSize = options.overlapSize || 100;

  const sections = cleanHtmlToSections(note.content || "");
  const chunks: NoteChunk[] = [];
  let chunkIndex = 0;

  // If empty or very short
  if (sections.length === 0) {
    const fallbackText = note.title || "Empty Note";
    chunks.push({
      chunkId: `${note.id}_v${note.version}_c0`,
      noteId: note.id,
      userId: note.userId,
      noteVersion: note.version,
      noteTitle: note.title || "Untitled Note",
      content: fallbackText,
      heading: "Overview",
    });
    return chunks;
  }

  for (const section of sections) {
    const sectionText = section.text.trim();
    if (!sectionText) continue;

    // If section fits in a single chunk
    if (sectionText.length <= maxChunkSize) {
      chunks.push({
        chunkId: `${note.id}_v${note.version}_c${chunkIndex++}`,
        noteId: note.id,
        userId: note.userId,
        noteVersion: note.version,
        noteTitle: note.title || "Untitled Note",
        content: sectionText,
        heading: section.heading,
      });
      continue;
    }

    // Split sectionText into paragraphs or sentences with overlap
    const sentences = sectionText.split(/(?<=[.?!])\s+/);
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + " " + sentence).trim().length <= maxChunkSize) {
        currentChunk = (currentChunk + " " + sentence).trim();
      } else {
        if (currentChunk) {
          chunks.push({
            chunkId: `${note.id}_v${note.version}_c${chunkIndex++}`,
            noteId: note.id,
            userId: note.userId,
            noteVersion: note.version,
            noteTitle: note.title || "Untitled Note",
            content: currentChunk,
            heading: section.heading,
          });

          // Carry over overlap
          const overlap = currentChunk.slice(-overlapSize);
          currentChunk = (overlap + " " + sentence).trim();
        } else {
          // Sentence itself exceeds maxChunkSize, split by character window
          let remaining = sentence;
          while (remaining.length > 0) {
            const piece = remaining.slice(0, maxChunkSize);
            chunks.push({
              chunkId: `${note.id}_v${note.version}_c${chunkIndex++}`,
              noteId: note.id,
              userId: note.userId,
              noteVersion: note.version,
              noteTitle: note.title || "Untitled Note",
              content: piece,
              heading: section.heading,
            });
            remaining = remaining.slice(maxChunkSize - overlapSize);
            if (remaining.length <= overlapSize) break;
          }
          currentChunk = "";
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        chunkId: `${note.id}_v${note.version}_c${chunkIndex++}`,
        noteId: note.id,
        userId: note.userId,
        noteVersion: note.version,
        noteTitle: note.title || "Untitled Note",
        content: currentChunk.trim(),
        heading: section.heading,
      });
    }
  }

  return chunks;
}

/**
 * Convenience helper to chunk note content directly from fields.
 */
export function chunkNoteContent(
  userId: string,
  noteId: string,
  version: number,
  title: string,
  content: string,
  options: ChunkingOptions = {}
): NoteChunk[] {
  return chunkNote(
    {
      id: noteId,
      userId,
      title: title || "Untitled Note",
      version,
      content,
    },
    options
  );
}
