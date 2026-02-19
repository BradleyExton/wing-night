# Wing Night Core Flow + UI Reference

_Last updated: February 19, 2026_

## Purpose
This document gives a single, end-to-end reference for the core Wing Night game lifecycle so someone can analyze all major host/display UI states without stepping through the live game manually.

## Scope
Included:
- Core phase flow (`SETUP` through `FINAL_RESULTS`)
- Host and display UI states for each major transition
- Host override dock and escape-hatch paths (`Skip Turn`, score override, reset)

Excluded:
- Minigame-specific gameplay rules/details (trivia correctness flow, GEO interaction details, drawing interaction details)
- Content pack authoring workflows

## Core Flow (State Machine)
```mermaid
flowchart TD
  A["SETUP"] --> B["INTRO"]
  B --> C["ROUND_INTRO"]
  C --> D["EATING (Team n)"]
  D --> E["MINIGAME_INTRO (Team n)"]
  E --> F["MINIGAME_PLAY (Team n)"]
  F --> G{"More teams in round?"}
  G -- Yes --> D
  G -- No --> H["ROUND_RESULTS"]
  H --> I{"More rounds?"}
  I -- Yes --> C
  I -- No --> J["FINAL_RESULTS"]
  J --> K["Reset Game (Override)"]
  K --> A
```

## Phase/UI Matrix
| Phase | Host UI mode | Display UI mode | Key controls | Override dock |
| --- | --- | --- | --- | --- |
| `SETUP` | Team setup + player assignment surfaces | Fallback stage (`Setup in progress`) + standings | Create team, assign players | Hidden |
| `INTRO` | Compact standings snapshot | Fallback stage (`Intro in progress`) + standings | `Next Phase` | Hidden |
| `ROUND_INTRO` | Compact standings snapshot + round context pills | Round intro stage (round/sauce/minigame metadata) + standings | `Next Phase` | Visible, turn-order editable |
| `EATING` | Active-team players + timer controls | Eating stage (active team + timer) + standings | Wing participation, pause/resume/extend timer, `Next Phase` | Visible, `Skip Turn` available |
| `MINIGAME_INTRO` | Header-only context (no phase body) | Minigame stage intro context + standings | `Next Phase` | Visible, `Skip Turn` available |
| `MINIGAME_PLAY` | Minigame surface (or waiting fallback for non-trivia host view) | Minigame stage play context + standings | `Next Phase`; trivia rounds also show scoring actions | Visible, `Skip Turn` available |
| `ROUND_RESULTS` | Compact standings snapshot | Fallback stage (`Round Results in progress`) + updated standings | `Next Phase` | Visible, score override / undo / reset |
| `FINAL_RESULTS` | Compact standings snapshot | Fallback stage (`Final Results in progress`) + winner-highlighted standings | `Next Phase` disabled | Visible, reset |

## Captured Core States
All screenshots below were captured with Playwright MCP against local sample content (`Team One`, `Team Two`; rounds `TRIVIA`, `GEO`, `DRAWING`).

### 01. Setup (Empty)
| Host | Display |
| --- | --- |
| ![01 host](screenshots/core-flows/01-setup-empty-host.png) | ![01 display](screenshots/core-flows/01-setup-empty-display.png) |

### 02. Setup (Teams Created)
| Host | Display |
| --- | --- |
| ![02 host](screenshots/core-flows/02-setup-with-teams-host.png) | ![02 display](screenshots/core-flows/02-setup-with-teams-display.png) |

### 03. Setup (Players Assigned / Ready)
| Host | Display |
| --- | --- |
| ![03 host](screenshots/core-flows/03-setup-assigned-host.png) | ![03 display](screenshots/core-flows/03-setup-assigned-display.png) |

### 04. Intro
| Host | Display |
| --- | --- |
| ![04 host](screenshots/core-flows/04-intro-host.png) | ![04 display](screenshots/core-flows/04-intro-display.png) |

### 05. Round Intro (Round 1)
| Host | Display |
| --- | --- |
| ![05 host](screenshots/core-flows/05-round-intro-host.png) | ![05 display](screenshots/core-flows/05-round-intro-display.png) |

### 06. Round Intro + Overrides Panel Open
| Host | Display |
| --- | --- |
| ![06 host](screenshots/core-flows/06-round-intro-overrides-open-host.png) | ![06 display](screenshots/core-flows/06-round-intro-overrides-open-display.png) |

### 07. Eating (Team One)
| Host | Display |
| --- | --- |
| ![07 host](screenshots/core-flows/07-eating-team-one-host.png) | ![07 display](screenshots/core-flows/07-eating-team-one-display.png) |

### 08. Eating (Timer Paused)
| Host | Display |
| --- | --- |
| ![08 host](screenshots/core-flows/08-eating-timer-paused-host.png) | ![08 display](screenshots/core-flows/08-eating-timer-paused-display.png) |

### 09. Minigame Intro (Team One)
| Host | Display |
| --- | --- |
| ![09 host](screenshots/core-flows/09-minigame-intro-team-one-host.png) | ![09 display](screenshots/core-flows/09-minigame-intro-team-one-display.png) |

