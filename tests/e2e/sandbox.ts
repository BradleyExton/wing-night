// The sandbox seeds itself from the server's content pack by default, so every
// spec below would otherwise be asserting on whatever roster and prompt bank
// the stack happens to be serving. `?seed=fixture` pins it to the package's
// bundled fixture instead: a twelve-player, four-team room with a known lane
// and a known prompt bank, which is the scenario these specs were written
// against and the one that gives JOUST a rack worth drawing.
//
// The pack path has its own coverage in the server's dev-sandbox route tests.
export const devSandboxPath = (slug: string): string => {
  return `/dev/minigame/${slug}?seed=fixture`;
};
