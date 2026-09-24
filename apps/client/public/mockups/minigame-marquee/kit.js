/* global document, CustomEvent, setInterval, clearInterval */
// Four turns from the pack's real roster, cycled on click. The clock ticks
// live so every direction shows its calm, urgent (<=15s) and time's-up
// states without a screenshot per state. Press U to jump into the last 15s.
const SCENARIOS = [
  { team: "Honky Tonk Heat", font: '"Rye"', color: "#d98324", title: "Geo", counter: "Photo 1 / 2", counterN: 1, counterOf: 2, pending: null, seconds: 39 },
  { team: "Molten Metal", font: '"Metal Mania"', color: "#d9dee6", title: "Emoji Charades", counter: null, pending: 0, seconds: 84 },
  { team: "Disco Inferno", font: '"Monoton"', color: "#06b6d4", title: "Live Sketch", counter: null, pending: 3, seconds: 19 },
  { team: "Spice Girls", font: '"Fredoka"', color: "#ec4899", title: "Song Guess", counter: "Song 3 / 6", counterN: 3, counterOf: 6, pending: null, seconds: 150 }
];
let index = 0, seconds = 0, total = 1, timer = null;
const $$ = (slot) => document.querySelectorAll(`[data-slot="${slot}"]`);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
function paintClock() {
  const root = document.documentElement, body = document.body;
  root.style.setProperty("--remaining", String(Math.max(0, seconds / total)));
  body.classList.toggle("urgent", seconds > 0 && seconds <= 15);
  body.classList.toggle("timeup", seconds === 0);
  $$("clock").forEach((el) => { el.textContent = seconds === 0 ? (el.dataset.timeup ?? "TIME'S UP") : fmt(seconds); });
  $$("seconds").forEach((el) => { el.textContent = String(seconds); });
}
function load(i) {
  index = (i + SCENARIOS.length) % SCENARIOS.length;
  const s = SCENARIOS[index];
  seconds = s.seconds; total = s.seconds;
  const root = document.documentElement;
  root.style.setProperty("--team", s.color);
  root.style.setProperty("--team-font", s.font);
  $$("team").forEach((el) => { el.textContent = s.team; });
  $$("title").forEach((el) => { el.textContent = s.title; });
  $$("counter").forEach((el) => { el.hidden = s.counter === null; el.textContent = s.counter ?? ""; });
  $$("pending").forEach((el) => { el.hidden = s.pending === null; el.textContent = s.pending === null ? "" : `+${s.pending}`; });
  document.body.dataset.scenario = String(index);
  document.dispatchEvent(new CustomEvent("scenario", { detail: s }));
  paintClock();
  clearInterval(timer);
  timer = setInterval(() => { if (seconds > 0) { seconds -= 1; paintClock(); } }, 1000);
}
document.addEventListener("click", () => load(index + 1));
document.addEventListener("keydown", (e) => {
  if (e.key === "u" || e.key === "U") { seconds = 15; paintClock(); }
  if (e.key === "ArrowRight" || e.key === " ") load(index + 1);
  if (e.key === "ArrowLeft") load(index - 1);
});
load(0);
