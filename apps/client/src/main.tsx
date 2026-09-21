import ReactDOM from "react-dom/client";
import { App } from "./App";
import "leaflet/dist/leaflet.css";
// The keyframes packages/surface's style tokens name. The package ships them
// because it declares them; see packages/surface/src/keyframes.css.
import "@wingnight/surface/keyframes.css";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing #root element");
}

ReactDOM.createRoot(container).render(<App />);
