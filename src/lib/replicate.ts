import Replicate from "replicate";

let _replicate: Replicate | null = null;

export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}

export function getReplicate(): Replicate {
  if (!_replicate) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error(
        "Replicate is not configured. Set REPLICATE_API_TOKEN to enable image generation."
      );
    }
    _replicate = new Replicate({ auth: token });
  }
  return _replicate;
}

export const replicate = new Proxy({} as Replicate, {
  get(_target, prop) {
    return (getReplicate() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
