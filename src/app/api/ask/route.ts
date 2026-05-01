/**
 * POST /api/ask
 * ─────────────
 * Receives a question, retrieves relevant chunks from the in-memory
 * vector store, and returns an answer from the configured LLM.
 */

import { NextRequest, NextResponse } from "next/server";
import { ask } from "@/lib/rag";
import { getVectorStore } from "@/lib/store";
import { getActiveProvider } from "@/lib/providerState";

export async function POST(req: NextRequest) {
  try {
    const provider = getActiveProvider();
    const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
    const openaiKey = process.env.OPENAI_API_KEY ?? "";
    console.log("[/api/ask] provider=%s anthropicKey=%s openaiKey=%s", provider,
      anthropicKey ? `${anthropicKey.slice(0, 14)}...(len=${anthropicKey.length})` : "MISSING",
      openaiKey ? `${openaiKey.slice(0, 10)}...(len=${openaiKey.length})` : "MISSING",
    );

    const { question } = (await req.json()) as { question?: string };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question cannot be empty." }, { status: 400 });
    }

    const vectorStore = getVectorStore();
    if (!vectorStore) {
      return NextResponse.json(
        { error: "No PDF indexed yet. Please upload a PDF first." },
        { status: 400 }
      );
    }

    const answer = await ask(question, vectorStore);
    return NextResponse.json({ answer });

  } catch (err) {
    console.error("[/api/ask] Error:", err);
    return NextResponse.json(
      { error: "Failed to get an answer. Check server logs for details." },
      { status: 500 }
    );
  }
}
