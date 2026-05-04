import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/upload/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/rag", () => ({
  indexPDF: vi.fn().mockResolvedValue({ id: "fake-store" }),
}));

vi.mock("@/lib/store", () => ({
  setVectorStore: vi.fn(),
}));

function makePdfRequest(filename: string, content: Buffer): NextRequest {
  const file = new File([content], filename, { type: "application/pdf" });
  const form = new FormData();
  form.append("file", file);
  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/upload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with filename on a valid PDF", async () => {
    const req = makePdfRequest("sample.pdf", Buffer.from("%PDF-1.4 fake content"));
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, filename: "sample.pdf" });
  });

  it("returns 400 when no file is attached", async () => {
    const form = new FormData();
    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: form,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no file/i);
  });

  it("returns 400 when file is not a PDF", async () => {
    const req = makePdfRequest("notes.txt", Buffer.from("hello world"));
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/only pdf/i);
  });
});
