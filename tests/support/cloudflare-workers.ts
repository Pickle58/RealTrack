/**
 * Test stand-in for the workerd-only `cloudflare:workers` module. `lib/cloudflare.ts` reads
 * `env` once at import time, so the value is a proxy over whichever Miniflare environment the
 * current test file started.
 */
export type TestWorkerEnv = {
  DB: D1Database;
  KV: KVNamespace;
  MEDIA: R2Bucket;
};

let current: TestWorkerEnv | null = null;

export function useWorkerEnv(workerEnv: TestWorkerEnv): void {
  current = workerEnv;
}

export function clearWorkerEnv(): void {
  current = null;
}

export const env = new Proxy({} as Env, {
  get(_target, key: string) {
    if (!current) throw new Error("cloudflare:workers env is unavailable outside a test worker");
    return current[key as keyof TestWorkerEnv];
  },
});
