import test from "node:test";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";

import componentEntryFileName from "../rules/component-entry-file-name.mjs";
import noHardcodedComponentJsxText from "../rules/no-hardcoded-component-jsx-text.mjs";
import noInlineStyleProp from "../rules/no-inline-style-prop.mjs";
import requireStylesImportInComponentEntry from "../rules/require-styles-import-in-component-entry.mjs";
import socketEventNameFormat from "../rules/socket-event-name-format.mjs";
import utilityEntryFileName from "../rules/utility-entry-file-name.mjs";

RuleTester.describe = (_text, method) => method();
RuleTester.it = (_text, method) => method();
RuleTester.itOnly = (_text, method) => method();

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true
      }
    }
  }
});

test("require-styles-import-in-component-entry", () => {
  ruleTester.run(
    "require-styles-import-in-component-entry",
    requireStylesImportInComponentEntry,
    {
      valid: [
        {
          filename: "/repo/apps/client/src/components/Example/index.tsx",
          code: "import { containerClassName } from './styles'; export const Example = () => <main className={containerClassName} />;"
        }
      ],
      invalid: [
        {
          filename: "/repo/apps/client/src/components/Example/index.tsx",
          code: "export const Example = () => <main />;",
          errors: [{ messageId: "missingStylesImport" }]
        }
      ]
    }
  );
});

test("no-inline-style-prop", () => {
  ruleTester.run("no-inline-style-prop", noInlineStyleProp, {
    valid: [
      {
        filename: "/repo/apps/client/src/components/Example/index.tsx",
        code: "export const Example = () => <main className='x' />;"
      }
    ],
    invalid: [
      {
        filename: "/repo/apps/client/src/components/Example/index.tsx",
        code: "export const Example = () => <main style={{ color: 'red' }} />;",
        errors: [{ messageId: "noInlineStyle" }]
      }
    ]
  });
});

test("no-hardcoded-component-jsx-text", () => {
  ruleTester.run(
    "no-hardcoded-component-jsx-text",
    noHardcodedComponentJsxText,
    {
      valid: [
        {
          filename: "/repo/apps/client/src/components/Example/index.tsx",
          code: "const copy = { title: 'Title' }; export const Example = () => <h1>{copy.title}</h1>;"
        }
      ],
      invalid: [
        {
          filename: "/repo/apps/client/src/components/Example/index.tsx",
          code: "export const Example = () => <h1>Hello</h1>;",
          errors: [{ messageId: "noHardcodedText" }]
        },
        {
          filename: "/repo/apps/client/src/components/Example/index.tsx",
          code: "export const Example = () => <h1>{`Hello`}</h1>;",
          errors: [{ messageId: "noHardcodedText" }]
        }
      ]
    }
  );
});

test("socket-event-name-format", () => {
  ruleTester.run("socket-event-name-format", socketEventNameFormat, {
    valid: [
      {
        filename: "/repo/packages/shared/src/socketEvents/index.ts",
        code: "export type Events = { 'client:requestState': () => void; 'game:nextPhase': () => void; };"
      }
    ],
    invalid: [
      {
        filename: "/repo/packages/shared/src/socketEvents/index.ts",
        code: "export type Events = { 'invalid-name': () => void; };",
        errors: [{ messageId: "invalidEventName" }]
      }
    ]
  });
});

test("component-entry-file-name", () => {
  ruleTester.run("component-entry-file-name", componentEntryFileName, {
    valid: [
      {
        filename: "/repo/apps/client/src/components/Example/index.tsx",
        code: "export const Example = () => null;"
      }
    ],
    invalid: [
      {
        filename: "/repo/apps/client/src/components/Example/View.tsx",
        code: "export const View = () => null;",
        errors: [{ messageId: "mustUseIndexTsx" }]
      }
    ]
  });
});

test("utility-entry-file-name", () => {
  ruleTester.run("utility-entry-file-name", utilityEntryFileName, {
    valid: [
      {
        filename: "/repo/apps/client/src/utils/resolveThing/index.ts",
        code: "export const resolveThing = () => 1;"
      },
      {
        filename: "/repo/apps/client/src/utils/resolveThing/index.test.ts",
        code: "export const x = 1;"
      }
    ],
    invalid: [
      {
        filename: "/repo/apps/client/src/utils/resolveThing/resolveThing.ts",
        code: "export const resolveThing = () => 1;",
        errors: [{ messageId: "mustUseIndexTs" }]
      }
    ]
  });
});
