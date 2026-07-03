import { FlatCompat } from "@eslint/eslintrc";
import base from "./base.js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

/**
 * ESLint flat config for Next.js apps.
 * Port of the web app's previous eslint.config.mjs.
 */
export default [
  ...base,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
