import { isHouseComponentPath, normalizeFilename } from "./houseComponentPaths.mjs";

const COMPONENT_ENTRY_FILE_PATTERN =
  /\/(?:apps\/client\/src\/components|packages\/cast\/src)\/.+\/index(?:\.test)?\.tsx$/;

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "enforce index.tsx as the entrypoint filename for component TSX files"
    },
    schema: [],
    messages: {
      mustUseIndexTsx:
        "Component files in component folders must be named index.tsx or index.test.tsx."
    }
  },
  create(context) {
    return {
      Program(node) {
        const filename = normalizeFilename(context.filename);
        if (!isHouseComponentPath(filename)) {
          return;
        }

        if (COMPONENT_ENTRY_FILE_PATTERN.test(filename)) {
          return;
        }

        context.report({ node, messageId: "mustUseIndexTsx" });
      }
    };
  }
};
