import Anthropic from '@anthropic-ai/sdk';

/** Server only. Reads ANTHROPIC_API_KEY from the environment. Never import this file from client code. */
export interface AskOptions {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs: number;
}

/** Pull JSON out of a reply, allowing a ```json fence around it. Returns null when it does not parse. */
export function parseJsonReply(text: string): unknown | null {
  let body = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(body);
  if (fenced) body = fenced[1];
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

/**
 * Ask Claude for a JSON answer. Returns null when there is no key, on any error, on timeout, or when the
 * reply is not JSON. It never throws, so callers can always fall back to their built-in rules.
 */
export async function askClaudeForJson(opts: AskOptions): Promise<unknown | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create(
      {
        model: opts.model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: [{ role: 'user', content: opts.user }],
      },
      { timeout: opts.timeoutMs, maxRetries: 0, signal: AbortSignal.timeout(opts.timeoutMs) },
    );
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();
    return text ? parseJsonReply(text) : null;
  } catch {
    return null;
  }
}
