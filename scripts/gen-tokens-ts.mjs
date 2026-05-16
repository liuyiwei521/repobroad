import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const t = JSON.parse(fs.readFileSync(path.join(root, "scripts/tokens.json"), "utf8"));

let ts = `// 自动生成（scripts/gen-tokens-ts.mjs），勿手改。改 token 请改 scripts/tokens.json 后重跑。\n`;
ts += `// 用于 SVG 属性 / chartPalette / 内联样式等无法用 CSS var 的场景，保持运行时真实 hex（零视觉变化）。\n\n`;
ts += `export const tk = {\n`;
for (const fam of ["surface", "line", "ink"])
  for (const [name, def] of Object.entries(t[fam]))
    ts += `  ${JSON.stringify(name)}: ${JSON.stringify(def.value)},\n`;
ts += `} as const;\n\nexport type TokenName = keyof typeof tk;\n`;

fs.writeFileSync(path.join(root, "src/styles/tokens.gen.ts"), ts);
console.log("written src/styles/tokens.gen.ts");
