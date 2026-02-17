import componentEntryFileName from "./rules/component-entry-file-name.mjs";
import noHardcodedComponentJsxText from "./rules/no-hardcoded-component-jsx-text.mjs";
import noHardcodedHexColorsInStyles from "./rules/no-hardcoded-hex-colors-in-styles.mjs";
import noInlineStyleProp from "./rules/no-inline-style-prop.mjs";
import requireStylesImportInComponentEntry from "./rules/require-styles-import-in-component-entry.mjs";
import socketEventNameFormat from "./rules/socket-event-name-format.mjs";
import utilityEntryFileName from "./rules/utility-entry-file-name.mjs";

const plugin = {
  rules: {
    "component-entry-file-name": componentEntryFileName,
    "no-hardcoded-component-jsx-text": noHardcodedComponentJsxText,
    "no-hardcoded-hex-colors-in-styles": noHardcodedHexColorsInStyles,
    "no-inline-style-prop": noInlineStyleProp,
    "require-styles-import-in-component-entry":
      requireStylesImportInComponentEntry,
    "socket-event-name-format": socketEventNameFormat,
    "utility-entry-file-name": utilityEntryFileName
  }
};

export default plugin;
