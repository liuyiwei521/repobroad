/**
 * 机械替换：任意值 -> 语义 token 类名 / CSS 变量。
 * 单一真源 = scripts/tokens.json。无损：合并组内颜色统一为该组 value（已与用户确认 ~40 收敛策略）。
 * 用法: node scripts/codemod.mjs [--dry]
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const DRY = process.argv.includes("--dry");
const t = JSON.parse(fs.readFileSync(path.join(root, "scripts/tokens.json"), "utf8"));
const files = [
  "src/app/App.tsx",
  "src/app/components/CenterPanel.tsx",
  "src/app/components/LeftPanel.tsx",
  "src/app/components/RightPanel.tsx",
  "src/app/components/MarketChartPage.tsx",
];

// hex -> token name, per family
const idx = { surface: {}, line: {}, ink: {} };
for (const fam of ["surface", "line", "ink"])
  for (const [name, def] of Object.entries(t[fam])) {
    for (const h of [def.value, ...def.aliases]) idx[fam][h.toLowerCase()] = name;
  }
const fontByVal = Object.fromEntries(Object.entries(t.fontSize).map(([n, d]) => [d.value, n]));
const radiusByVal = Object.fromEntries(Object.entries(t.radius).map(([n, d]) => [d.value, n]));

// which family a utility prefix belongs to (primary), with fallbacks
const primary = (p) =>
  ["bg", "from", "via", "to"].includes(p) ? "surface"
  : ["border", "ring", "outline", "divide"].includes(p) ? "line"
  : "ink";
const order = (p) => {
  const pr = primary(p);
  return [pr, "ink", "surface", "line"].filter((x, i, a) => a.indexOf(x) === i);
};
function resolveUtil(prefix, hex) {
  for (const fam of order(prefix)) if (idx[fam][hex]) return idx[fam][hex];
  return null;
}
function resolveBare(hex) {
  for (const fam of ["ink", "surface", "line"]) if (idx[fam][hex]) return `${fam}:${idx[fam][hex]}`;
  return null;
}

const stats = { util: 0, font: 0, radius: 0, bare: 0 };
const unmatched = new Set();
const compound = []; // rgba/gradient/shadow arbitrary -> manual

for (const rel of files) {
  const fp = path.join(root, rel);
  let src = fs.readFileSync(fp, "utf8");
  let usedTk = false;

  // 1. utility color arbitrary value: prefix-[#rrggbb] (optionally with /opacity)
  src = src.replace(
    /\b(bg|text|border|ring|from|via|to|fill|stroke|outline|divide|decoration|caret|accent)-\[(#[0-9a-fA-F]{6})\](\/\d{1,3})?/g,
    (m, prefix, hex, op) => {
      const tok = resolveUtil(prefix, hex.toLowerCase());
      if (!tok) { unmatched.add(`${prefix}-${hex}`); return m; }
      stats.util++;
      return `${prefix}-${tok}${op || ""}`;
    }
  );

  // 2. font-size arbitrary: text-[11px] (NOT text-[#hex], handled above)
  src = src.replace(/\btext-\[(\d+(?:\.\d+)?(?:px|rem))\]/g, (m, v) => {
    const tok = fontByVal[v];
    if (!tok) { unmatched.add(`text-[${v}]`); return m; }
    stats.font++;
    return `text-${tok}`;
  });

  // 3. radius arbitrary: rounded-[2px]
  src = src.replace(/\brounded-\[(\d+(?:\.\d+)?(?:px|rem))\]/g, (m, v) => {
    const tok = radiusByVal[v];
    if (!tok) { unmatched.add(`rounded-[${v}]`); return m; }
    stats.radius++;
    return `rounded-${tok}`;
  });

  // 4a. JSX attribute form: name="#rrggbb" -> name={tk["token"]}
  src = src.replace(/([A-Za-z][\w-]*)=(['"])(#[0-9a-fA-F]{6})\2/g, (m, attr, q, hex) => {
    const r = resolveBare(hex.toLowerCase());
    if (!r) { unmatched.add(`bare ${hex}`); return m; }
    stats.bare++; usedTk = true;
    return `${attr}={tk[${JSON.stringify(r.split(":")[1])}]}`;
  });
  // 4b. JS expression string literal: "#rrggbb" / '#rrggbb' -> tk["token"]
  src = src.replace(/(['"])(#[0-9a-fA-F]{6})\1/g, (m, q, hex) => {
    const r = resolveBare(hex.toLowerCase());
    if (!r) { unmatched.add(`bare ${hex}`); return m; }
    stats.bare++; usedTk = true;
    return `tk[${JSON.stringify(r.split(":")[1])}]`;
  });

  // ensure `import { tk } from "<rel>/styles/tokens.gen"` present
  if (usedTk && !/from ["'][^"']*styles\/tokens\.gen["']/.test(src)) {
    const depth = rel.includes("/components/") ? "../../styles/tokens.gen" : "../styles/tokens.gen";
    src = src.replace(/^(import .*\n)/, `$1import { tk } from "${depth}";\n`);
  }

  // flag compound arbitrary values containing colors (manual phase)
  for (const mm of src.matchAll(/\[[^\]]*(?:rgba?\([^)]*\)|linear-gradient|#[0-9a-fA-F]{6}[^\]]*,)[^\]]*\]/g))
    compound.push(`${rel}: ${mm[0].slice(0, 80)}`);

  if (!DRY) fs.writeFileSync(fp, src);
}

console.log(DRY ? "[DRY RUN]" : "[WRITTEN]");
console.log("replaced:", stats);
console.log("unmatched (left as-is):", unmatched.size ? [...unmatched].join(", ") : "none ✓");
console.log(`compound arbitrary to review manually: ${compound.length}`);
for (const c of [...new Set(compound)].slice(0, 40)) console.log("  -", c);
