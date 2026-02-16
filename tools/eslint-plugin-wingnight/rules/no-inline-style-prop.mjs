export default {
  meta: {
    type: "problem",
    docs: {
      description: "disallow inline JSX style props in component entry files"
    },
    schema: [],
    messages: {
      noInlineStyle:
        "Inline JSX style props are not allowed; define styles in styles.ts and import them."
    }
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name && node.name.type === "JSXIdentifier" && node.name.name === "style") {
          context.report({ node, messageId: "noInlineStyle" });
        }
      }
    };
  }
};
