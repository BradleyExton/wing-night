// Shim — the real verify Stop-hook lives in the claude-dev-system checkout (its imports need that
// repo's tools/src + node_modules, so it can't be vendored standalone). Stamped command resolves
// ${CLAUDE_PROJECT_DIR}/tools/hooks/, so this file forwards to the system checkout.
import '/Users/bradleyexton/Projects/claude-dev-system/tools/hooks/verify-stop.ts';
