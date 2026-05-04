import { describe, it, vi, expect } from "vitest";
import { POST } from '@/app/api/ask/route'
import { NextRequest } from "next/server";
import { ask } from "@/lib/rag";

vi.mock("@/lib/store", () => ({
  getVectorStore: vi.fn(() => ({}))
}))

vi.mock("@/lib/rag", () => ({
  ask: vi.fn(async () => "A class is a blueprint for objects.")
}))

describe("POST /api/ask", () => {

  it('return 200 ask', async () => {
    const question: string = "what is a class in TypeScript?"
    const req = new NextRequest("http://localhost:3000", {
      method: 'POST',
      body: JSON.stringify({ question: question })
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty("answer")
  })

  it('return 400 no question - ask', async () => {
    const req = new NextRequest("http://localhost:3000", {
      method: 'POST',
      body: JSON.stringify({ question: "" })
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toHaveProperty("error", "Question cannot be empty.")
  })

  it('return 400 no pdf indexed - ask', async () => {
    const { getVectorStore } = await import("@/lib/store")
    vi.mocked(getVectorStore).mockReturnValueOnce(null)

    const req = new NextRequest("http://localhost:3000", {
      method: 'POST',
      body: JSON.stringify({ question: "what is a class?" })
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toHaveProperty("error", "No PDF indexed yet. Please upload a PDF first.")
  })

  it('return 500 failed to get answer - ask', async () => {
    vi.mocked(ask).mockRejectedValueOnce(new Error("LLM failed"))

    const req = new NextRequest("http://localhost:3000", {
      method: "POST",
      body: JSON.stringify({ question: "what is a class" })
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data).toHaveProperty("error", "Failed to get an answer. Check server logs for details.")
  })
})