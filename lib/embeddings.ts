// Sentence embeddings via @xenova/transformers. Model: Xenova/all-MiniLM-L6-v2.
// 384-dim, mean-pooled, L2-normalised. Runs locally, no API key.

type FeaturePipeline = (
  input: string | string[],
  options?: { pooling?: 'mean' | 'cls' | 'none'; normalize?: boolean }
) => Promise<{ data: Float32Array | number[]; dims: number[] }>;

let pipelinePromise: Promise<FeaturePipeline> | null = null;

export const EMBEDDING_DIM = 384;
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';

async function getPipeline(): Promise<FeaturePipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const transformers = await import('@xenova/transformers');
      transformers.env.allowLocalModels = false;
      const pipe = await transformers.pipeline('feature-extraction', EMBEDDING_MODEL, {
        quantized: true,
      });
      return pipe as unknown as FeaturePipeline;
    })();
  }
  return pipelinePromise;
}

export async function embed(text: string): Promise<number[]> {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const pipe = await getPipeline();
  const output = await pipe(texts, { pooling: 'mean', normalize: true });
  const data = output.data as Float32Array;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    out.push(Array.from(data.slice(i * EMBEDDING_DIM, (i + 1) * EMBEDDING_DIM)));
  }
  return out;
}

export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}
