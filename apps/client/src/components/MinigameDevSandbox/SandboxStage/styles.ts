// The preview half of the sandbox's layout. Re-exported from the parent rather
// than moved, the way SandboxControls does it: the frames and the chrome above
// them share a max-width, so they stay defined side by side.
export {
  displayShell,
  displayViewport,
  hostCanvas,
  hostShell,
  hostViewport,
  previewCard,
  previewGrid,
  previewHeader,
  previewHeaderLabel,
  previewHeaderMeta
} from "../styles";
