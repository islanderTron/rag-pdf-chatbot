# RAG PDF Chatbot

A Retrieval-Augmented Generation (RAG) app built with **TypeScript + Next.js**. Upload any PDF and chat with its contents in a clean web UI.

Supports three AI providers — swap between them by changing **one environment variable**. No code changes needed.

---

## Features

- Upload any PDF and chat with its contents
- Answers are grounded in the document — no hallucination outside it
- Switch AI providers without changing any code
- Fully local option via Docker + Ollama — no API key or cost required

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| RAG framework | LangChain JS |
| Vector store | MemoryVectorStore (in-memory) |
| PDF parsing | pdf-parse |
| LLM (local) | Ollama — llama3.2:1b |
| LLM (cloud) | OpenAI GPT-4o-mini or Anthropic Claude |

---

## Running with Docker (recommended)

The easiest way to run the app with Ollama fully managed — no local Ollama install needed.

```bash
docker compose up --build
```

This starts three services:

| Service | Role |
|---|---|
| `server` | Next.js app on port 3000 |
| `ollama` | Ollama model server |
| `ollama-pull` | One-shot container that pulls models into a shared volume, then exits |

Models (`llama3.2:1b` and `nomic-embed-text`) are downloaded in parallel on first run and cached in a Docker volume — subsequent starts are instant.

Open [http://localhost:3000](http://localhost:3000) once the server is up.

---

## Running locally (without Docker)

### 1. Install dependencies

```bash
bum install
```

### 2. Configure your provider

```bash
cp .env.example .env.local
```

Open `.env.local` and set `LLM_PROVIDER`:

| Value | Description |
|---|---|
| `ollama` | Free, runs locally. No API key needed. |
| `openai` | ChatGPT. Needs `OPENAI_API_KEY`. |
| `anthropic` | Claude. Needs `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` (for embeddings). |

### 3. (Ollama only) Pull models

Download Ollama from [ollama.com](https://ollama.com), then:

```bash
ollama pull llama3.2:1b
ollama pull nomic-embed-text
```

### 4. Start the dev server

```bash
bum run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Switching Providers

Edit one variable in `.env.local` (or pass it to `docker compose`):

```env
# Free, fully local (default)
LLM_PROVIDER=ollama

# ChatGPT
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Claude (also needs OpenAI key for embeddings)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Restart the server — that's it.

You can also switch between `ollama` and `anthropic` at runtime without a restart by POSTing to the provider endpoint:

```bash
curl -X POST http://localhost:3000/api/provider \
  -H "Content-Type: application/json" \
  -d '{"provider":"anthropic"}'
```

`GET /api/provider` returns the currently active provider.

---

## Project Structure

```
rag-pdf-chatbot/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Chat UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── upload/route.ts     # PDF upload + indexing
│   │       ├── ask/route.ts        # Question answering
│   │       └── provider/route.ts   # GET/POST active LLM provider at runtime
│   └── lib/
│       ├── config.ts               # All settings read from environment variables
│       ├── llmProvider.ts          # Provider abstraction (LLM + embeddings)
│       ├── providerState.ts        # In-memory active-provider state (runtime switching)
│       ├── rag.ts                  # RAG pipeline: chunk → embed → retrieve → answer
│       └── store.ts                # In-memory vector store singleton
├── Dockerfile
├── compose.yaml
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## How It Works

1. **Upload a PDF** — pages are split into 500-character chunks with 50-character overlap
2. **Chunks are embedded** — converted into vectors and stored in memory
3. **You ask a question** — the top 3 most relevant chunks are retrieved by similarity
4. **LLM answers** — using only the retrieved context, not its general knowledge

---

## License

MIT
