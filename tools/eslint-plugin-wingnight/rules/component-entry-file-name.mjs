import { normalizeFilename } from "./houseComponentPaths.mjs";

// The trees whose React components live in folders: apps/client, the shared cast and
// surface packages, and every minigame client tree. One source of truth — the gate below
// and the entry-file pattern are built from it, so the two can no longer drift apart.
const COMPONENT_FOLDER_ROOTS =
  "(?:apps/client/src/components|packages/cast/src|packages/surface/src|packages/minigames/[^/]+/src/client)";

const COMPONENT_FOLDER_PATTERN = new RegExp(`/${COMPONENT_FOLDER_ROOTS}/`);

const COMPONENT_ENTRY_FILE_PATTERN = new RegExp(
  `/${COMPONENT_FOLDER_ROOTS}/.+/index(?:\\.test)?\\.tsx$`
);

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
        if (!COMPONENT_FOLDER_PATTERN.test(filename)) {
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
