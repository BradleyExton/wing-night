const isStylesFile = (filename) =>
  typeof filename === "string" &&
  filename.includes("/apps/client/src/components/") &&
  filename.endsWith("/styles.ts");

const isDisallowedStylesExportName = (name) =>
  typeof name === "string" && name.endsWith("ClassName");

const reportIfDisallowed = (context, node, name) => {
  if (isDisallowedStylesExportName(name)) {
    context.report({ node, messageId: "noClassNameSuffix" });
  }
};

const collectPatternIdentifiers = (pattern, names) => {
  if (!pattern) {
    return;
  }

  if (pattern.type === "Identifier") {
    names.push(pattern.name);
    return;
  }

  if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      if (property.type === "Property") {
        collectPatternIdentifiers(property.value, names);
      }

      if (property.type === "RestElement") {
        collectPatternIdentifiers(property.argument, names);
      }
    }
    return;
  }

  if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) {
      if (element) {
        collectPatternIdentifiers(element, names);
      }
    }
    return;
  }

  if (pattern.type === "RestElement") {
    collectPatternIdentifiers(pattern.argument, names);
    return;
  }

  if (pattern.type === "AssignmentPattern") {
    collectPatternIdentifiers(pattern.left, names);
  }
};

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow exported style identifiers ending with ClassName in client styles.ts files"
    },
    schema: [],
    messages: {
      noClassNameSuffix:
        "Do not suffix exported styles with `ClassName`; export semantic keys like `container` and use `styles.container`."
    }
  },
  create(context) {
    if (!isStylesFile(context.filename)) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        if (node.declaration) {
          if (node.declaration.type === "VariableDeclaration") {
            for (const declaration of node.declaration.declarations) {
              const names = [];
              collectPatternIdentifiers(declaration.id, names);

              for (const name of names) {
                reportIfDisallowed(context, declaration.id, name);
              }
            }
          }

          if (
            (node.declaration.type === "FunctionDeclaration" ||
              node.declaration.type === "ClassDeclaration") &&
            node.declaration.id
          ) {
            reportIfDisallowed(
              context,
              node.declaration.id,
              node.declaration.id.name
            );
          }
        }

        if (node.specifiers.length > 0) {
          for (const specifier of node.specifiers) {
            if (specifier.exported.type === "Identifier") {
              reportIfDisallowed(
                context,
                specifier.exported,
                specifier.exported.name
              );
            }
          }
        }
      }
    };
  }
};
