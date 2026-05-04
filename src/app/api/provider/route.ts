import { NextRequest, NextResponse } from "next/server";
import { getActiveProvider, setActiveProvider } from "@/lib/providerState";

export async function GET() {
  return NextResponse.json({ provider: getActiveProvider() });
}

export async function POST(req: NextRequest) {
  const { provider } = await req.json();

  if (!["ollama", "openai", "anthropic"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }
  setActiveProvider(provider);
  return NextResponse.json({ provider });
}
