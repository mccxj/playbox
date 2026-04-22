import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "dist/**",
      "wrangler.toml",
      "worker-configuration.d.ts",
      "*.worker.ts",
      "test-config-import.js",
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  // React rules
  {
    plugins: {
      react,
    },
    settings: {
      react: {
        version: "18.3.1", // From package.json
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Not needed in Next.js 15/React 18
      "react/prop-types": "off", // Using TypeScript
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
    },
  },

  // React Hooks rules (CRITICAL for React)
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Accessibility rules
  {
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "jsx-a11y/anchor-is-valid": "off", // Next.js <Link> usage
    },
  },

  // Prettier (must be last to disable conflicting rules)
  prettier,

  // Cloudflare Workers specific
  {
    files: ["**/*.worker.ts", "**/workers/**"],
    rules: {
      "no-restricted-globals": ["error", "fetch", "caches", "Response", "Request"],
    },
  },

  // Next.js App Router specific
  {
    files: ["app/**/*.ts", "app/**/*.tsx"],
    rules: {
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
    },
  },

  // Ant Design components - allow certain patterns
  {
    files: ["**/*.tsx"],
    rules: {
      "react/no-array-index-key": "off", // Ant Design commonly uses array indices
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);