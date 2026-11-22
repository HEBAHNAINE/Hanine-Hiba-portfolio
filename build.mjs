import { mkdir, rm, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "script.js",
  "scene.js",
  "pipeline-scene.js",
  "CV-Hiba-Hnaine.pdf",
  "vendor/three.module.js",
  "vendor/three.core.js",
];

await rm(output, { recursive: true, force: true });

await Promise.all(
  files.map(async (file) => {
    const target = join(output, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(root, file), target);
  })
);

console.log(`Build terminé : ${files.length} fichiers copiés dans dist/`);
