import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "real-estate-tracker",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-27",
    compatibilityFlags: ["nodejs_compat"],
    domains: ["realtrack.elderpickle.com"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      DB: bindings.d1({ name: "real-estate-tracker-db" }),
      KV: bindings.kv(),
      MEDIA: bindings.r2({ name: "real-estate-tracker-media" }),
      CLERK_SECRET_KEY: bindings.secret(),
      GEOCODER_PROVIDER: bindings.text("geocod"),
      GEOCODER_API_KEY: bindings.secret(),
    },
  }),
});
