import { containerClassName, headingClassName, subtextClassName } from "./styles";
import { routeNotFoundCopy } from "./copy";

export const RouteNotFound = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>{routeNotFoundCopy.title}</h1>
        <p className={subtextClassName}>{routeNotFoundCopy.description}</p>
      </div>
    </main>
  );
};
