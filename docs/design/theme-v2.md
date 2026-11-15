# Design v2: one blue and tan theme, an app shell, no AI look

Status: **proposal, handed to Mason to implement** (issue #74, screens lane). It replaces the teal and yellow colors from #67 and #70, so `src/app/globals.css` (a hot file) changes only after Michael agrees.

Why: Holly's review of the live app (Nov 14) found it "does not look professional or app-like; it reads as AI-generated."

## 1. One theme for everyone

- One look for every age group. Only the check content changes by age (the word lists in `src/content/checks.ts`, #68). Colors, type, layout and components stay the same for a 6-year-old and an adult. #36 (play look and plain look) narrows to wording only.
- Blues and tans/beiges. One blue accent. Tan is a surface color, never text.

Contrast checked against WCAG 2.x:

| Token                                        | Hex       | Use                                                    | Contrast                        |
| -------------------------------------------- | --------- | ------------------------------------------------------ | ------------------------------- |
| `--background`                               | `#F6F1E7` | page (warm beige)                                      |                                 |
| `--surface`                                  | `#FFFDF8` | rows, sheets                                           |                                 |
| `--sand` (new)                               | `#EDE3D1` | grouped list background, selected row                  |                                 |
| `--line`                                     | `#DDD0B9` | dividers                                               |                                 |
| `--foreground`                               | `#1B2A41` | navy text                                              | 12.8:1 on page                  |
| `--muted`                                    | `#56606E` | small print                                            | 5.7:1 on page, 5.0:1 on sand    |
| `--accent`                                   | `#2A5A96` | the one blue: buttons, meter marker, links             | white text 7.0:1, 6.2:1 on page |
| `--accent-edge`                              | `#1D406D` | pressed state, blue text on soft blue                  | 8.8:1 on accent-soft            |
| `--accent-soft`                              | `#E4ECF6` | selected chip, info box                                |                                 |
| `--tan-text` (replaces yellow `violet-edge`) | `#74572F` | rare warm label                                        | 5.3:1 on sand                   |
| `--hit`                                      | `#1F7A4D` | result: the sound was there, plus a check              | 5.2:1 on surface                |
| `--close`                                    | `#E3A72F` | result: the other hiss, plus an arrow; navy text on it | 6.8:1                           |
| `--miss`                                     | `#B3392B` | result: not yet, as an outline plus a word             | 4.9:1 on its soft fill          |

The logo: keep the teal bird as the logo only, or redraw it as a simple navy and blue mark. The current logo was made with ChatGPT image generation (see `README.md` in this folder), which adds to the AI look.

## 2. Checklist: what to avoid and what to do

Sources: designer write-ups and Apple's Human Interface Guidelines. These are design guidance, not studies. One scan of 1,590 Show HN sites found 22% with four or more AI-look signs ([Krebs](https://adriankrebs.ch/blog/design-slop/)).

1. App shell: a top bar plus a bottom tab bar with 3 or 4 one-word tabs (Practice, Checks, Progress, More). Tabs are always visible ([Apple: tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)).
2. Grouped list rows with dividers instead of floating cards. At most one card per screen ([Apple: lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)).
3. Home opens on the next task ("Next: 's' at the end of words, 6 of 10"), not a marketing page. "Who it is for" and the FAQ move to More.
4. One blue accent. No gradients, glow, glass or "New" pills.
5. Tan is a surface only, never text.
6. One icon set at one stroke weight. No emoji as icons. No tinted icon square on every row.
7. Two or three corner sizes: 8 px for rows, 14 px for sheets and buttons, full for chips.
8. Remove the "clay" bottom-edge shadows. Use a 1 px divider.
9. Motion only for feedback (meter, result), under 300 ms, with `prefers-reduced-motion` honored. No entrance animations on lists.
10. A clear type scale: 28 / 20 / 17 / 15 px, at most two weights per screen.
11. Real content: our own drawings and real screenshots, no generated images. Designed empty, loading and error states.
12. Every result is an icon plus a word plus a color, never color alone.

## 3. Open-source parts to borrow

Full notes, with stars, licenses and dates, are kept in Holly's research folder (`design-repos-review.md`).

1. [shadcn/ui](https://github.com/shadcn-ui/ui): copy-paste components that already run on Tailwind v4 and React 19. Copy Dialog (as a bottom sheet), Tabs, Switch, Progress, Toggle Group (a segmented control for age and devices) and the Sonner toast, then restyle with our tokens and 48 px targets. Their Radix or Base UI building blocks are new packages, so they need a team OK.
2. [Radix Colors](https://github.com/radix-ui/colors) `sand` and `blue` scales as the palette source. Check each pair in [Adobe Leonardo](https://github.com/adobe/leonardo).
3. [Konsta UI](https://github.com/konstaui/konsta) as a reference for patterns that feel native (list rows, tab bar, sheets). Do not install it: its accessibility is weaker.

Not a fit: Park UI (uses Panda CSS), daisyUI (no behavior or ARIA), Radix Themes, Mantine and Ionic (their own CSS or router fights our Tailwind tokens).

## 4. Build order (feature freeze Sun Nov 15, 11:00 AM)

1. Tokens in `globals.css`: the colors above, three radii, and no clay edges. Low risk, biggest visible change.
2. Top bar and bottom tab bar in `layout.tsx` (hot file).
3. Home becomes "next task" with grouped rows. The landing sections move to More.
4. Check screens: age and devices pickers become a segmented control, and results become grouped rows.

Holly writes the tab names and the empty-state wording (content lane).
