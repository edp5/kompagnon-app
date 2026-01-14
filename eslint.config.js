// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default defineConfig([
  expoConfig,

  {
    ignores: ["dist/**"],
  },

  {
    files: ["**/*.{js,mjs,cjs}"],

    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".mjs", ".cjs"],
        },
      },
    },


    plugins: {
      "simple-import-sort": simpleImportSort,
    },

    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "comma-dangle": ["error", "always-multiline"],
      "comma-spacing": ["error", { before: false, after: true }],
      "object-curly-spacing": ["error", "always"],

      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "block", next: "block" },
        { blankLine: "always", prev: "function", next: "function" },
        { blankLine: "always", prev: "class", next: "function" },
      ],

      "prefer-const": "error",

      "space-before-blocks": "error",
      "space-before-function-paren": [
        "error",
        {
          anonymous: "never",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "space-in-parens": ["error", "never"],
      "space-infix-ops": "error",
      "func-call-spacing": ["error", "never"],
      "key-spacing": ["error", { beforeColon: false, afterColon: true }],
      "no-trailing-spaces": "error",
      "no-multi-spaces": "error",

      "func-style": ["error", "declaration", { allowArrowFunctions: true }],

      "import/no-unresolved": [
        "error",
        {
          ignore: ["^@env$"],
        },
      ],
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ["**/*.test.{js,mjs}", "**/*.spec.{js,mjs}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]);
