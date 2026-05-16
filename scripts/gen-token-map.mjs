// 由 scripts/tokens.json 渲染映射 / 换肤文档。源码无关、幂等。
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const t = JSON.parse(fs.readFileSync(path.join(root, "scripts/tokens.json"), "utf8"));
const colorGroups = ["surface", "line", "ink"];

const nColor = colorGroups.reduce((n, g) => n + Object.keys(t[g]).length, 0);
const nHex = colorGroups.reduce(
  (n, g) => n + Object.values(t[g]).reduce((m, d) => m + 1 + d.aliases.length, 0),
  0
);

let md = `# 颜色 / 字号 / 圆角 Token 映射表\n\n`;
md += `> 自动生成（\`node scripts/gen-token-map.mjs\`），勿手改。改 token 请改 \`scripts/tokens.json\` 后重跑全部 gen-*。\n\n`;
md += `本表是「换肤指南」：改 **value 列** 即整体换主题。codemod 已按本表把任意值/裸 hex 替换为语义类名或 \`tk[...]\`。\n\n`;
md += `- 原始唯一色值：**${nHex}** 个 → 收敛为 **${nColor}** 个颜色 token（用户确认的「适度收敛 ~40」策略）\n`;
md += `- 合并原则：仅合并「同属性族 + 感知相近」的色；不同语义的同色按 \`属性+色值\` 分别归类。\n\n`;

const famTitle = {
  surface: "背景层 surface (bg / 渐变停 from·via·to)",
  line: "线条层 line (border / ring / outline)",
  ink: "文字·语义·图表色 ink (text / fill / stroke / chartPalette / 内联)",
};
const pfx = { surface: "bg-", line: "border-", ink: "text-" };
for (const g of colorGroups) {
  md += `## ${famTitle[g]}\n\n`;
  md += `| token | 类名前缀 | value | 说明 | 归并的原始色 |\n|---|---|---|---|---|\n`;
  for (const [name, def] of Object.entries(t[g])) {
    const merged = def.aliases.length ? def.aliases.map((h) => `\`${h}\``).join(" ") : "—";
    md += `| \`--color-${name}\` | \`${pfx[g]}${name}\` | \`${def.value}\` | ${def.desc} | ${merged} |\n`;
  }
  md += `\n`;
}

md += `## 字号 (text-)\n\n| token | 类名 | value | 说明 |\n|---|---|---|---|\n`;
for (const [n, d] of Object.entries(t.fontSize))
  md += `| \`--text-${n}\` | \`text-${n}\` | \`${d.value}\` | ${d.desc} |\n`;
md += `\n## 圆角 (rounded-)\n\n| token | 类名 | value | 说明 |\n|---|---|---|---|\n`;
for (const [n, d] of Object.entries(t.radius))
  md += `| \`--radius-${n}\` | \`rounded-${n}\` | \`${d.value}\` | ${d.desc} |\n`;

md += `\n---\n\n## 换肤指南\n\n`;
md += `**唯一改动入口：\`scripts/tokens.json\`**。改完执行：\n\n`;
md += "```bash\nnode scripts/gen-tokens-css.mjs   # -> src/styles/tokens.css   (Tailwind @theme，CSS 类用)\n";
md += "node scripts/gen-tokens-ts.mjs    # -> src/styles/tokens.gen.ts (SVG/图表/内联，运行时真实 hex)\n";
md += "node scripts/gen-token-map.mjs    # -> 本文档\n```\n\n";
md += `- 改某 token \`value\` → 该语义所有位置（CSS 类 + 图表 + SVG + 内联）整体换色。\n`;
md += `- 两套产物同源 \`tokens.json\`：CSS 类走 \`tokens.css\`；SVG 属性 (\`stroke\`/\`stopColor\`) 与 \`chartPalette\` 走 \`tokens.gen.ts\`（CSS \`var()\` 在 SVG 呈现属性中无效）。\n`;
md += `- Tailwind v4 按需裁剪：仅被用到的 token 类才会生成 \`--color-*\`；纯 \`tk[...]\` 引用的语义色（如 up/down/chart）不产出 CSS 变量，由 ts 模块保真，属预期。\n\n`;
md += `### 刻意未 token 化（视觉零回归 / 收益低）\n\n`;
md += `- 11 处 \`shadow-[… rgba() …]\` / \`linear-gradient(rgba())\` 网格底纹：半透明微弱叠加，保留字面值。\n`;
md += `- \`src/styles/tailwind.css\` 滚动条颜色：纯 CSS，不在 124 用色审计内。\n`;
md += `- 间距类任意值（\`w-[..]\`/\`gap-[..]\`）：一次性布局常量，非设计阶梯。\n`;
md += `- Tailwind 命名色类（\`text-emerald-400\`、\`text-slate-100\` 等）：本就是 Tailwind 调色板。\n`;

fs.writeFileSync(path.join(root, "docs/color-token-map.md"), md);
console.log(`written docs/color-token-map.md  (${nHex} hex -> ${nColor} color tokens)`);
