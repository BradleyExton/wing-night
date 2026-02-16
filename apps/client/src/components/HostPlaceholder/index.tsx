import { containerClassName, headingClassName, subtextClassName } from "./styles";

export const HostPlaceholder = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>Host Route Placeholder</h1>
        <p className={subtextClassName}>Host controls will render here.</p>
      </div>
    </main>
  );
};
