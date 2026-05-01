/**
 * POST /api/upload
 * ────────────────
 * Receives a PDF file via FormData, saves it to a temp path,
 * indexes it into a MemoryVectorStore, and stores it in the module singleton.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { indexPDF } from "@/lib/rag";
import { setVectorStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    // Write the uploaded file to a temp location so PDFLoader can read it
    const buffer = Buffer.from(await file.arrayBuffer());
    tmpPath = join(tmpdir(), `rag-upload-${Date.now()}.pdf`);
    await writeFile(tmpPath, buffer);

    // Index the PDF — this embeds all chunks into the MemoryVectorStore
    const vectorStore = await indexPDF(tmpPath);
    setVectorStore(vectorStore, file.name);

    return NextResponse.json({ success: true, filename: file.name });

  } catch (err) {
    console.error("[/api/upload] Error:", err);
    return NextResponse.json(
      { error: "Failed to index PDF. Check server logs for details." },
      { status: 500 }
    );

  } finally {
    // Always clean up the temp file
    if (tmpPath) {
      await unlink(tmpPath).catch(() => {});
    }
  }
}
