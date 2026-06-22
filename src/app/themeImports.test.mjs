import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexCssPath = path.resolve(__dirname, "../styles/index.css");

test("react dashboard keeps the TDX theme import without whiteboard override", () => {
  const indexCss = fs.readFileSync(indexCssPath, "utf8");

  assert.match(indexCss, /@import '\.\/tdx-react\.css';/);
  assert.doesNotMatch(indexCss, /react-whiteboard\.css/);
});
