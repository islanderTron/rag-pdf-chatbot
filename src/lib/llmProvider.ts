/**
 * llmProvider.ts
 * ──────────────
 * Abstraction layer for LLM and embedding models.
 * To switch providers, only change LLM_PROVIDER in .env — no code changes here.
 *
 * Supported providers:
 *   "ollama"    → free, runs locally. Needs Ollama installed.
 *   "openai"    → ChatGPT. Needs OPENAI_API_KEY.
 *   "anthropic" → Claude.  Needs ANTHROPIC_API_KEY + OPENAI_API_KEY (for embeddings).
 */

import { config } from "./config";
import { getActiveProvider } from "./providerState";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Embeddings } from "@langchain/core/embeddings";

export function getLLM(): BaseChatModel {
  switch (getActiveProvider()) {
    case "ollama": {
      const { ChatOllama } = require("@langchain/ollama");
      return new ChatOllama({
        model:   config.ollama.model,
        baseUrl: config.ollama.baseUrl,
      });
    }

    case "openai": {
      const { ChatOpenAI } = require("@langchain/openai");
      return new ChatOpenAI({
        model:  config.openai.model,
        apiKey: config.openai.apiKey,
      });
    }

    case "anthropic": {
      const { ChatAnthropic } = require("@langchain/anthropic");
      return new ChatAnthropic({
        model:  config.anthropic.model,
        apiKey: config.anthropic.apiKey,
      });
    }

    default:
      throw new Error(
        `Unknown LLM_PROVIDER: "${config.llmProvider}". ` +
        `Choose from: ollama, openai, anthropic`
      );
  }
}

export function getEmbeddings(): Embeddings {
  switch (getActiveProvider()) {
    case "ollama": {
      const { OllamaEmbeddings } = require("@langchain/ollama");
      return new OllamaEmbeddings({
        model:   config.ollama.embedModel,
        baseUrl: config.ollama.baseUrl,
      });
    }
    case "openai": {
      const { OpenAIEmbeddings } = require("@langchain/openai");
      return new OpenAIEmbeddings({ apiKey: config.openai.apiKey });
    }
    case "anthropic": {
      // Anthropic has no embeddings API — fall back to local Ollama embeddings.
      const { OllamaEmbeddings } = require("@langchain/ollama");
      return new OllamaEmbeddings({
        model:   config.ollama.embedModel,
        baseUrl: config.ollama.baseUrl,
      });
    }

    default:
      throw new Error(
        `Unknown LLM_PROVIDER: "${config.llmProvider}". ` +
        `Choose from: ollama, openai, anthropic`
      );
  }
}