### 10. Minigame Play (Team One)
| Host | Display |
| --- | --- |
| ![10 host](screenshots/core-flows/10-minigame-play-team-one-host.png) | ![10 display](screenshots/core-flows/10-minigame-play-team-one-display.png) |

### 11. Eating (Team Two)
| Host | Display |
| --- | --- |
| ![11 host](screenshots/core-flows/11-eating-team-two-host.png) | ![11 display](screenshots/core-flows/11-eating-team-two-display.png) |

### 12. Round 1 Results
| Host | Display |
| --- | --- |
| ![12 host](screenshots/core-flows/12-round-one-results-host.png) | ![12 display](screenshots/core-flows/12-round-one-results-display.png) |

### 13. Round Results + Overrides Panel Open
| Host | Display |
| --- | --- |
| ![13 host](screenshots/core-flows/13-round-results-overrides-open-host.png) | ![13 display](screenshots/core-flows/13-round-results-overrides-open-display.png) |

### 14. Round Results After Score Override
| Host | Display |
| --- | --- |
| ![14 host](screenshots/core-flows/14-round-results-after-score-override-host.png) | ![14 display](screenshots/core-flows/14-round-results-after-score-override-display.png) |

### 15. Round Intro (Round 2)
| Host | Display |
| --- | --- |
| ![15 host](screenshots/core-flows/15-round-two-intro-host.png) | ![15 display](screenshots/core-flows/15-round-two-intro-display.png) |

### 16. Eating (Round 2)
| Host | Display |
| --- | --- |
| ![16 host](screenshots/core-flows/16-round-two-eating-host.png) | ![16 display](screenshots/core-flows/16-round-two-eating-display.png) |

### 17. Minigame Intro (Round 2)
| Host | Display |
| --- | --- |
| ![17 host](screenshots/core-flows/17-round-two-minigame-intro-host.png) | ![17 display](screenshots/core-flows/17-round-two-minigame-intro-display.png) |

### 18. Minigame Play (Round 2)
| Host | Display |
| --- | --- |
| ![18 host](screenshots/core-flows/18-round-two-minigame-play-host.png) | ![18 display](screenshots/core-flows/18-round-two-minigame-play-display.png) |

### 19. Round 2 Minigame Play + Overrides Open
| Host | Display |
| --- | --- |
| ![19 host](screenshots/core-flows/19-round-two-minigame-overrides-open-host.png) | ![19 display](screenshots/core-flows/19-round-two-minigame-overrides-open-display.png) |

### 20. Skip Turn Used (Round 2 -> Team Two)
| Host | Display |
| --- | --- |
| ![20 host](screenshots/core-flows/20-round-two-skip-to-team-two-host.png) | ![20 display](screenshots/core-flows/20-round-two-skip-to-team-two-display.png) |

### 21. Round 2 Results After Skip
| Host | Display |
| --- | --- |
| ![21 host](screenshots/core-flows/21-round-two-results-after-skip-host.png) | ![21 display](screenshots/core-flows/21-round-two-results-after-skip-display.png) |

### 22. Final Results
| Host | Display |
| --- | --- |
| ![22 host](screenshots/core-flows/22-final-results-host.png) | ![22 display](screenshots/core-flows/22-final-results-display.png) |

### 23. Final Results + Overrides Open
| Host | Display |
| --- | --- |
| ![23 host](screenshots/core-flows/23-final-results-overrides-open-host.png) | ![23 display](screenshots/core-flows/23-final-results-overrides-open-display.png) |

### 24. Reset to Setup
| Host | Display |
| --- | --- |
| ![24 host](screenshots/core-flows/24-reset-to-setup-host.png) | ![24 display](screenshots/core-flows/24-reset-to-setup-display.png) |

## Coverage Checklist
- Global phases covered in captures: `SETUP`, `INTRO`, `ROUND_INTRO`, `EATING`, `MINIGAME_INTRO`, `MINIGAME_PLAY`, `ROUND_RESULTS`, `FINAL_RESULTS`.
- Team-turn loop shown: first-team and second-team turn states in `EATING`, `MINIGAME_INTRO`, and `MINIGAME_PLAY`.
- Override/escape hatch states shown: overrides panel open in `ROUND_INTRO`, `ROUND_RESULTS`, `MINIGAME_PLAY`, and `FINAL_RESULTS`; `Skip Turn` path; score override path; reset-to-setup path.
- Host/display pairing coverage: each numbered state includes both host and display screenshots.

## Notes for Analysis
- The display route intentionally collapses multiple phases (`SETUP`, `INTRO`, `ROUND_RESULTS`, `FINAL_RESULTS`) into the fallback stage body while preserving phase badge and standings context.
- The host override dock is the consistent escape-hatch surface in all gameplay phases except `SETUP` and `INTRO`.
- Round flow repeats a per-team turn loop (`EATING -> MINIGAME_INTRO -> MINIGAME_PLAY`) before aggregating at `ROUND_RESULTS`.
