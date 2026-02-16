import { containerClassName, headingClassName, subtextClassName } from "./styles";
import { uiCopy } from "../../copy";

export const DisplayPlaceholder = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>{uiCopy.displayPlaceholder.title}</h1>
        <p className={subtextClassName}>{uiCopy.displayPlaceholder.description}</p>
      </div>
    </main>
  );
};
