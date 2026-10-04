// How sign-in links reach a guest. `MAIL_TRANSPORT` picks: "resend" in production, "log" in local
// dev (the link is printed to the wrangler console instead). Anything else fails closed — every
// send throws — because a typo that quietly fell back to logging would print live sign-in links
// into production logs.
export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type MailTransport = {
  send(message: MailMessage): Promise<void>;
};

export const MAIL_TRANSPORTS = ["resend", "log"] as const;

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type ResendOptions = {
  apiKey: string | undefined;
  from: string;
  fetch: (input: string, init: RequestInit) => Promise<Response>;
};

export const createResendMailTransport = ({ apiKey, from, fetch }: ResendOptions): MailTransport => ({
  send: async (message) => {
    if (apiKey === undefined || apiKey.length === 0) {
      throw new Error("RESEND_API_KEY is not set.");
    }

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html
      })
    });

    if (!response.ok) {
      throw new Error(`Resend refused the message: ${response.status}.`);
    }
  }
});

// Local dev's mail: the message lands in the console, link and all.
export const createLogMailTransport = (log: (line: string) => void): MailTransport => ({
  send: async (message) => {
    log(`[mail:log] to ${message.to} — ${message.subject}\n${message.text}`);
  }
});

// Tests' mail: keeps every message it was handed.
export const createRecordingMailTransport = (): MailTransport & { sent: MailMessage[] } => {
  const sent: MailMessage[] = [];

  return {
    sent,
    send: async (message) => {
      sent.push(message);
    }
  };
};

const createUnconfiguredMailTransport = (configured: string | undefined): MailTransport => ({
  send: async () => {
    throw new Error(`MAIL_TRANSPORT ${JSON.stringify(configured)} is not one of ${MAIL_TRANSPORTS.join(", ")}.`);
  }
});

type MailEnvironment = {
  transport: string | undefined;
  resend: ResendOptions;
  log: (line: string) => void;
};

export const resolveMailTransport = ({ transport, resend, log }: MailEnvironment): MailTransport => {
  switch (transport) {
    case "resend":
      return createResendMailTransport(resend);
    case "log":
      return createLogMailTransport(log);
    default:
      return createUnconfiguredMailTransport(transport);
  }
};
