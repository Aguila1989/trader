// Provider-neutral AI layer. The trading analyst (src/claude/agent.ts) runs a
// tool-use loop against THIS interface, so it works the same whether the model
// is Claude (native Anthropic SDK), OpenAI, DeepSeek, OpenRouter, Groq, a local
// server, or any other OpenAI-compatible endpoint. Each provider translates
// these neutral shapes to/from its own wire format.

/** A tool the model may call. JSON-Schema based, like both SDK dialects. */
export interface AiTool {
  name: string;
  description: string;
  /** JSON Schema for the tool's arguments (an object schema). */
  inputSchema: Record<string, unknown>;
}

/** A single tool invocation the model emitted this turn. */
export interface AiToolCall {
  /** Provider-assigned id; echoed back with the matching tool result. */
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * One message in the neutral conversation.
 * - user:      a plain text prompt or instruction.
 * - assistant: the model's reply (text + any tool calls it wants run). `raw`
 *              optionally carries the provider's native, verbatim content so it
 *              can be replayed exactly (Anthropic needs this to preserve
 *              thinking-block signatures across tool-use turns).
 * - tool:      the result of running ONE tool call, keyed by toolCallId.
 */
export type AiMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls: AiToolCall[]; raw?: unknown }
  | { role: "tool"; toolCallId: string; content: string };

/** The result of a single model turn (one API round-trip). */
export interface AiTurn {
  /** Assistant commentary emitted this turn (thinking excluded). */
  text: string;
  /** Tool calls to execute; empty means the model is done. */
  toolCalls: AiToolCall[];
  /**
   * Provider-native assistant content, to be stored on the assistant message
   * and replayed verbatim next turn. Opaque to everything but the provider
   * that produced it; other providers reconstruct from text + toolCalls.
   */
  raw?: unknown;
}

/** A single model call: stable system prompt, the conversation, and tools. */
export interface AiRequest {
  system: string;
  messages: AiMessage[];
  tools: AiTool[];
  /** Reply token allowance (excludes any provider-internal thinking budget). */
  maxReplyTokens: number;
}

/** A chat model that supports tool use, behind one neutral call. */
export interface AiProvider {
  /** Stable id: "anthropic" | "openai" | "deepseek" | "openrouter" | ... */
  readonly id: string;
  /** The model name in use (for display + the API call). */
  readonly model: string;
  /** Run one turn (one model API call) and normalize the result. */
  run(req: AiRequest): Promise<AiTurn>;
}
