#!/usr/bin/env node
/**
 * Stake Engine hosts games at /{game}/v{version}/.
 * SvelteKit adapter-static still emits root-absolute `/_app/...` URLs when
 * kit.paths.base is empty. Rewrite those to relative `./_app/...` so the
 * bundle loads on the operator CDN.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("build");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(html|js|css|json)$/.test(ent.name)) out.push(p);
  }
  return out;
}

if (!fs.existsSync(root)) {
  console.error("fix-stake-paths: build/ missing");
  process.exit(1);
}

let n = 0;
for (const file of walk(root)) {
  const orig = fs.readFileSync(file, "utf8");
  let s = orig;
  s = s.replaceAll('href="/_app/', 'href="./_app/');
  s = s.replaceAll('src="/_app/', 'src="./_app/');
  s = s.replaceAll('import("/_app/', 'import("./_app/');
  s = s.replaceAll('from "/_app/', 'from "./_app/');
  s = s.replaceAll('"/_app/', '"./_app/');
  s = s.replaceAll("'/_app/", "'./_app/");
  s = s.replaceAll("`/_app/", "`./_app/");
  s = s.replace(/base:\s*""/g, 'base: "."');
  s = s.replace(/"base":\s*""/g, '"base": "."');
  if (s !== orig) {
    fs.writeFileSync(file, s);
    n += 1;
  }
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (html.includes('"/_app/') || html.includes("import('/_app/")) {
  console.error("fix-stake-paths: absolute /_app/ still present in index.html");
  process.exit(1);
}
console.log(`fix-stake-paths: patched ${n} files`);
