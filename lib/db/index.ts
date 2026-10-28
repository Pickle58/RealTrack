import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import { getEnv } from "@/lib/cloudflare";
import * as schema from "./schema";

export function getDb(): DrizzleD1Database<typeof schema> {
  return drizzle(getEnv().DB, { schema });
}
