/**
 * Guards against the failure mode that broke the last build: a class name that
 * looks right, produces no CSS, and fails silently at runtime.
 *
 * Run with `npm run check:classes` (also part of `npm run verify`).
 *
 * It checks that every custom token referenced in a className — colours,
 * z-index layers, spacing, font sizes, shadows, background images — is
 * actually declared in tailwind.config.ts.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const config = fs.readFileSync(path.join(ROOT, "tailwind.config.ts"), "utf8");

/** Pulls the keys of a named block out of the config source. */
function keysOf(block) {
  const start = config.indexOf(`${block}: {`);
  if (start === -1) return new Set();
  let depth = 0, i = config.indexOf("{", start);
  const from = i;
  for (; i < config.length; i++) {
    if (config[i] === "{") depth++;
    else if (config[i] === "}") { depth--; if (depth === 0) break; }
  }
  const body = config.slice(from, i);
  const keys = new Set();
  for (const m of body.matchAll(/(?:^|[{,\s])["']?([A-Za-z][\w-]*|\d+(?:\.\d+)?)["']?\s*:/g)) {
    keys.add(m[1]);
  }
  return keys;
}

const colors = keysOf("colors");
const zIndex = keysOf("zIndex");
const spacing = keysOf("spacing");
const fontSize = keysOf("fontSize");
const boxShadow = keysOf("boxShadow");
const bgImage = keysOf("backgroundImage");
const screens = keysOf("screens");
const fontFamily = keysOf("fontFamily");
const radius = keysOf("borderRadius");

// Tailwind ships these; the config only adds to them.
const BUILTIN_COLORS = new Set([
  "white", "black", "transparent", "current", "inherit", "none",
  "red", "green", "blue", "amber", "neutral", "gray", "slate", "zinc", "stone",
]);
const BUILTIN_SPACING = new Set([
  "0","px","0.5","1","1.5","2","2.5","3","3.5","4","5","6","7","8","9","10","11","12",
  "14","16","20","24","28","32","36","40","44","48","52","56","60","64","72","80","96",
  "auto","full","screen","min","max","fit","dvh","svh","lvh",
]);
const BUILTIN_FONTSIZE = new Set([
  "xs","sm","base","lg","xl","2xl","3xl","4xl","5xl","6xl","7xl","8xl","9xl",
]);
const BUILTIN_SHADOW = new Set(["sm","","md","lg","xl","2xl","inner","none"]);
const BUILTIN_ZINDEX = new Set(["0","10","20","30","40","50","auto"]);
const BUILTIN_RADIUS = new Set(["none","sm","","md","lg","xl","2xl","3xl","full"]);

const problems = [];

function checkToken(kind, token, declared, builtin, file) {
  if (!token) return;
  if (builtin.has(token) || declared.has(token)) return;
  // Arbitrary values and opacity modifiers are always fine.
  if (token.startsWith("[") || token.includes("/")) return;
  problems.push(`${kind} "${token}" is not defined in tailwind.config.ts  ->  ${file}`);
}

function scan(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (fs.statSync(p).isDirectory()) { scan(p); continue; }
    if (!/\.tsx?$/.test(p)) continue;
    const src = fs.readFileSync(p, "utf8");
    const rel = path.relative(ROOT, p);

    // Only look inside className strings and the styles.ts recipes.
    const chunks = [...src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)]
      .map((m) => m[1] ?? m[2] ?? "");
    // For the recipe file, take only the string literals — scanning raw source
    // would treat object keys like `primary:` as class names.
    if (rel.endsWith("lib/styles.ts")) {
      for (const m of src.matchAll(/"([^"\n]*)"/g)) chunks.push(m[1]);
    }

    for (const chunk of chunks) {
      for (let cls of chunk.split(/\s+/)) {
        // Strip syntax that leaks in when scanning styles.ts source.
        cls = cls.trim().replace(/^["'`+]+|["'`+,;)}]+$/g, "");
        if (!cls || cls.includes("${") || cls.includes("(") || cls.includes("=")) continue;
        // Skip operators and fragments left over from inline ternaries.
        if (!/^-?[a-z]/.test(cls)) continue;

        // Arbitrary values may legitimately contain ":" — e.g. bg-[length:12px].
        if (cls.includes("[")) continue;

        // Strip responsive / state prefixes, validating each breakpoint.
        const parts = cls.split(":");
        const base = parts.pop();
        for (const prefix of parts) {
          const bare = prefix.replace(/^(max-|group-|peer-)/, "");
          const STATES = ["hover","focus","active","disabled","first","last","odd","even",
                          "focus-visible","focus-within","visited","checked","placeholder",
                          "before","after","dark","print","motion-safe","motion-reduce","not-sr-only"];
          if (STATES.includes(bare) || screens.has(bare) || bare.startsWith("[")) continue;
          problems.push(`variant "${prefix}" is unknown  ->  ${rel}`);
        }
        if (!base) continue;

        let m;
        // Side/axis modifiers on borders and dividers: border-b, border-x-2.
        if (/^(?:border|divide)(?:-[trblxyse])?(?:-\d+)?$/.test(base)) continue;
        if ((m = base.match(/^(?:border|divide)-[trblxyse]-(.+)$/))) {
          const val = m[1];
          if (BUILTIN_SPACING.has(val)) continue;
          const root = val.includes("-") ? val.split("-")[0] : val;
          checkToken("colour", root, colors, BUILTIN_COLORS, rel);
          continue;
        }
        // fill/stroke keywords and widths.
        if (/^(?:fill|stroke)-(?:none|current|inherit|\d+(?:\.\d+)?)$/.test(base)) continue;

        if ((m = base.match(/^-?(?:bg|text|border|ring|stroke|fill|from|to|via|outline|decoration|divide|accent|placeholder|shadow|caret)-(.+)$/))) {
          const val = m[1].split("/")[0];
          const kind = base.split("-")[0];
          if (kind === "shadow") { checkToken("shadow", val, boxShadow, BUILTIN_SHADOW, rel); continue; }
          if (kind === "bg" && bgImage.has(val)) continue;
          if (kind === "text" && (fontSize.has(val) || BUILTIN_FONTSIZE.has(val))) continue;
          if (kind === "text" && ["left","right","center","justify","wrap","nowrap","balance","ellipsis","clip"].includes(val)) continue;
          if (kind === "border" && (BUILTIN_SPACING.has(val) || ["solid","dashed","dotted","none"].includes(val))) continue;
          if (kind === "bg" && ["cover","contain","center","no-repeat","repeat","repeat-x","fixed","local","scroll","clip-padding","gradient-to-r","gradient-to-b","gradient-to-br"].includes(val)) continue;
          // Split compound colour tokens like "line-gold" or "maroon-deep".
          const root = val.includes("-") ? val.split("-")[0] : val;
          checkToken("colour", root, colors, BUILTIN_COLORS, rel);
          continue;
        }
        if ((m = base.match(/^z-(.+)$/))) { checkToken("z-index", m[1], zIndex, BUILTIN_ZINDEX, rel); continue; }
        // Spacing scale: a value not on the scale silently produces no CSS,
        // which is exactly the kind of bug that is invisible until someone
        // looks at the page.
        if ((m = base.match(/^-?(?:gap-x|gap-y|gap|space-x|space-y|inset-x|inset-y|inset|min-w|min-h|max-w|max-h|px|py|pt|pb|pl|pr|p|mx|my|mt|mb|ml|mr|m|w|h|top|bottom|left|right|size)-(.+)$/))) {
          const val = m[1];
          if (/^(?:screen|full|auto|fit|min|max|prose|none|px|dvh|svh|lvh|\d*\/\d+)$/.test(val)) continue;
          if (spacing.has(val)) continue;
          checkToken("spacing", val, spacing, BUILTIN_SPACING, rel);
          continue;
        }
        if ((m = base.match(/^rounded(?:-[trbl]{1,2})?-?(.*)$/))) { checkToken("radius", m[1], radius, BUILTIN_RADIUS, rel); continue; }
        if ((m = base.match(/^font-(.+)$/))) {
          const v = m[1];
          if (["thin","light","normal","medium","semibold","bold","extrabold","black"].includes(v)) continue;
          checkToken("font", v, fontFamily, new Set(["mono","sans","serif"]), rel);
          continue;
        }
      }
    }
  }
}

scan(path.join(ROOT, "src"));

if (problems.length) {
  console.error(`\n${problems.length} unresolved Tailwind token(s):\n`);
  [...new Set(problems)].sort().forEach((p) => console.error("  ✗ " + p));
  process.exit(1);
}
console.log("✓ every Tailwind token used resolves through tailwind.config.ts");
