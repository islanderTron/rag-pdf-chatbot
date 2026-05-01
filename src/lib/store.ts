/**
 * store.ts
 * ────────
 * Module-level singleton that holds the active MemoryVectorStore.
 *
 * Why not a database? For a learning project, keeping the index in memory
 * is the simplest approach — no extra services to run. The PDF is re-indexed
 * each time you upload it through the UI, which is fine for a portfolio demo.
 *
 * This module persists between API route calls within the same Next.js process.
 */

import { FakeVectorStore as MemoryVectorStore } from "@langchain/core/utils/testing";

let vectorStore: MemoryVectorStore | null = null;
let indexedFileName: string | null = null;

export function getVectorStore(): MemoryVectorStore | null {
  return vectorStore;
}

export function setVectorStore(store: MemoryVectorStore, fileName: string): void {
  vectorStore = store;
  indexedFileName = fileName;
}

export function getIndexedFileName(): string | null {
  return indexedFileName;
}
