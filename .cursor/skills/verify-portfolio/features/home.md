# Home

Home at `/` is one full-screen stage. The name sits in the middle. Four entries sit in the corners: Work, Journey, About, and Contact. A particle portrait sits behind the name. The old scroll story is `/noelite`, not this page.

## Sub-features

- `home-open` shows the lowercase name and the corner navigation.
- `home-nav` keeps `alexW`, Work, Journey, and About in the site header. On `/`, those three header links play the same exit transition as the corners.

## How to get to it (user POV)

- Open `/`.
- Choose `alexW` in the site navigation.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open home.** Go to `/`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive home`. A navigation named `Home` is present and contains a link named `Work`. The level-1 heading reads `alex woon`. The site navigation contains links named `alexW` and `Journey`.
- **Proof.** `artifacts/home/page.png` shows the stage. `artifacts/home/main.aria.txt` is the `Home` navigation and includes `Work`.

## Gotchas

- Do not wait for a region named `Introduction`. That region is on `/noelite`.
- The visible name is `alex woon`, lowercase. The About page uses the full name.
- The `Home` nav has no box of its own. The corner links are absolutely positioned. Wait for a link, not for the nav to be visible.
- Contact opens a panel on this page. It is not a route. This recipe does not open it. The contact button carries `data-entry="contact"` like the corner links (`data-entry="work"` and so on).
- Header links, corners and closing the contact panel play short Web Audio blips (`lib/sound.ts`), only after a real click, tap or key. To check them, wrap `window.AudioContext` in an init script and count `createOscillator().start` calls: a blip is one triangle + one sine, the contact close is two blips (A5, E5), a phone corner select is one sine at 1319 Hz. The header speaker button `Sound effects` (`.sound-toggle`, `aria-pressed`) mutes everything; saved in `localStorage['gridlog-sound']`.
- WebGL can fail and show a static portrait. The name and the four entries are still the proof.
