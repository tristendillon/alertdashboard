import globals from "globals";
import baseConfig from "./base.js";

/**
 * ESLint flat config for plain Node.js packages (e.g. the firstdue-listener).
 * Base config plus Node globals, with rules relaxed to warnings where the
 * existing (never-linted) code would otherwise fail CI.
 */
export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "no-empty": "warn",
    },
  },
];
