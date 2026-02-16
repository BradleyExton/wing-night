import { containerStyle, headingStyle, subtextStyle } from "./styles";

export const RouteNotFound = (): JSX.Element => {
  return (
    <main style={containerStyle}>
      <div>
        <h1 style={headingStyle}>Route Placeholder Not Found</h1>
        <p style={subtextStyle}>Use /host or /display.</p>
      </div>
    </main>
  );
};
