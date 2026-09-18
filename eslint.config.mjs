import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import wingnight from "./tools/eslint-plugin-wingnight/index.mjs";

export default [
  {
    ignores: [
      "**/node_modules/**",
      // Agent worktrees are transient checkouts of this repo; linting them would let
      // stale copies of already-fixed files redden the gate.
      ".claude/**",
      // Throwaway ANAMORPH feel lab behind /dev/lab/anamorph. A four-knob control lab is
      // hardcoded labels and runtime style values by construction, which the wingnight
      // component rules rightly reject in shipped code. Scope carve-out only — no rule is
      // disabled and there is no eslint-disable in the lab. Shipping the ANAMORPH
      // minigame deletes both the folder and this entry (BACKLOG.md).
      "apps/client/src/components/AnamorphLab/**",
      // Throwaway CONTRAPTION feel lab behind /dev/lab/contraption. A live-control harness over
      // the shared integrator is hardcoded labels and runtime style values by construction, which the
      // wingnight component rules rightly reject in shipped code. Scope carve-out only — no rule is
      // disabled and there is no eslint-disable in the lab. Shipping the CONTRAPTION minigame
      // deletes both the folder and this entry (BACKLOG.md).
      "apps/client/src/components/ContraptionLab/**",
      // Throwaway CONTRAPTION UI direction prototype behind /dev/lab/contraption-ui. A three-variant
      // lab is hardcoded labels and runtime style values by construction, which the wingnight
      // component rules rightly reject in shipped code. Scope carve-out only — no rule is disabled
      // and there is no eslint-disable in the prototype. Shipping the CONTRAPTION minigame deletes
      // both the folder and this entry (BACKLOG.md).
      "apps/client/src/components/ContraptionUiLab/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.cache/**",
      "**/.turbo/**",
      "**/playwright-report/**",
      "**/test-results/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
      wingnight
    }
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"]
        },
        {
          selector: "variable",
          modifiers: ["const", "global"],
          format: ["camelCase", "UPPER_CASE", "PascalCase"]
        },
        {
          selector: "variableLike",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow"
        }
      ]
    }
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
    }
  },
  {
    files: ["tools/**/*.mjs", "tests/**/*.ts", "playwright.config.ts"],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["apps/client/src/**/*.{ts,tsx}", "packages/cast/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error"
    }
  },
  {
    files: ["apps/server/src/**/*.ts", "packages/shared/src/**/*.ts"],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["apps/server/src/**/*.ts"],
    rules: {
      complexity: ["warn", 20],
      "max-lines": [
        "warn",
        { max: 400, skipBlankLines: true, skipComments: true }
      ]
    }
  },
  {
    files: ["apps/server/src/**/*.test.ts"],
    rules: {
      "max-lines": "off"
    }
  },
  {
    // packages/cast is the shared character system: it left apps/client so minigame
    // packages can draw the bird, and it keeps the house component idiom with it.
    files: ["apps/client/src/components/**/*.tsx", "packages/cast/src/**/*.tsx"],
    rules: {
      "wingnight/component-entry-file-name": "error"
    }
  },
  {
    files: ["apps/**/src/utils/**/*.ts"],
    rules: {
      "wingnight/utility-entry-file-name": "error"
    }
  },
  {
    files: ["apps/client/src/components/**/index.tsx", "packages/cast/src/**/index.tsx"],
    rules: {
      "max-lines": [
        "error",
        { max: 260, skipBlankLines: true, skipComments: true }
      ],
      "wingnight/require-styles-import-in-component-entry": "error",
      "wingnight/no-inline-style-prop": "error",
      "wingnight/no-hardcoded-component-jsx-text": "error",
      "no-restricted-imports": ["error", { patterns: ["**/*.json"] }]
    }
  },
  {
    files: ["apps/client/src/components/**/styles.ts", "packages/cast/src/**/styles.ts"],
    rules: {
      "max-lines": [
        "error",
        { max: 140, skipBlankLines: true, skipComments: true }
      ],
      "wingnight/no-class-name-suffix-in-styles-exports": "error",
      "wingnight/no-hardcoded-hex-colors-in-styles": "error",
      "wingnight/no-nonsemantic-color-tokens-in-styles": "error"
    }
  },
  {
    files: ["packages/shared/src/socketEvents/**/*.ts"],
    rules: {
      "wingnight/socket-event-name-format": "error"
    }
  }
];
