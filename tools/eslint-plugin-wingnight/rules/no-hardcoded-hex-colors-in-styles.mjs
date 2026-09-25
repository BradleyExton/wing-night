import { isHouseStylesFile as isStylesFile } from "./houseComponentPaths.mjs";

// A literal colour in any of the forms CSS accepts inline: hex, and the rgb/hsl functions with
// or without alpha. A token colour that needs an alpha inside an arbitrary value is written
// `theme(colors.gold/35%)`, which Tailwind resolves at build time and this pattern ignores.
// No `\b` on either side: Tailwind writes spaces as underscores, and neither `_rgba(` nor
// `#2a1306_0%` has a word boundary where one would be looked for — the second hid a whole
// gradient from this rule. Lookarounds on letters and digits instead.
const LITERAL_COLOR_PATTERN = /#[0-9a-fA-F]{3,8}(?![0-9A-Za-z])|(?<![A-Za-z])(?:rgba?|hsla?)\(/;

// Scene art is licensed to carry its own palette (DESIGN.md §2.4, §2.5, §2.7, §2.9, §2.11): a
// dusk sky or a zone's grass is not chrome and has no token. A styles.ts keeps such a string in
// an export whose name starts with `scene` — so the licence is visible at the declaration, and a
// chrome string cannot borrow it without saying so.
const SCENE_EXPORT_PATTERN = /^scene[A-Z0-9]/;

const containsLiteralColor = (text) =>
  typeof text === "string" && LITERAL_COLOR_PATTERN.test(text);

const isInsideSceneDeclaration = (node) => {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === "VariableDeclarator") {
      return current.id.type === "Identifier" && SCENE_EXPORT_PATTERN.test(current.id.name);
    }
  }
  return false;
};

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow hardcoded hex/rgb/hsl colours in house styles files; use tailwind theme tokens from DESIGN.md"
    },
    schema: [],
    messages: {
      noHardcodedHexColor:
        "Hardcoded colours are not allowed in styles.ts. Use Tailwind theme token classes (for example, bg-bg or text-gold), or theme(colors.gold/35%) inside an arbitrary value. Licensed scene art goes in a `scene*` export."
    }
  },
  create(context) {
    if (!isStylesFile(context.filename)) {
      return {};
    }

    const report = (node, text) => {
      if (containsLiteralColor(text) && !isInsideSceneDeclaration(node)) {
        context.report({ node, messageId: "noHardcodedHexColor" });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          report(node, node.value);
        }
      },
      TemplateLiteral(node) {
        if (node.expressions.length > 0) {
          return;
        }

        report(node, node.quasis.map((quasi) => quasi.value.cooked ?? "").join(""));
      }
    };
  }
};
