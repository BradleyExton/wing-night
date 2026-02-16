import { containerClassName, headingClassName, subtextClassName } from "./styles";
import { displayPlaceholderCopy } from "./copy";

export const DisplayPlaceholder = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>{displayPlaceholderCopy.title}</h1>
        <p className={subtextClassName}>{displayPlaceholderCopy.description}</p>
      </div>
    </main>
  );
};
