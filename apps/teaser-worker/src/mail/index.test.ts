import assert from "node:assert/strict";
import test from "node:test";

import { resolveMailTransport, type MailMessage } from "./index.ts";

const MESSAGE: MailMessage = { to: "rob@example.com", subject: "Hi", text: "link", html: "<p>link</p>" };

const resolveWith = (transport: string | undefined, { apiKey }: { apiKey: string | undefined } = { apiKey: "re_test" }) => {
  const calls: { input: string; init: RequestInit }[] = [];
  const logged: string[] = [];
  const mail = resolveMailTransport({
    transport,
    resend: {
      apiKey,
      from: "party@wingnight.tv",
      fetch: async (input, init) => {
        calls.push({ input, init });

        return new Response("{}", { status: 200 });
      }
    },
    log: (line) => logged.push(line)
  });

  return { mail, calls, logged };
};

test("does post the message to Resend from MAIL_FROM when the transport is resend", async () => {
  const { mail, calls, logged } = resolveWith("resend");

  await mail.send(MESSAGE);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.input, "https://api.resend.com/emails");
  assert.equal(new Headers(calls[0]?.init.headers).get("Authorization"), "Bearer re_test");
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
    from: "party@wingnight.tv",
    to: ["rob@example.com"],
    subject: "Hi",
    text: "link",
    html: "<p>link</p>"
  });
  assert.equal(logged.length, 0);
});

test("does throw rather than send when Resend has no API key", async () => {
  const { mail, calls } = resolveWith("resend", { apiKey: undefined });

  await assert.rejects(mail.send(MESSAGE));
  assert.equal(calls.length, 0);
});

test("does print the message and send nothing when the transport is log", async () => {
  const { mail, calls, logged } = resolveWith("log");

  await mail.send(MESSAGE);

  assert.equal(calls.length, 0);
  assert.match(logged[0] ?? "", /rob@example\.com[\s\S]*link/);
});

test("does fail every send closed when the transport is unknown or unset", async () => {
  for (const transport of ["Resend", "", undefined]) {
    const { mail, calls, logged } = resolveWith(transport);

    await assert.rejects(mail.send(MESSAGE), /MAIL_TRANSPORT/);
    assert.equal(calls.length, 0);
    assert.equal(logged.length, 0);
  }
});
