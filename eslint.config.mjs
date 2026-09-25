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
    // The minigame client trees are browser code too, but they are deliberately NOT
    // listed here. `no-undef` is off for TS, so the browser globals are inert; the live
    // effect of this block is the two react-hooks rules, and the minigame runners, mirrors
    // and hold timers all carry hand-narrowed dependency arrays that keep a rAF loop from
    // being torn down and restarted mid-flight. Widening them is a behaviour change to a
    // shipped minigame, not a lint fix, so it is its own piece of work (BACKLOG.md). Every
    // house component rule below does cover the minigame trees.
    files: [
      "apps/client/src/**/*.{ts,tsx}",
      "packages/cast/src/**/*.{ts,tsx}",
      "packages/scenery/src/**/*.{ts,tsx}",
      "packages/surface/src/**/*.{ts,tsx}"
    ],
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
    // packages/scenery is the city's landmarks, hoisted out of SCHLONIC so JOUST can stand
    // them too; packages/surface is the shared design-system package, governed the same way,
    // and the minigame client trees are most of the game UI — the idiom is house-wide.
    files: [
      "apps/client/src/components/**/*.tsx",
      "packages/cast/src/**/*.tsx",
      "packages/scenery/src/**/*.tsx",
      "packages/surface/src/**/*.tsx",
      "packages/minigames/*/src/client/**/*.tsx"
    ],
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
    files: [
      "apps/client/src/components/**/index.tsx",
      "packages/cast/src/**/index.tsx",
      "packages/scenery/src/**/index.tsx",
      "packages/surface/src/**/index.tsx",
      "packages/minigames/*/src/client/**/index.tsx"
    ],
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
    // The SVG primitives a minigame scene is drawn from. A Prop or a Backdrop is a <g>
    // of shapes with no className anywhere — its colour and geometry come from the scene's
    // palette.ts and its props, so there is no styles.ts for it to import and
    // require-styles-import-in-component-entry has nothing left to ask for. Scope carve-out
    // only — that single rule is off for the primitives and no rule is weakened: the
    // 260-line cap, the inline-style ban, the copy-module rule and the JSON import ban all
    // still apply here, and there is no eslint-disable in any of these files.
    // packages/scenery is the same kind of thing hoisted out of a scene: every landmark in
    // it is a bare <g> painted in the palette its caller hands over, and it carries no
    // className either.
    //
    // The ignores are the parts of a scene that are NOT primitives — the three scene roots,
    // which are the real elements in the DOM, and the four animated parts that carry a
    // className. Each has a sibling styles.ts, so each stays under the rule; without these
    // lines the carve-out would quietly stop noticing if one of them lost its styles import.
    files: [
      "packages/minigames/*/src/client/*Scene/**/index.tsx",
      "packages/scenery/src/**/index.tsx"
    ],
    ignores: [
      "packages/minigames/*/src/client/*Scene/index.tsx",
      "packages/minigames/fappy/src/client/FappyScene/BirdSprite/index.tsx",
      "packages/minigames/joust/src/client/JoustArenaScene/ArenaHen/index.tsx",
      "packages/minigames/joust/src/client/JoustArenaScene/FlightEffects/index.tsx",
      "packages/minigames/joust/src/client/JoustArenaScene/Perch/LegTimber/index.tsx"
    ],
    rules: {
      "wingnight/require-styles-import-in-component-entry": "off"
    }
  },
  {
    // max-lines applies to every tree listed here. The three colour rules carry their own
    // tree list in tools/eslint-plugin-wingnight/rules/houseComponentPaths.mjs; the minigame
    // trees joined it on 2026-09-24, when their chrome moved onto the semantic tokens.
    files: [
      "apps/client/src/components/**/styles.ts",
      "packages/cast/src/**/styles.ts",
      "packages/scenery/src/**/styles.ts",
      "packages/surface/src/**/styles.ts",
      "packages/minigames/*/src/client/**/styles.ts"
    ],
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
    // The design system's own class strings. Not a styles.ts, so max-lines and the export-name
    // rule stay off, but a colour in it reaches every surface at once.
    files: ["packages/surface/src/styleTokens/index.ts"],
    rules: {
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
