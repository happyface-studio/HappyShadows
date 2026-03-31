import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const watch = process.argv.includes("--watch");

// 1. Build the plugin sandbox (no DOM, no JSX)
const pluginCtx = await esbuild.context({
  entryPoints: ["src/plugin.ts"],
  bundle: true,
  outfile: "dist/plugin.js",
  format: "iife",
  target: "es2022",
  platform: "browser",
});

// 2. Build the UI as a single JS bundle
const uiCtx = await esbuild.context({
  entryPoints: ["src/ui.tsx"],
  bundle: true,
  outfile: "dist/ui-bundle.js",
  format: "iife",
  target: "es2022",
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
});

async function build() {
  await pluginCtx.rebuild();
  await uiCtx.rebuild();

  // Inline the JS bundle into a single HTML file (Figma requirement)
  mkdirSync("dist", { recursive: true });
  const js = readFileSync("dist/ui-bundle.js", "utf-8");
  const html = `<!DOCTYPE html>
<html>
<head>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #1a1a1a; --surface: #242424; --surface-2: #2e2e2e;
  --border: #3a3a3a; --text: #e0e0e0; --text-dim: #888;
  --accent: #4a90ff; --radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  color: var(--text);
}
.figma-light {
  --bg: #ffffff; --surface: #f7f7f7; --surface-2: #f0f0f0;
  --border: rgba(0,0,0,0.08); --text: #1a1a1a; --text-dim: #888;
}
body { background: var(--bg); overflow: hidden; }
@keyframes checkDraw { from { stroke-dashoffset: 12; } to { stroke-dashoffset: 0; } }
@keyframes checkPop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;
  writeFileSync("dist/ui.html", html);
  console.log("Built dist/plugin.js + dist/ui.html");
}

await build();

if (watch) {
  console.log("Watching for changes...");
  // esbuild watch mode will rebuild on changes
  pluginCtx.watch();
  uiCtx.watch();
} else {
  pluginCtx.dispose();
  uiCtx.dispose();
}
