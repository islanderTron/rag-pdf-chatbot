/**
 * config.ts
 * Reads all settings from .env — nothing else in the app touches process.env directly.
 */

export const config = {
  // ── Provider ──────────────────────────────────────────────────────────────
  // Change LLM_PROVIDER in .env to switch models. No code changes needed.
  // Supported: "ollama" | "openai" | "anthropic"
  llmProvider: process.env.LLM_PROVIDER ?? "ollama",

  // ── Ollama (free, local) ──────────────────────────────────────────────────
  ollama: {
    model:     process.env.OLLAMA_MODEL      ?? "llama3.2:1b",
    embedModel:process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
    baseUrl:   process.env.OLLAMA_BASE_URL   ?? "http://localhost:11434",
  },

  // ── OpenAI / ChatGPT ──────────────────────────────────────────────────────
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model:  process.env.OPENAI_MODEL   ?? "gpt-4o-mini",
  },

  // ── Anthropic / Claude ────────────────────────────────────────────────────
  // Note: Anthropic has no embeddings API.
  // When LLM_PROVIDER=anthropic, embeddings fall back to OpenAI.
  // Set OPENAI_API_KEY in .env alongside ANTHROPIC_API_KEY.
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model:  process.env.ANTHROPIC_MODEL   ?? "claude-haiku-4-5-20251001",
  },

  // ── RAG settings ──────────────────────────────────────────────────────────
  rag: {
    chunkSize:    500,  // characters per chunk
    chunkOverlap: 50,   // overlap between chunks to avoid missing context
    topK:         3,    // number of relevant chunks to retrieve per question
  },
} as const;
