const EVENT_NAME_PATTERN = /^[a-z]+:[a-z][a-zA-Z]*$/;
const EVENT_CONSTANT_OBJECT_NAMES = new Set([
  "CLIENT_TO_SERVER_EVENTS",
  "SERVER_TO_CLIENT_EVENTS"
]);

const getKeyName = (keyNode) => {
  if (keyNode.type === "Literal" && typeof keyNode.value === "string") {
    return keyNode.value;
  }

  if (keyNode.type === "Identifier") {
    return keyNode.name;
  }

  return null;
};

const getStringLiteralValue = (node) => {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
  }

  return null;
};

const unwrapObjectExpression = (node) => {
  if (!node) {
    return null;
  }

  if (node.type === "ObjectExpression") {
    return node;
  }

  if (node.type === "TSAsExpression" || node.type === "TSSatisfiesExpression") {
    return unwrapObjectExpression(node.expression);
  }

  return null;
};

export default {
  meta: {
    type: "problem",
    docs: {
      description: "enforce socket event keys to match domain:action naming"
    },
    schema: [],
    messages: {
      invalidEventName:
        "Socket event name \"{{eventName}}\" must match domain:action (example: game:nextPhase)."
    }
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (
          node.id.type !== "Identifier" ||
          !EVENT_CONSTANT_OBJECT_NAMES.has(node.id.name)
        ) {
          return;
        }

        const objectExpression = unwrapObjectExpression(node.init);
        if (!objectExpression) {
          return;
        }

        for (const property of objectExpression.properties) {
          if (property.type !== "Property") {
            continue;
          }

          const eventName = getStringLiteralValue(property.value);
          if (eventName === null) {
            continue;
          }

          if (!EVENT_NAME_PATTERN.test(eventName)) {
            context.report({
              node: property.value,
              messageId: "invalidEventName",
              data: { eventName }
            });
          }
        }
      },
      TSPropertySignature(node) {
        if (node.computed) {
          return;
        }

        const eventName = getKeyName(node.key);
        if (eventName === null) {
          return;
        }

        if (!EVENT_NAME_PATTERN.test(eventName)) {
          context.report({
            node: node.key,
            messageId: "invalidEventName",
            data: { eventName }
          });
        }
      }
    };
  }
};
