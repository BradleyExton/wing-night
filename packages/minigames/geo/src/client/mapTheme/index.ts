// Both GEO surfaces draw the same map in the same clothes: the tablet's chart
// and the TV's theatre differ in what they let you do, not in how they look.
//
// The rules themselves live in the client's `index.css` rather than in Tailwind
// arbitrary values — a five-function filter inlined into a class string is
// unreadable and, more to the point, uncommentable, and the reason for the
// inversion is the whole point (DESIGN.md §2.4).
export const darkMapClassName = "geo-map-dark";

// Carried by the TV's map while the guess is still open, so the one pin on it
// breathes and the room can find it in a whole world. It goes on the map rather
// than on the marker because react-leaflet applies `pathOptions` through
// Leaflet's `setStyle()`, which updates stroke and fill and drops `className`
// on the floor. Once the answer lands the class goes and both pins hold still,
// which is what a result should do.
export const livePinMapClassName = "geo-map-live";
