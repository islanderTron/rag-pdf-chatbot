/**
 * rag.ts
 * ──────
 * Core RAG pipeline:
 *   1. Load a PDF from disk and split it into chunks
 *   2. Embed the chunks and store them in a MemoryVectorStore
 *   3. Given a question, retrieve the most relevant chunks
 *   4. Send context + question to the LLM and return the answer
 */

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FakeVectorStore as MemoryVectorStore } from "@langchain/core/utils/testing";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getLLM, getEmbeddings } from "./llmProvider";
import { config } from "./config";

// ── Prompt ────────────────────────────────────────────────────────────────────
// The LLM is instructed to answer ONLY from the provided context.
// This prevents hallucination outside the uploaded document.

const PROMPT = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant. Answer the question using ONLY the context below.
If the answer is not in the context, say: "I couldn't find that in the document."

Context:
{context}

Question: {question}

Answer:`);


// ── Step 1 & 2: Load PDF → chunk → embed → MemoryVectorStore ─────────────────

export async function indexPDF(filePath: string): Promise<MemoryVectorStore> {
  // Load all pages from the PDF
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();

  // Split pages into smaller overlapping chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize:    config.rag.chunkSize,
    chunkOverlap: config.rag.chunkOverlap,
  });
  const chunks = await splitter.splitDocuments(docs);

  // Embed chunks and store in memory (no database server needed)
  const embeddings = getEmbeddings();
  return MemoryVectorStore.fromDocuments(chunks, embeddings);
}


// ── Step 3 & 4: Retrieve relevant chunks + ask the LLM ───────────────────────

export async function ask(
  question: string,
  vectorStore: MemoryVectorStore
): Promise<string> {
  // Find the top-K most relevant chunks for the question
  const docs = await vectorStore.similaritySearch(question, config.rag.topK);
  const context = docs.map((d) => d.pageContent).join("\n\n");

  // Build the prompt and send to the LLM
  const llm = getLLM();
  const chain = PROMPT.pipe(llm);
  const response = await chain.invoke({ context, question });

  // LangChain returns an AIMessage — extract just the text
  return response.content as string;
}
