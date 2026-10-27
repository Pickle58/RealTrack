import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

// @clerk/nextjs/dist/esm calls bare require() in four modules; the dev module runner
// evaluates them unbundled inside workerd, where require is undefined. See vinext#4221.
function clerkRequireToImport(): Plugin {
  return {
    name: "clerk-require-to-import",
    apply: "serve",
    applyToEnvironment: (environment) => environment.config.consumer === "server",
    transform(code, id) {
      if (!id.includes("/@clerk/nextjs/dist/esm/")) return;
      const specifiers: string[] = [];
      const rewritten = code.replace(
        /(^|[^.\w$])require\((["'])([^"']+)\2\)/g,
        (_match: string, before: string, _quote: string, specifier: string) => {
          if (!specifiers.includes(specifier)) specifiers.push(specifier);
          return `${before}__clerkRequire${specifiers.indexOf(specifier)}`;
        },
      );
      if (specifiers.length === 0) return;
      const imports = specifiers.map(
        (specifier, index) => `import * as __clerkRequire${index} from ${JSON.stringify(specifier)};`,
      );

      return { code: `${imports.join("\n")}\n${rewritten}`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [
    vinext(),
    clerkRequireToImport(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
