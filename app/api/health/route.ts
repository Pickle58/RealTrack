import { getEnv } from "@/lib/cloudflare";

const PROBE_KEY = "health:probe";

type CheckResult = { ok: boolean; detail: string };

export async function GET(): Promise<Response> {
  const env = getEnv();
  const checks: Record<"d1" | "kv" | "r2", CheckResult> = {
    d1: await checkD1(env),
    kv: await checkKv(env),
    r2: await checkR2(env),
  };
  const ok = Object.values(checks).every((check) => check.ok);

  return Response.json({ success: ok, data: { checks } }, { status: ok ? 200 : 503 });
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function checkD1(env: Env): Promise<CheckResult> {
  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    return row?.ok === 1
      ? { ok: true, detail: "SELECT 1" }
      : { ok: false, detail: "unexpected result" };
  } catch (error) {
    return { ok: false, detail: describe(error) };
  }
}

async function checkKv(env: Env): Promise<CheckResult> {
  try {
    await env.KV.put(PROBE_KEY, String(Date.now()), { expirationTtl: 60 });
    const value = await env.KV.get(PROBE_KEY);
    return value
      ? { ok: true, detail: `round-trip of ${PROBE_KEY}` }
      : { ok: false, detail: "key missing after write" };
  } catch (error) {
    return { ok: false, detail: describe(error) };
  }
}

async function checkR2(env: Env): Promise<CheckResult> {
  try {
    const listed = await env.MEDIA.list({ limit: 1 });
    return { ok: true, detail: `${listed.objects.length} object(s) listed` };
  } catch (error) {
    return { ok: false, detail: describe(error) };
  }
}
