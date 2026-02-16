import { containerClassName, headingClassName, subtextClassName } from "./styles";

export const RouteNotFound = (): JSX.Element => {
  return (
    <main className={containerClassName}>
      <div>
        <h1 className={headingClassName}>Route Placeholder Not Found</h1>
        <p className={subtextClassName}>Use /host or /display.</p>
      </div>
    </main>
  );
};
