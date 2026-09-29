import ReactDOM from "react-dom/client";

import { TeaserApp } from "./components/TeaserApp";
import "@wingnight/surface/keyframes.css";
import "./index.css";

// The online teaser's entry (vite.teaser.config.ts). The party app's is main.tsx, and nothing
// here imports it: the teaser ships the lobby scene and the minigames it lets you play, and none
// of the room — no socket, no host deck, no admin.
const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing #root element");
}

ReactDOM.createRoot(container).render(<TeaserApp />);
