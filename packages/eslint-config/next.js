import tseslint from "typescript-eslint";
import base from "./base.js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * ESLint flat config for Next.js apps.
 * eslint-config-next 16 ships a native flat config; `core-web-vitals`
 * already bundles the base `next` rules plus `next/typescript`, so we spread
 * it directly instead of bridging the old eslintrc names through FlatCompat
 * (which crashes under ESLint 10).
 */
export default [
  ...base,
  ...nextCoreWebVitals,
  {
    // The bundled `next` block assigns Next's babel parser to every JS/TS file,
    // but that parser's scope manager predates ESLint 10's `addGlobals` API and
    // crashes. `next/typescript` already re-parses .ts/.tsx with the
    // typescript-eslint parser; do the same for plain-JS files (config files,
    // env.js) so they load under ESLint 10.
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    settings: {
      // eslint-plugin-react 7.37 (bundled by next 16) still detects the React
      // version via the removed `context.getFilename()`, which throws under
      // ESLint 10. Pin the version so the "detect" code path is never hit.
      react: {
        version: "19.2",
      },
    },
  },
  {
    // eslint-plugin-react-hooks v6 (bundled by next 16) promotes its new
    // React-Compiler rules to errors. They flag long-standing accepted
    // patterns (hydration guards via setState-in-effect, memoized ref
    // composition) in vendored shadcn/dice-ui components; keep them visible
    // as warnings instead of blocking lint.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/use-memo": "warn",
    },
  },
  {
    ignores: [
      "**/.next/**",
      "**/.open-next/**",
      "**/.wrangler/**",
      "**/out/**",
      "**/build/**",
      "next-env.d.ts",
      "cloudflare-env.d.ts",
    ],
  },
];
