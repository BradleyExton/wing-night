export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "require component entrypoint files to import styles from ./styles"
    },
    schema: [],
    messages: {
      missingStylesImport:
        "Component entrypoint must import styles from \"./styles\"."
    }
  },
  create(context) {
    let hasStylesImport = false;

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (source === "./styles" || source === "./styles.ts") {
          hasStylesImport = true;
        }
      },
      "Program:exit"(node) {
        if (!hasStylesImport) {
          context.report({ node, messageId: "missingStylesImport" });
        }
      }
    };
  }
};
