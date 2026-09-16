/* Generates the placeholder artwork in /images.
 *
 * These stand in until real photos are dropped in. Each venue gets its own
 * deterministic palette and blob arrangement, seeded from its id, so the
 * output is stable across runs and the cards don't all look the same.
 *
 *   node scripts/make-placeholders.mjs
 *
 * Replacing a placeholder with a real photo: see README.md. This script only
 * writes files that don't exist yet, so it will never clobber a real photo.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// venues.js is a browser file that assigns to window — give it a window to
// assign to and eval it rather than duplicating the list here.
const window = {};
new Function("window", readFileSync(resolve(root, "venues.js"), "utf8"))(window);

// Blush / plum / champagne. Each entry is [from, to, accent].
const PALETTES = [
  ["#f7d9e3", "#e9b6cb", "#8c4a6b"],
  ["#fae3d4", "#f0c1ae", "#a65b4a"],
  ["#e6dcf2", "#c9b6e4", "#5f4b8b"],
  ["#dceae6", "#b3d4c9", "#3f7566"],
  ["#fdeccd", "#f2d49b", "#9a7033"],
  ["#f3dde8", "#dcb4d1", "#713f6b"],
  ["#dde6f2", "#b6c8e4", "#3f5a8b"],
  ["#fbe0dd", "#efb9b3", "#a4504a"]
];

// Small deterministic PRNG so a given venue id always draws the same picture.
function seeded(str) {
  let h = 2166136261;
  for (const ch of str) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h >>>= 0;
    h ^= h >> 17;
    h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  };
}

/* An organic closed shape — a circle with each radius nudged, joined by
   quadratic curves. Reads as a spilled blob of paint rather than a bubble. */
function blob(rand, cx, cy, radius) {
  const points = 7;
  const pts = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (0.72 + rand() * 0.45);
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < points; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % points];
    const mid = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2];
    d += ` Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${mid[0].toFixed(1)} ${mid[1].toFixed(1)}`;
  }
  return d + " Z";
}

function monogram(name) {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function svg(venue, index) {
  const rand = seeded(venue.id + ":" + index);
  const [from, to, accent] = PALETTES[Math.floor(rand() * PALETTES.length)];
  const W = 800;
  const H = 600;
  const tilt = index % 2 === 0 ? 18 : -14;

  const blobs = [];
  for (let i = 0; i < 4; i++) {
    const cx = 120 + rand() * (W - 240);
    const cy = 100 + rand() * (H - 200);
    const r = 90 + rand() * 150;
    const opacity = (0.16 + rand() * 0.22).toFixed(2);
    const fill = i % 2 === 0 ? accent : "#ffffff";
    blobs.push(
      `<path d="${blob(rand, cx, cy, r)}" fill="${fill}" opacity="${opacity}"/>`
    );
  }

  // A couple of loose brush strokes over the top.
  const strokes = [];
  for (let i = 0; i < 2; i++) {
    const y = 120 + rand() * (H - 240);
    const sway = 60 + rand() * 120;
    strokes.push(
      `<path d="M -40 ${y.toFixed(0)} Q ${(W / 3).toFixed(0)} ${(y - sway).toFixed(0)} ${(W / 2).toFixed(0)} ${y.toFixed(0)} T ${(W + 40).toFixed(0)} ${(y + sway / 2).toFixed(0)}" fill="none" stroke="${accent}" stroke-width="${(6 + rand() * 12).toFixed(0)}" stroke-linecap="round" opacity="0.14"/>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${venue.name} — placeholder artwork">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${blobs.join("\n  ")}
  ${strokes.join("\n  ")}
  <text x="${W / 2}" y="${H / 2 + 46}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="200" font-style="italic" fill="${accent}" opacity="0.30" transform="rotate(${tilt} ${W / 2} ${H / 2})">${monogram(venue.name)}</text>
  <text x="${W / 2}" y="${H - 42}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="3" fill="${accent}" opacity="0.55">PHOTO COMING SOON</text>
</svg>
`;
}

mkdirSync(resolve(root, "images"), { recursive: true });

let written = 0;
let kept = 0;
for (const venue of window.VENUES) {
  venue.photos.forEach((relPath, index) => {
    const out = resolve(root, relPath);
    if (existsSync(out)) { kept++; return; }
    writeFileSync(out, svg(venue, index));
    written++;
  });
}
console.log(`placeholders: ${written} written, ${kept} left alone (already exist)`);
