import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'src', 'dist');
const htmlPath = join(distDir, 'index.html');

let html = await readFile(htmlPath, 'utf8');

html = await inlineStyles(html);
html = await inlineScripts(html);

await writeFile(htmlPath, html, 'utf8');

async function inlineStyles(source) {
  const linkPattern = /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>\s*/g;
  return replaceAsync(source, linkPattern, async (_match, href) => {
    const css = await readFile(assetPath(href), 'utf8');
    return `<style>\n${css.replaceAll('</style', '<\\/style')}\n</style>\n`;
  });
}

async function inlineScripts(source) {
  const scriptPattern = /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>\s*/g;
  return replaceAsync(source, scriptPattern, async (_match, src) => {
    const js = await readFile(assetPath(src), 'utf8');
    return `<script>\n${js.replaceAll('</script', '<\\/script')}\n</script>\n`;
  });
}

function assetPath(pathname) {
  return join(distDir, pathname.replace(/^\.?\//, ''));
}

async function replaceAsync(source, pattern, replacer) {
  const replacements = [];
  source.replace(pattern, (...args) => {
    replacements.push(Promise.resolve(replacer(...args)));
    return '';
  });

  const resolved = await Promise.all(replacements);
  let index = 0;
  return source.replace(pattern, () => resolved[index++]);
}
