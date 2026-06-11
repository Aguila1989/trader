import { config, type ProviderSpec } from "../config";
import { AnthropicProvider } from "./anthropic";
import { OpenAICompatibleProvider } from "./openai";
import type { AiProvider } from "./types";

export type { AiProvider, AiRequest, AiTurn, AiTool, AiToolCall, AiMessage } from "./types";

/** One selectable provider for the dashboard dropdown (only ones WITH a key). */
export interface ProviderOption {
  id: string;
  label: string;
  model: string;
  active: boolean;
}

// Which provider is currently driving the analyst. Starts at the configured
// default (AI_PROVIDER) and can be switched live from the dashboard.
let activeId = config.ai.active;

// Built providers are cached per id so switching back and forth is free and
// the Anthropic SDK client / fetch wrapper is reused.
const cache = new Map<string, AiProvider>();

/** Look up a provider's configured spec, or undefined if the id is unknown. */
function specFor(id: string): ProviderSpec | undefined {
  return config.ai.providers[id];
}

/** Construct the concrete provider for a spec (anthropic native vs OpenAI dialect). */
function build(spec: ProviderSpec): AiProvider {
  if (spec.id === "anthropic") {
    return new AnthropicProvider({
      id: "anthropic",
      apiKey: spec.apiKey,
      model: spec.model,
      baseURL: spec.baseURL || undefined,
      thinkingBudget: config.anthropicThinkingBudget,
    });
  }
  return new OpenAICompatibleProvider({
    id: spec.id,
    apiKey: spec.apiKey,
    model: spec.model,
    baseURL: spec.baseURL || "https://api.openai.com/v1",
  });
}

/**
 * The active AI provider (lazily constructed, cached per id). "anthropic" uses
 * the native Claude SDK (prompt caching + extended thinking); every other id
 * speaks the OpenAI chat-completions dialect via its base URL.
 *
 * Throws if the active provider has no API key or model configured - callers
 * should gate on aiReady() first.
 */
export function getProvider(): AiProvider {
  const spec = specFor(activeId);
  if (!spec || !spec.apiKey) {
    throw new Error(
      `No API key configured for AI provider "${activeId}". ` +
        `Set ${activeId.toUpperCase()}_API_KEY (or AI_API_KEY for the active provider).`,
    );
  }
  if (!spec.model) {
    throw new Error(
      `No model configured for AI provider "${activeId}". ` +
        `Set ${activeId.toUpperCase()}_MODEL (or AI_MODEL for the active provider).`,
    );
  }
  let p = cache.get(activeId);
  if (!p) {
    p = build(spec);
    cache.set(activeId, p);
  }
  return p;
}

/**
 * Providers the operator can pick on the dashboard: every catalog entry that
 * has an API key configured. A provider with no key is intentionally omitted
 * (you can't trade through it), which is exactly what drives the dropdown.
 */
export function availableProviders(): ProviderOption[] {
  return Object.values(config.ai.providers)
    .filter((s) => s.apiKey !== "")
    .map((s) => ({ id: s.id, label: s.label, model: s.model, active: s.id === activeId }));
}

/**
 * Switch the active provider at runtime. Returns false if the id is unknown or
 * has no API key (the caller should reject the request); true on success.
 */
export function setActiveProvider(id: string): boolean {
  const spec = specFor(id);
  if (!spec || spec.apiKey === "") return false;
  activeId = id;
  return true;
}

/** True when the ACTIVE provider has an API key (the analyst can run). */
export function aiReady(): boolean {
  const spec = specFor(activeId);
  return spec !== undefined && spec.apiKey !== "";
}

/** The active provider id ("anthropic", "openai", "deepseek", ...). */
export function aiProviderId(): string {
  return activeId;
}

/** The active provider's model name (for display + the API call). */
export function aiModel(): string {
  return specFor(activeId)?.model ?? "";
}
