const normalize = (filename) => filename.replace(/\\/g, "/");

const ALLOWED_UTILITY_FILE_PATTERNS = [
  /\/apps\/[^/]+\/src\/utils\/.+\/index\.ts$/,
  /\/apps\/[^/]+\/src\/utils\/.+\/index\.test\.ts$/
];

export default {
  meta: {
    type: "problem",
    docs: {
      description: "enforce index.ts for utility entrypoint files"
    },
    schema: [],
    messages: {
      mustUseIndexTs:
        "Utility files in utils folders must be named index.ts (tests may use index.test.ts)."
    }
  },
  create(context) {
    return {
      Program(node) {
        const filename = normalize(context.filename);
        if (!filename.includes("/src/utils/")) {
          return;
        }

        const isAllowed = ALLOWED_UTILITY_FILE_PATTERNS.some((pattern) =>
          pattern.test(filename)
        );

        if (!isAllowed) {
          context.report({ node, messageId: "mustUseIndexTs" });
        }
      }
    };
  }
};
