import { Pinecone } from "@pinecone-database/pinecone";
import { NoteChunk } from "@/types";

function getPineconeClient(): Pinecone {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not defined in server environment variables.");
  }
  return new Pinecone({ apiKey });
}

export function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME || "note-nest";
  const indexHost = process.env.PINECONE_INDEX_HOST;
  const pc = getPineconeClient();
  return indexHost ? pc.index(indexName, indexHost) : pc.index(indexName);
}

/**
 * Upserts note chunks into Pinecone.
 * Cleans up old version vectors for this note first to prevent outdated chunk pollution.
 */
export async function upsertNoteToPinecone(
  userId: string,
  noteId: string,
  version: number,
  chunks: NoteChunk[],
  embeddings: number[][]
): Promise<void> {
  const index = getPineconeIndex();

  // 1. Delete previous version vectors for this specific note
  try {
    await index.deleteMany({
      filter: {
        userId: { $eq: userId },
        noteId: { $eq: noteId },
      },
    });
  } catch (err) {
    console.warn("Pinecone cleanup warning (non-fatal):", err);
  }

  // 2. Prepare vectors with user isolation metadata
  const records = chunks.map((chunk, idx) => ({
    id: chunk.chunkId,
    values: embeddings[idx],
    metadata: {
      userId: chunk.userId,
      noteId: chunk.noteId,
      chunkId: chunk.chunkId,
      noteVersion: chunk.noteVersion,
      noteTitle: chunk.noteTitle,
      heading: chunk.heading || "Section",
      content: chunk.content,
    },
  }));

  // 3. Upsert in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await index.upsert({ records: batch });
  }
}

/**
 * Deletes all vectors for a deleted note from Pinecone.
 */
export async function deleteNoteFromPinecone(userId: string, noteId: string): Promise<void> {
  const index = getPineconeIndex();
  try {
    await index.deleteMany({
      filter: {
        userId: { $eq: userId },
        noteId: { $eq: noteId },
      },
    });
  } catch (err) {
    console.warn("Pinecone delete error:", err);
  }
}

export interface RetrievedChunk {
  chunkId: string;
  noteId: string;
  noteTitle: string;
  heading: string;
  content: string;
  version: number;
  score: number;
}

/**
 * Similarity vector search strictly isolated to the authenticated user.
 */
export async function searchSimilarChunks(
  userId: string,
  queryVector: number[],
  topK: number = 6,
  excludeNoteId?: string
): Promise<RetrievedChunk[]> {
  const index = getPineconeIndex();

  const filter: any = {
    userId: { $eq: userId },
  };

  if (excludeNoteId) {
    filter.noteId = { $ne: excludeNoteId };
  }

  const queryResponse = await index.query({
    vector: queryVector,
    topK,
    filter,
    includeMetadata: true,
  });

  const matches = queryResponse.matches || [];
  const results: RetrievedChunk[] = [];

  for (const match of matches) {
    const meta = match.metadata as any;
    if (meta && meta.content) {
      results.push({
        chunkId: (meta.chunkId as string) || match.id,
        noteId: meta.noteId as string,
        noteTitle: meta.noteTitle as string,
        heading: (meta.heading as string) || "Section",
        content: meta.content as string,
        version: Number(meta.noteVersion) || 1,
        score: match.score || 0,
      });
    }
  }

  return results;
}
