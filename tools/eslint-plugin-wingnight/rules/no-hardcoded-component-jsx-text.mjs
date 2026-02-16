const hasMeaningfulText = (value) => value.trim().length > 0;

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow hardcoded JSX text in component entrypoints; use copy modules instead"
    },
    schema: [],
    messages: {
      noHardcodedText:
        "Hardcoded JSX text is not allowed in component entrypoints; import text from copy modules."
    }
  },
  create(context) {
    return {
      JSXText(node) {
        if (hasMeaningfulText(node.value)) {
          context.report({ node, messageId: "noHardcodedText" });
        }
      },
      JSXExpressionContainer(node) {
        const expression = node.expression;

        if (expression.type === "Literal" && typeof expression.value === "string") {
          if (hasMeaningfulText(expression.value)) {
            context.report({ node, messageId: "noHardcodedText" });
          }
          return;
        }

        if (
          expression.type === "TemplateLiteral" &&
          expression.expressions.length === 0
        ) {
          const textValue = expression.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
          if (hasMeaningfulText(textValue)) {
            context.report({ node, messageId: "noHardcodedText" });
          }
        }
      }
    };
  }
};
