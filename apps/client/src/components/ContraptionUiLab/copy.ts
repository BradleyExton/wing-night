export const contraptionUiLabCopy = {
  heading: "CONTRAPTION UI Direction Lab",
  description:
    "Three structurally different readings of the same beat: the thrower, the throw, the target, " +
    "and the miss. Drive each one, then pick a direction — the pick is not made here.",
  variantLegend: "Variant",
  outcomeLegend: "Outcome",
  replay: "Replay",
  outcomeLabel: {
    landed: "Landed — in the can",
    missed: "Missed — on the floor"
  },
  axisLabel: {
    throwerPlacement: "Thrower",
    throwScale: "Throw",
    targetTreatment: "Target"
  },
  beatsLegend: "Sequence",
  projectileQuestionHeading: "The projectile question — AC#5",
  projectileQuestionIntro:
    "The integrator models bodies as circles with position only: no angular velocity, no torque, " +
    "no orientation. A sprite over such a body holds a FIXED angle for the whole run, however far " +
    "it slides. Both candidates are drawn under that constraint below.",
  rotationNeeded: "Implication: this shape needs angular velocity — new physics in the WN-23 module.",
  rotationNotNeeded: "Implication: this shape needs no new physics.",
  pickReminder:
    "Observation only. The aesthetic pick between drumette and wing bone stays with the human " +
    "reviewer, and nothing here adds rotation to the integrator.",
  scriptedSceneNote:
    "Scripted scene, not a run of the real integrator — this lab judges the picture, and WN-18's " +
    "ContraptionLab is the harness over the real physics. The fixed-orientation constraint IS " +
    "faithfully reproduced, because that is the part being judged."
} as const;
