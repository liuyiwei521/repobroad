import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexCssPath = path.resolve(__dirname, "../styles/index.css");

test("react dashboard imports TDX theme chain with whiteboard override last", () => {
  const indexCss = fs.readFileSync(indexCssPath, "utf8");

  assert.match(indexCss, /@import '\.\/tdx-react\.css';/);
  assert.match(indexCss, /@import '\.\/react-whiteboard\.css';/);

  const reactPos = indexCss.indexOf("tdx-react.css");
  const wbPos = indexCss.indexOf("react-whiteboard.css");
  assert.ok(wbPos > reactPos, "whiteboard must load after tdx-react");
});
