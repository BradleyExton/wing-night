const EVENT_NAME_PATTERN = /^[a-z]+:[a-z][a-zA-Z]*$/;

const getKeyName = (keyNode) => {
  if (keyNode.type === "Literal" && typeof keyNode.value === "string") {
    return keyNode.value;
  }

  if (keyNode.type === "Identifier") {
    return keyNode.name;
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
