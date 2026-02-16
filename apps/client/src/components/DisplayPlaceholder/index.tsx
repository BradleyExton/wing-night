import { containerClassName, headingClassName, subtextClassName } from "./styles";

export const DisplayPlaceholder = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>Display Route Placeholder</h1>
        <p className={subtextClassName}>Display view will render here.</p>
      </div>
    </main>
  );
};
