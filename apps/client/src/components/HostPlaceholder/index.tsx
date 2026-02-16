import { containerStyle, headingStyle, subtextStyle } from "./styles";

export const HostPlaceholder = (): JSX.Element => {
  return (
    <main style={containerStyle}>
      <div>
        <h1 style={headingStyle}>Host Route Placeholder</h1>
        <p style={subtextStyle}>Host controls will render here.</p>
      </div>
    </main>
  );
};
