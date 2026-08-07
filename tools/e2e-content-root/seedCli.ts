import { seedE2eContentRoot } from "./index.ts";

// Run as the first half of the e2e server's webServer command, NOT as
// Playwright's `globalSetup`: Playwright launches its webServer processes
// BEFORE global setup runs, so a root seeded there arrives after the server has
// already booted against an empty one and fataled with "Missing players content
// file". Chaining it into the command is what makes the ordering unambiguous —
// the server process cannot start until this has exited.
//
// It also must not live at the Playwright config's module scope: workers load
// that config too, so the seed would re-run mid-suite and delete the `local/`
// directory a `config:apply` had just written.
seedE2eContentRoot();
