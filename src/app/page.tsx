"use client";

import { useState, useRef, useEffect } from "react";

function renderMessageContent(content: string) {
  const parts = content.split(/```/);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const newline = part.indexOf("\n");
      const code = newline !== -1 ? part.slice(newline + 1) : part;
      return (
        <pre
          key={i}
          className="my-2 rounded-lg bg-zinc-900 text-zinc-100 px-4 py-3 text-xs overflow-x-auto font-mono whitespace-pre dark:bg-black/60 dark:ring-1 dark:ring-white/10"
        >
          <code>{code}</code>
        </pre>
      );
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const PROVIDERS = ["ollama", "openai", "anthropic"] as const;
type Provider = typeof PROVIDERS[number];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Home() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [question, setQuestion]     = useState("");
  const [pdfName, setPdfName]       = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isAsking, setIsAsking]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [provider, setProvider]     = useState<Provider>("ollama");
  const [isDark, setIsDark]         = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Sync theme state with the class set by the pre-paint script
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Load active provider from server on mount
  useEffect(() => {
    fetch("/api/provider").then(r => r.json()).then(d => setProvider(d.provider));
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleProviderChange(p: Provider) {
    setProvider(p);
    await fetch("/api/provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: p }),
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsIndexing(true);
    setMessages([]);
    setPdfName(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    setIsIndexing(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
    } else {
      setPdfName(data.filename);
      setMessages([{
        role: "assistant",
        content: `PDF "${data.filename}" indexed! Ask me anything about it.`,
      }]);
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsAsking(true);
    setError(null);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setIsAsking(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/40" />

      <div className="flex h-screen flex-col max-w-3xl mx-auto px-4">

        {/* Header */}
        <header className="py-5 flex items-center justify-between border-b border-zinc-200/70 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">RAG PDF Chatbot</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Upload a PDF and chat with it.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-zinc-200 bg-white/70 backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/70 backdrop-blur text-zinc-700 hover:bg-white hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white transition"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        {/* Upload bar */}
        <div className="py-4 flex items-center gap-3 border-b border-zinc-200/70 dark:border-white/5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isIndexing}
            className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/40 hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 transition"
          >
            {isIndexing ? "Indexing…" : "Upload PDF"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleUpload}
          />
          {pdfName && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20 truncate max-w-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="truncate font-medium">{pdfName}</span>
            </span>
          )}
          {isIndexing && (
            <span className="text-sm text-zinc-400 dark:text-zinc-500 animate-pulse">
              Reading and indexing…
            </span>
          )}
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4 scrollbar-thin">
          {messages.length === 0 && !isIndexing && (
            <div className="flex flex-col items-center justify-center mt-24 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 dark:text-indigo-400">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Start by uploading a PDF
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 max-w-xs">
                Once indexed, ask questions and get answers grounded in your document.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-sm shadow-indigo-500/20"
                    : "bg-white border border-zinc-200/80 text-zinc-800 rounded-bl-sm shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-zinc-100 dark:backdrop-blur"
                }`}
              >
                {renderMessageContent(msg.content)}
              </div>
            </div>
          ))}

          {isAsking && (
            <div className="flex justify-start">
              <div className="bg-white border border-zinc-200/80 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur">
                <div className="flex items-center gap-1.5 h-5">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-md text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-400/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleAsk}
          className="py-4 border-t border-zinc-200/70 dark:border-white/5"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-2 py-1.5 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-indigo-400/60 transition">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={pdfName ? "Ask a question about your PDF…" : "Upload a PDF first…"}
              disabled={!pdfName || isAsking}
              className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!pdfName || isAsking || !question.trim()}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm shadow-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
