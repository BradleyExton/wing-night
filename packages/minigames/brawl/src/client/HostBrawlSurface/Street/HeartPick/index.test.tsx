import assert from "node:assert/strict";
import test from "node:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HeartPick } from "./index.js";

type ButtonProps = { "data-brawl-heart-pick-choice"?: string; onClick?: () => void; children?: ReactNode };

// The cards are plain buttons, so a press is their onClick: find the one a choice names in the
// element tree the component returns, and press it.
const findChoice = (node: ReactNode, choice: string): ReactElement<ButtonProps> | null => {
  if (!isValidElement<ButtonProps>(node)) {
    return Array.isArray(node) ? (node.map((child) => findChoice(child, choice)).find((found) => found !== null) ?? null) : null;
  }

  if (node.props["data-brawl-heart-pick-choice"] === choice) {
    return node;
  }

  return findChoice(node.props.children, choice);
};

const renderPick = () => {
  const presses: string[] = [];
  const tree = HeartPick({
    heartPrice: 3,
    banked: 14,
    onBuy: () => presses.push("buy"),
    onKeep: () => presses.push("keep")
  });

  return { tree, presses };
};

test("does offer both cards with the price and the bank when the pick is up", () => {
  const markup = renderToStaticMarkup(renderPick().tree);

  assert.ok(markup.includes("data-brawl-heart-pick"));
  assert.ok(markup.includes("Buy a heart"));
  assert.ok(markup.replace(/<[^>]+>/g, "").includes("a 4th heart · costs 3 worth · you have 14"));
  assert.ok(markup.includes("Keep the three"));
  assert.ok(markup.includes("or just start walking"));
});

test("does buy the heart when the holder taps Buy, and only keep the three when they tap Keep", () => {
  const { tree, presses } = renderPick();

  findChoice(tree, "buy")?.props.onClick?.();
  assert.deepEqual(presses, ["buy"]);

  findChoice(tree, "keep")?.props.onClick?.();
  assert.deepEqual(presses, ["buy", "keep"]);
});
