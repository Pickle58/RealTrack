import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "real-estate-tracker",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-27",
    compatibilityFlags: ["nodejs_compat"],
    domains: ["realtrack.elderpickle.com"],
    observability: {
      enabled: true, // persists logs (shorthand for logs.enabled)
      logs: {
        enabled: true,
        invocationLogs: true, // log every invocation
        headSamplingRate: 1, // 1 = 100% of requests logged
      },
      issues: {
        enabled: true, // detect & group production failures
      },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Bindings are pinned by id only: a `name` (for D1) or a missing id (for KV) makes `cf`
      // emit a config that differs from the ids a Dashboard deploy records for this Worker, and
      // `cf deploy` always runs strict, so it aborts the upload instead of over-writing them.
      DB: bindings.d1({ id: "71251ab2-9793-4c63-b7a9-b566c0703a6b" }),
      KV: bindings.kv({ id: "95e028ca40d749b9a6f23f92e33efd30" }),
      MEDIA: bindings.r2({ name: "real-estate-tracker-media" }),
      CLERK_SECRET_KEY: bindings.secret(),
      GEOCODER_PROVIDER: bindings.text("geocod"),
      GEOCODER_API_KEY: bindings.secret(),
    },
  }),
});
