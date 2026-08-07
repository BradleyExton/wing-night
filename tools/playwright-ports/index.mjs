/**
 * Resolves the ports Playwright's `webServer` blocks bind to, from an env override with a
 * fallback to the conventional interactive default.
 *
 * The gate commands in `.work/manifest.yml` pin dedicated e2e ports so a Playwright run always
 * boots its own servers. An unset override keeps the familiar 3000/5173 for interactive use.
 *
 * A *malformed* override throws rather than falling back: silently reverting to 5173 on a typo
 * is exactly the failure this indirection exists to prevent, because the run would then reuse
 * whatever dev server happens to hold that port and report a green gate for a foreign tree.
 *
 * @param {Record<string, string | undefined>} env - the environment to read (injected, so tests
 *   don't mutate `process.env`).
 * @param {string} variableName - the override's env-var name; also named in the error.
 * @param {number} fallbackPort - the port used when the override is unset.
 * @returns {number} the resolved port.
 */
export function resolvePort(env, variableName, fallbackPort) {
  const rawValue = env[variableName];

  if (rawValue === undefined || rawValue.trim() === "") {
    return fallbackPort;
  }

  const parsedPort = Number(rawValue.trim());

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(
      `${variableName}="${rawValue}" is not a valid port (expected an integer 1-65535). ` +
        `Refusing to fall back to ${fallbackPort}: a live dev server on that port would be ` +
        `reused and the run would verify the wrong tree.`
    );
  }

  return parsedPort;
}
