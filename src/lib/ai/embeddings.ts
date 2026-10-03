import { Pinecone } from "@pinecone-database/pinecone";

export type EmbeddingInputType = "passage" | "query";

export interface EmbeddingProvider {
  name: string;
  dimension: number;
  generateEmbeddings(texts: string[], inputType?: EmbeddingInputType): Promise<number[][]>;
}

/**
 * Pinecone Serverless Inference Embedding Provider.
 * Model: multilingual-e5-large (1024 dimensions)
 * Included natively with PINECONE_API_KEY without requiring external embedding services.
 */
class PineconeInferenceEmbeddingProvider implements EmbeddingProvider {
  name = "pinecone-inference";
  dimension = 1024;
  private model = process.env.EMBEDDING_MODEL || "multilingual-e5-large";

  async generateEmbeddings(texts: string[], inputType: EmbeddingInputType = "passage"): Promise<number[][]> {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY is not defined in server environment variables.");
    }

    const pc = new Pinecone({ apiKey });
    
    // Pinecone inference supports batch embeddings
    const cleanTexts = texts.map((t) => t.trim().slice(0, 4000) || "Empty");

    const response = await pc.inference.embed({
      model: this.model,
      inputs: cleanTexts,
      parameters: {
        inputType: inputType,
        truncate: "END",
      },
    });

    // Pinecone inference returns response.data with embedding records
    const results: number[][] = [];
    const items = response.data || [];
    for (const item of items) {
      if (item && Array.isArray((item as any).values)) {
        results.push((item as any).values);
      } else if (Array.isArray(item)) {
        results.push(item);
      }
    }

    if (results.length !== cleanTexts.length) {
      throw new Error(`Embedding count mismatch: expected ${cleanTexts.length}, got ${results.length}`);
    }

    return results;
  }
}

/**
 * Active embedding provider instance.
 * Easily swappable without changing any caller in Note Nest.
 */
const activeProvider: EmbeddingProvider = new PineconeInferenceEmbeddingProvider();

export async function generateEmbeddings(
  texts: string[],
  inputType: EmbeddingInputType = "passage"
): Promise<number[][]> {
  if (texts.length === 0) return [];
  return await activeProvider.generateEmbeddings(texts, inputType);
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const result = await activeProvider.generateEmbeddings([query], "query");
  return result[0];
}

export function getEmbeddingDimension(): number {
  return activeProvider.dimension;
}
