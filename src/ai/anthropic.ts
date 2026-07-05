import Anthropic from "@anthropic-ai/sdk";
import type { AiMessage, AiProvider, AiRequest, AiToolCall, AiTurn } from "./types";

/**
 * Native Claude provider via the official Anthropic SDK. This is the only
 * path that keeps Anthropic-specific wins:
 *  - prompt caching (cache_control breakpoints on the tools + system prefix),
 *  - extended thinking (budget_tokens), with thinking blocks replayed verbatim
 *    across tool-use turns via the assistant message's `raw` payload.
 */
export class AnthropicProvider implements AiProvider {
  readonly id: string;
  readonly model: string;
  private client: Anthropic;
  /** Extended-thinking budget in tokens; 0 disables thinking. */
  private thinkingBudget: number;

  constructor(opts: {
    id?: string;
    apiKey: string;
    model: string;
    baseURL?: string;
    thinkingBudget?: number;
  }) {
    this.id = opts.id ?? "anthropic";
    this.model = opts.model;
    this.thinkingBudget = opts.thinkingBudget ?? 0;
    this.client = new Anthropic({
      apiKey: opts.apiKey,
      // SEC-17: bound every Claude call so a hung provider can't stall the
      // analysis loop indefinitely (the OpenAI-compatible path has the same 60s
      // cap). maxRetries is kept low so the total wall-clock stays bounded.
      timeout: 60_000,
      maxRetries: 1,
      ...(opts.baseURL ? { baseURL: opts.baseURL } : {}),
    });
  }

  async run(req: AiRequest): Promise<AiTurn> {
    const thinkingOn = this.thinkingBudget > 0;
    const budget = Math.max(1024, this.thinkingBudget);

    // Cache the whole tool list by putting a breakpoint on the last tool, and
    // cache the system prompt too. Both are stable across the loop's turns.
    const tools: Anthropic.Tool[] = req.tools.map((t, i) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
      ...(i === req.tools.length - 1
        ? { cache_control: { type: "ephemeral" as const } }
        : {}),
    }));

    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: thinkingOn ? budget + req.maxReplyTokens : req.maxReplyTokens,
      ...(thinkingOn
        ? { thinking: { type: "enabled" as const, budget_tokens: budget } }
        : {}),
      system: [
        { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
      ],
      tools,
      messages: toAnthropicMessages(req.messages),
    });

    let text = "";
    const toolCalls: AiToolCall[] = [];
    for (const block of res.content) {
      if (block.type === "text" && block.text.trim()) {
        text += (text ? "\n" : "") + block.text.trim();
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: (block.input ?? {}) as Record<string, unknown>,
        });
      }
    }

    // Hand back the verbatim content so the loop can replay it next turn -
    // critical when thinking is on (thinking blocks carry signatures that must
    // be preserved unmodified alongside the tool_use blocks).
    return {
      text,
      toolCalls,
      raw: res.content,
      ...(res.stop_reason ? { stopReason: res.stop_reason } : {}),
    };
  }
}

/** Translate the neutral conversation into Anthropic's message format. */
function toAnthropicMessages(msgs: AiMessage[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  for (const m of msgs) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      // Replay the provider-native blocks verbatim when present.
      if (m.raw) {
        out.push({
          role: "assistant",
          content: m.raw as Anthropic.ContentBlockParam[],
        });
        continue;
      }
      const content: Anthropic.ContentBlockParam[] = [];
      if (m.content) content.push({ type: "text", text: m.content });
      for (const tc of m.toolCalls) {
        content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input });
      }
      out.push({ role: "assistant", content });
    } else {
      // Anthropic wants all tool results for a turn in ONE user message, so
      // fold consecutive tool messages into the same content array.
      const block: Anthropic.ToolResultBlockParam = {
        type: "tool_result",
        tool_use_id: m.toolCallId,
        content: m.content,
      };
      const last = out[out.length - 1];
      const folding =
        last?.role === "user" &&
        Array.isArray(last.content) &&
        last.content[0]?.type === "tool_result";
      if (folding) {
        (last.content as Anthropic.ToolResultBlockParam[]).push(block);
      } else {
        out.push({ role: "user", content: [block] });
      }
    }
  }
  return out;
}
