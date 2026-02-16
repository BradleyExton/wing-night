import { containerStyle, headingStyle, subtextStyle } from "./styles";

export const DisplayPlaceholder = (): JSX.Element => {
  return (
    <main style={containerStyle}>
      <div>
        <h1 style={headingStyle}>Display Route Placeholder</h1>
        <p style={subtextStyle}>Display view will render here.</p>
      </div>
    </main>
  );
};
