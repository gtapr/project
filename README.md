# PROJECT: SUNSET — v0.1
Static browser game (no install, no build, no server). Only dependency: Three.js r128 from cdnjs (index.html).

## Publish on GitHub Pages (website only)
1. github.com → **New repository** → name it `sunset` → Public → Create.
2. **Add file → Upload files**. Drag the CONTENTS of the unzipped folder (index.html, style.css, README.md and the `src` folder) into the page. Commit.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main, folder: / (root) → Save.**
4. After ~1 minute open `https://YOUR-USERNAME.github.io/sunset/`.
Opening index.html directly also works (scripts are classic, not ES modules, so no CORS issue); the CDN needs internet.

## Architecture (for future developers)
All modules attach to one global `window.SUNSET` (S). Load order is in index.html.
settings/save (localStorage) · input · world (city, collision boxes, ground height) · player (human model, on-foot, camera) ·
vehicle (Car class + S.vehicles) · npc · interaction (register `{pos,r,prompt,use,active}`) · hud · menu · game (loop, day/night, state, save, audio).
Collision = 2D circle-vs-box via `S.world.resolve`. Add new solid objects with `addBox` in world.js.

## Controls
On foot: WASD, Shift sprint, Space jump, mouse look, wheel zoom, E interact, Esc pause.
Car: W/S throttle/brake-reverse, A/D steer, Space handbrake, E exit (below ~21 km/h).

## Known limitations
No weapons/police/missions yet · NPCs only walk block sidewalks, don't cross roads or react to cars · cars don't collide with each other or NPCs ·
car positions aren't saved (player/money/health/time are) · no swimming/crouch · graphics "camera sensitivity" is merged into look sensitivity ·
untested on real hardware by the author of this file (written without a browser).
