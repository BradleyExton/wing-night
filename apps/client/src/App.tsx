import { DisplayPlaceholder } from "./components/DisplayPlaceholder";
import { HostPlaceholder } from "./components/HostPlaceholder";
import { RouteNotFound } from "./components/RouteNotFound";
import { resolveClientRoute } from "./utils/resolveClientRoute";

export const App = (): JSX.Element => {
  const route = resolveClientRoute(window.location.pathname);

  if (route === "HOST") {
    return <HostPlaceholder />;
  }

  if (route === "DISPLAY") {
    return <DisplayPlaceholder />;
  }

  return <RouteNotFound />;
};
