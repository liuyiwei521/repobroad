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

// 归一化 hex -> { base6:'#rrggbb', alphaPct:number|null }
function normHex(h) {
  let x = h.replace("#", "").toLowerCase();
  if (x.length === 3) x = [...x].map((c) => c + c).join("");
  else if (x.length === 4) x = [...x].map((c) => c + c).join("");
  let alpha = null;
  if (x.length === 8) { alpha = Math.round((parseInt(x.slice(6), 16) / 255) * 100); x = x.slice(0, 6); }
  if (x.length !== 6) return null;
  return { base6: "#" + x, alphaPct: alpha };
}
const HEX = "(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})";

const stats = { util: 0, font: 0, radius: 0, bare: 0 };
const unmatched = new Set();
const compound = []; // rgba/gradient/shadow arbitrary -> manual

for (const rel of files) {
  const fp = path.join(root, rel);
  let src = fs.readFileSync(fp, "utf8");
  let usedTk = false;

  // 1. utility color arbitrary value: prefix-[#rgb|#rgba|#rrggbb|#rrggbbaa] (optional /opacity)
  src = src.replace(
    new RegExp(
      `\\b(bg|text|border|ring|from|via|to|fill|stroke|outline|divide|decoration|caret|accent)-\\[#(${HEX})\\](\\/\\d{1,3})?`,
      "g"
    ),
    (m, prefix, hex, op) => {
      const n = normHex(hex);
      if (!n) { unmatched.add(`${prefix}-#${hex}`); return m; }
      const tok = resolveUtil(prefix, n.base6);
      if (!tok) { unmatched.add(`${prefix}-${n.base6}`); return m; }
      stats.util++;
      const alpha = op || (n.alphaPct != null && n.alphaPct < 100 ? `/${n.alphaPct}` : "");
      return `${prefix}-${tok}${alpha}`;
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

  const bareTok = (hex) => {
    const n = normHex(hex);
    if (!n) return null;
    if (n.alphaPct != null && n.alphaPct < 100) return "ALPHA"; // tk 仅不透明 6 位，半透明裸值保留字面
    const r = resolveBare(n.base6);
    return r ? r.split(":")[1] : null;
  };
  // 4a. JSX attribute form: name="#hex" -> name={tk["token"]}
  src = src.replace(new RegExp(`([A-Za-z][\\w-]*)=(['"])#(${HEX})\\2`, "g"), (m, attr, q, hex) => {
    const t = bareTok(hex);
    if (!t || t === "ALPHA") { if (!t) unmatched.add(`bare #${hex}`); return m; }
    stats.bare++; usedTk = true;
    return `${attr}={tk[${JSON.stringify(t)}]}`;
  });
  // 4b. JS expression string literal: "#hex" / '#hex' -> tk["token"]
  src = src.replace(new RegExp(`(['"])#(${HEX})\\1`, "g"), (m, q, hex) => {
    const t = bareTok(hex);
    if (!t || t === "ALPHA") { if (!t) unmatched.add(`bare #${hex}`); return m; }
    stats.bare++; usedTk = true;
    return `tk[${JSON.stringify(t)}]`;
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
