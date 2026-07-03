import tseslint from "typescript-eslint";
import base from "./base.js";

/**
 * ESLint flat config for Convex functions.
 * Flat-config port of the previous convex/.eslintrc.cjs
 * (recommended-type-checked + relaxed rules to ease TS adoption).
 */
export default tseslint.config(
  {
    // Port of the old .eslintrc.cjs ignorePatterns: the generated Convex
    // API and this flat config file itself.
    ignores: ["src/api/_generated/**", "eslint.config.mjs"],
  },
  {
    // The old lint script passed `--report-unused-disable-directives`, which
    // reports unused eslint-disable comments as errors (this overrode the
    // `reportUnusedDisableDirectives: false` that sat in the old rc file).
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  ...base,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    rules: {
      // Only warn on unused variables, and ignore variables starting with `_`.
      // caughtErrors "none" preserves the eslint 8 default the old config
      // relied on (eslint 9 flipped the default to "all").
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],

      // Allow escaping the compiler
      "@typescript-eslint/ban-ts-comment": "error",

      // Allow explicit `any`s
      "@typescript-eslint/no-explicit-any": "off",

      // Allow implicit `any`s
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",

      // Allow async functions without await (esp. Convex `handler`s)
      "@typescript-eslint/require-await": "off",
    },
  },
);
