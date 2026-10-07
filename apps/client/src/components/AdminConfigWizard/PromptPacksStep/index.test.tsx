import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PromptPacksStep } from "./index";

const render = (issues: Map<string, string[]>): string =>
  renderToStaticMarkup(
    <PromptPacksStep
      trivia={{
        prompts: [{ id: "q1", question: "Hottest?", answer: "Reaper!", choices: ["Jalapeño", "Reaper"] }]
      }}
      drawing={{ prompts: [{ id: "d1", prompt: "A pepper" }] }}
      geoPromptCount={0}
      triviaIssueMessagesByPath={issues}
      drawingIssueMessagesByPath={new Map()}
      isLocked={false}
      onTriviaChange={(): void => {}}
      onDrawingChange={(): void => {}}
    />
  );

test("does show a question's choices and the issue against them when the answer has left them", () => {
  const html = render(new Map([["prompts[0].choices", ["must include the answer exactly as written"]]]));

  assert.match(html, /id="admin-trivia-choices-0"/);
  assert.match(html, /Jalapeño · Reaper/);
  assert.match(html, /must include the answer exactly as written/);
});
