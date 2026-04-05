import OpenAI from "openai";

let _openai: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OpenAI is not configured. Set OPENAI_API_KEY to enable story generation."
      );
    }
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
