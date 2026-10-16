# SDD: Original home score

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `discarded`
- **Date:** 2026-10-16
- **Related:** [architecture.md](../architecture.md)

## 1. Context / current architecture

Home (`app/page.tsx` → `components/home/TronHome.tsx`) is a GSAP scroll story. The fixed header (`components/gallery/NavPill.tsx`) sits in the root layout on every route. There is no audio anywhere on the site.

The home scene paints its own night look. A scroll handoff writes `--tron` on `html` from Legacy cyan `#5ce1ff` to Ares red `#ff2b2b`. Gallery (`/work`) and About stay on `next-themes`. Leaving `/` unmounts `TronHome`.

## 2. Problem and non-goals

**Problem:** The home scene is silent. A short original electronic loop, opt-in, should sit under the scroll story.

**Non-goals:**

- Do not use, transcribe, or closely imitate **End of Line** or any other *TRON: Legacy* cue (melody, hook, bassline, or recording).
- Do not host an audio file, embed YouTube, or autoplay.
- Do not play on `/work` or `/about`.
- Do not add a timeline editor, track list, or visualizer.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What should the music be? | An original loop in a dark electronic mood, built in the browser. Stated in chat before this SDD; user said to build that. |
| When does it play? | Starts muted. A control turns it on. Sound stops when the visitor leaves `/`, because the player unmounts with `TronHome`. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Add `components/home/HomeScore.tsx`, rendered only by `TronHome`. It owns one `AudioContext`. The button is portaled into `#home-score-slot` in the header’s right cluster, which `NavPill` renders only on `/`, so the control sits in the row and does not cover Work or About.

The loop is synthesized with the Web Audio API: a quiet pulse, a short original arpeggio in a minor key that is not the End of Line contour, and a soft noise hat. No samples. Turning sound on resumes the context (browsers block audio until a gesture). Turning it off suspends the context. Unmount disconnects nodes and closes the context.

While sound is on, read `--tron` on `html` a few times a second. As the handoff moves from cyan toward red, open a low-pass filter and lift a thin upper voice. Reduced motion does not change this: nothing autoplays either way.

**Pros:**

- No copyrighted recording and no extra asset in the static export.
- One component, deleted from the tree when the visitor leaves home, so other routes stay silent.
- The color handoff already on the page becomes audible without a second scroll system.

**Cons / risks:**

- Web Audio sounds thinner than a produced track. This is a texture, not a soundtrack replacement.
- A filter that tracks `--tron` can glitch if the variable is missing; fall back to the cyan setting.
- Autoplay policies differ by browser. The control must be the thing that starts audio, and the label must say when sound is off.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Embed or rip the YouTube upload of End of Line | Copyrighted recording and composition. |
| Ship an MP3 | Still needs a license if it is someone else’s piece, and adds an asset. |
| Site-wide player in `NavPill` | Sound would follow the visitor into the gallery and About. |

## 5. Acceptance criteria and verification

- [x] Home loads silent. No `AudioContext` is running until the visitor turns sound on.
- [x] The control is a button with an accessible name that switches between sound off and sound on.
- [x] While on, a loop is audible, and the tone brightens as the home handoff moves `--tron` from cyan to red.
- [x] Turning sound off silences it immediately. Navigating to `/work` or `/about` silences it and does not show the control.
- [x] The loop is original: different key, rhythm, and contour from End of Line. No audio file and no YouTube embed.
- [x] Verify in the browser: load `/`, confirm silence, turn sound on, scroll through the handoff, turn sound off, open `/work` and confirm silence.

Verified in the browser on 2026-10-16. Home loaded with the control at "Sound off" and zero audio contexts. Turning it on moved the context to `running` and the low-pass from 420 Hz to about 2620 Hz when `--tron` was `#ff2b2b`. Turning it off suspended the context. A client navigation to `/work/` removed the slot and the button.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-16 | draft | Original opt-in home loop |
| 2026-10-16 | approved | User said build |
| 2026-10-16 | implemented | Opt-in loop on home; verified in the browser |
| 2026-10-16 | discarded | Removed. The synthesized loop was too thin to keep. |
