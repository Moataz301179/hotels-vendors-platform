// Stub — re-export from extracted LLM wrapper
export { executeLLM } from "@/lib/ai/llm";

export async function createEmbedding(_text: string): Promise<number[]> {
  return new Array(1536).fill(0);
}
