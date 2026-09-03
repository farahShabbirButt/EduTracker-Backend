import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["src/**/*.ts"],

    // === Equivalent to parser + parserOptions ===
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },

    // === Plugins ===
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettier,
    },

    // === Rules (Your custom ones included) ===
    rules: {
      // TS recommended equivalent
      ...tseslint.configs.recommended.rules,

      // Prettier compatibility
      ...prettierConfig.rules,

      // Your custom rules:
      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["error", "info"] }],
    },
  },

  // === Ignores (replaces .eslintignore) ===
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
