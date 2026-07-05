import type { AiMessage, AiProvider, AiRequest, AiToolCall, AiTurn } from "./types";

// Shape of the bits of the OpenAI chat-completions response we consume.
interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function?: { name: string; arguments: string };
      }>;
    };
    /** "stop" | "length" | "tool_calls" | ... - "length" = truncated (Fix 4). */
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
}

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
    }
  | { role: "tool"; tool_call_id: string; content: string };

/**
 * Any OpenAI chat-completions-compatible endpoint, reached over plain HTTP
 * (no SDK dependency). One dialect covers a lot of ground via `baseURL`:
 * OpenAI itself, DeepSeek, OpenRouter (which fronts Claude, Gemini, Llama,
 * everything), Groq, Together, Mistral, xAI, and local servers like Ollama or
 * LM Studio. Tool use is the standard `tools` + `tool_calls` flow.
 *
 * Note: this path has no prompt caching or extended-thinking knobs - those are
 * Anthropic-native. For Claude with caching + thinking, use AI_PROVIDER=anthropic.
 */
export class OpenAICompatibleProvider implements AiProvider {
  readonly id: string;
  readonly model: string;
  private apiKey: string;
  private baseURL: string;

  constructor(opts: { id: string; apiKey: string; model: string; baseURL: string }) {
    this.id = opts.id;
    this.model = opts.model;
    this.apiKey = opts.apiKey;
    this.baseURL = opts.baseURL.replace(/\/+$/, "");
  }

  async run(req: AiRequest): Promise<AiTurn> {
    const body = {
      model: this.model,
      max_tokens: req.maxReplyTokens,
      messages: [
        { role: "system", content: req.system } as ChatMessage,
        ...toChatMessages(req.messages),
      ],
      tools: req.tools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })),
    };

    // SEC-17: bound the call. A hung/slow provider must not stall the autopilot
    // loop (and the whole process) indefinitely - abort after 60s.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    let res: Awaited<ReturnType<typeof fetch>>;
    let data: ChatCompletionResponse;
    try {
      res = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      data = (await res.json().catch(() => ({}))) as ChatCompletionResponse;
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(`${this.id} API call timed out after 60s.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      throw new Error(
        data.error?.message || `${this.id} API error: ${res.status} ${res.statusText}`,
      );
    }

    const msg = data.choices?.[0]?.message;
    const stopReason = data.choices?.[0]?.finish_reason ?? undefined;
    const text = (msg?.content ?? "").trim();
    const toolCalls: AiToolCall[] = (msg?.tool_calls ?? [])
      .filter((tc) => tc.type === "function" && tc.function)
      .map((tc, i) => {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tc.function?.arguments || "{}") as Record<string, unknown>;
        } catch {
          /* malformed args -> empty object; the policy engine will reject it */
        }
        // Some OpenAI-compatible servers omit the id. Synthesize a stable one so
        // assistant.tool_calls[i].id and the matching tool message's
        // tool_call_id still line up when we replay this turn next round.
        return { id: tc.id || `call_${i}`, name: tc.function?.name ?? "", input };
      });

    return { text, toolCalls, ...(stopReason ? { stopReason } : {}) };
  }
}

/** Translate the neutral conversation into OpenAI chat-completions messages. */
function toChatMessages(msgs: AiMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of msgs) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      out.push({
        role: "assistant",
        content: m.content || null,
        ...(m.toolCalls.length
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: JSON.stringify(tc.input) },
              })),
            }
          : {}),
      });
    } else {
      // OpenAI wants ONE tool message per tool call (keyed by id), unlike
      // Anthropic which folds them into a single user message.
      out.push({ role: "tool", tool_call_id: m.toolCallId, content: m.content });
    }
  }
  return out;
}
