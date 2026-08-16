import { TEAM_AUDIO_ROUTE_PATH } from "@wingnight/shared";

// The origin is INJECTED, never read in here. That is forced rather than
// stylistic: client tests run under `tsx --test` with no DOM and no Vite, so a
// bare `import.meta.env` / `window` read at module or render scope throws — a
// property the Anamorph and Contraption lab tests exist to pin. Injecting it
// keeps this resolver a pure function the unit layer can actually exercise, and
// leaves the one environment-dependent read (`resolveServerOrigin`) inside the
// cue effect, where `react-dom/server` never runs it.
//
// The filename is percent-encoded: anthem filenames come from the content pack
// and routinely contain spaces.
export const resolveAnthemSrc = (
  anthemFileName: string,
  serverOrigin: string
): string => {
  return `${serverOrigin}${TEAM_AUDIO_ROUTE_PATH}/${encodeURIComponent(anthemFileName)}`;
};
