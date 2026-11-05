import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";

export default defineConfig([
  globalIgnores(["build/", ".svelte-kit/", "dev_static/"]),
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    rules: {
      // Provider data arrives over IPC and reactive state changes during
      // transitions, so these checks can matter where the types say they can't.
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true }
      ],
      "@typescript-eslint/restrict-plus-operands": [
        "error",
        { allowNumberAndString: true }
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true }
      ]
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },
  {
    files: ["**/*.js"],
    extends: [ts.configs.disableTypeChecked]
  }
]);
