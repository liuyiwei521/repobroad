import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const t = JSON.parse(fs.readFileSync(path.join(root, "scripts/tokens.json"), "utf8"));

let css = `/* 自动生成（scripts/gen-tokens-css.mjs），勿手改。改 token 请改 scripts/tokens.json 后重跑。 */\n`;
css += `/* 这是「换肤」唯一入口：改下面 value 即整体换主题。 */\n\n@theme {\n`;

const block = (title, entries, prefix) => {
  let s = `  /* ${title} */\n`;
  for (const [name, def] of Object.entries(entries))
    s += `  --${prefix}-${name}: ${def.value}; /* ${def.desc} */\n`;
  return s + `\n`;
};

css += block("背景层 surface", t.surface, "color");
css += block("线条层 line", t.line, "color");
css += block("文字·语义·图表 ink", t.ink, "color");
css += block("字号 fontSize", t.fontSize, "text");
css += block("圆角 radius", t.radius, "radius");
css += `}\n`;

fs.writeFileSync(path.join(root, "src/styles/tokens.css"), css);
console.log("written src/styles/tokens.css");
