import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import { clearWorkerEnv, useWorkerEnv } from "./cloudflare-workers";

const MIGRATIONS_DIR = fileURLToPath(new URL("../../migrations/", import.meta.url));
const BREAKPOINT = "--> statement-breakpoint";

export type TestWorker = {
  miniflare: Miniflare;
  db: D1Database;
  kv: KVNamespace;
  r2: R2Bucket;
  dispose: () => Promise<void>;
};

/** Each test file gets its own in-memory D1/KV/R2 so cases cannot leak rows into each other. */
export async function startTestWorker(): Promise<TestWorker> {
  const miniflare = new Miniflare({
    workers: [
      {
        config: {
          name: "real-estate-tracker-tests",
          compatibilityDate: "2026-10-27",
          compatibilityFlags: ["nodejs_compat"],
          manifest: {
            mainModule: "index.js",
            modules: {
              "index.js": {
                type: "esm",
                contents: "export default { fetch() { return new Response('ok'); } }",
              },
            },
          },
          env: {
            DB: { type: "d1" },
            KV: { type: "kv" },
            MEDIA: { type: "r2" },
          },
        },
      },
    ],
  });

  const db = (await miniflare.getD1Database("DB")) as unknown as D1Database;
  const kv = (await miniflare.getKVNamespace("KV")) as unknown as KVNamespace;
  const r2 = (await miniflare.getR2Bucket("MEDIA")) as unknown as R2Bucket;

  await applyMigrations(db);
  useWorkerEnv({ DB: db, KV: kv, MEDIA: r2 });

  return {
    miniflare,
    db,
    kv,
    r2,
    dispose: async () => {
      clearWorkerEnv();
      await miniflare.dispose();
    },
  };
}

/** Applies the committed Drizzle migrations, so the tests run against the real schema. */
async function applyMigrations(db: D1Database): Promise<void> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(`${MIGRATIONS_DIR}${file}`, "utf8");
    for (const statement of sql.split(BREAKPOINT)) {
      if (statement.trim().length > 0) await db.prepare(statement).run();
    }
  }
}

/** Empties every table, the KV cache and the bucket, so one case cannot see another's state. */
export async function resetTestWorker(worker: TestWorker): Promise<void> {
  await worker.db.prepare("DELETE FROM property_media").run();
  await worker.db.prepare("DELETE FROM properties").run();

  const keys = await worker.kv.list();
  await Promise.all(keys.keys.map((key) => worker.kv.delete(key.name)));

  let objects = await worker.r2.list();
  while (objects.objects.length > 0) {
    await worker.r2.delete(objects.objects.map((object) => object.key));
    objects = await worker.r2.list();
  }
}
