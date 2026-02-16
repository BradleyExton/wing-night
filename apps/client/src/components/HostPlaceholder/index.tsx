import { containerClassName, headingClassName, subtextClassName } from "./styles";
import { hostPlaceholderCopy } from "./copy";

export const HostPlaceholder = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>{hostPlaceholderCopy.title}</h1>
        <p className={subtextClassName}>{hostPlaceholderCopy.description}</p>
      </div>
    </main>
  );
};
