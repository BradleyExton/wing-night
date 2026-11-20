import ReactDOM from "react-dom/client";

import { RunGunOnlineLab } from "./components/RunGunLab/Online";
import "@wingnight/cast/moves.css";
import "./index.css";

// PROTOTYPE — throwaway (docs/minigames/base-borden-spec.md §0.7 step 1): the online jump lab's
// entry (vite.lab.config.ts), deployed as its own Worker on workers.dev. Nothing of the party app
// or the teaser ships with it.
const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing #root element");
}

ReactDOM.createRoot(container).render(<RunGunOnlineLab />);
