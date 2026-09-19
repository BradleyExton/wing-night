// The one and only Suspense fallback for a route's chunk: a full-bleed sheet of
// the app background and nothing else. It is what the tablet and the TV paint
// for the instant between the entry chunk running and the route chunk arriving,
// so it must be indistinguishable from the blank page that precedes it — no
// spinner, no copy, nothing that could read as a flash on a 55" screen.
export const routeFallback = "min-h-[100dvh] w-full bg-bg";
