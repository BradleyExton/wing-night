export const routeNotFoundCopy = {
  title: "404 - Page Not Found",
  description:
    "That route does not exist. Open a valid Wing Night surface from the links below.",
  actions: [
    {
      href: "/",
      label: "Back to Landing",
      detail: "Choose between the host and display surfaces."
    },
    {
      href: "/host",
      label: "Open Host Controls",
      detail: "Run the game flow and apply host actions."
    },
    {
      href: "/display",
      label: "Open Display Board",
      detail: "Show the read-only game view for players."
    }
  ]
} as const;
