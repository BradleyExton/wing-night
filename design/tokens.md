# Design Tokens

Source: `DESIGN.md` + `apps/client/tailwind.config.ts`

## Color Tokens

| Token | Hex | Semantic Usage |
|---|---|---|
| `bg` | `#121212` | Global dark background |
| `surface` | `#1C1C1C` | Primary card/surface background |
| `surfaceAlt` | `#242424` | Secondary surface layers |
| `text` | `#FFFFFF` | Primary foreground text |
| `muted` | `#A3A3A3` | Secondary labels/meta |
| `primary` | `#F97316` | Default emphasis (burnt orange) |
| `heat` | `#EF4444` | Urgency/escalation only |
| `success` | `#22C55E` | Functional success state |
| `danger` | `#DC2626` | Functional danger state |
| `gold` | `#FBBF24` | Winner/celebration moments |

## Palette Guardrails

- Use at most 2 accent colors in one illustration.
- Treat `primary` as default highlight color.
- Reserve red-family (`heat`, `danger`) for semantic heat/danger moments.
- Avoid introducing non-token colors unless explicitly approved.

## Spacing Tokens

Base rhythm: `8px`

Recommended scale:

- `space-0`: `0`
- `space-0.5`: `4px`
- `space-1`: `8px`
- `space-1.5`: `12px`
- `space-2`: `16px`
- `space-3`: `24px`
- `space-4`: `32px`
- `space-5`: `40px`
- `space-6`: `48px`
- `space-8`: `64px`

## Default Aspect Ratios

- Hero/banner: `16:9`
- Marketing/support cards: `4:3`
- Icons: `1:1`

## Typical Export Sizes

- Hero: `1920x1080`, `1600x900`
- Card: `1200x900`, `800x600`
- Icon: `512x512`, `256x256`
