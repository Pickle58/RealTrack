import { defineConfig } from "drizzle-kit";

// drizzle-kit only generates SQL here; `cf d1 migrations apply` applies it to D1, so no credentials are configured.
export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./migrations",
  strict: true,
  verbose: true,
});
