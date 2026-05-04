import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/provider/route";
import { NextRequest } from "next/server";

describe("GET /api/provider", () => {
  it('return 200 to get the provider', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty("provider")
  })
})

describe("POST /api/provider", () => {
  it('return 200 after selected the provider', async () => {
    const provider = {
      provider: "ollama"
    }
    const req = new NextRequest("http://localhost/api/provider", {
      method: "POST",
      body: JSON.stringify(provider)
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ provider: "ollama" })
  })

  it('return 400 with the provider', async () => {
    const non_provider = {
      provider: "random"
    }

    const req = new NextRequest("http://localhost/api/provider", {
      method: "POST",
      body: JSON.stringify(non_provider)
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toEqual({ error: "Invalid provider." })
  })
})