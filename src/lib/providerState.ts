type Provider = "ollama" | "openai" | "anthropic";

let activeProvider: Provider = (process.env.LLM_PROVIDER ?? "ollama") as Provider;

export function getActiveProvider(): Provider {
  return activeProvider;
}

export function setActiveProvider(p: Provider) {
  activeProvider = p;
}
