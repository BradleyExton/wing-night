import { containerClassName, headingClassName, subtextClassName } from "./styles";
import { uiCopy } from "../../copy";

export const HostPlaceholder = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>{uiCopy.hostPlaceholder.title}</h1>
        <p className={subtextClassName}>{uiCopy.hostPlaceholder.description}</p>
      </div>
    </main>
  );
};
