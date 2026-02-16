import { containerClassName, headingClassName, subtextClassName } from "./styles";
import { uiCopy } from "../../copy";

export const RouteNotFound = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>{uiCopy.routeNotFound.title}</h1>
        <p className={subtextClassName}>{uiCopy.routeNotFound.description}</p>
      </div>
    </main>
  );
};
