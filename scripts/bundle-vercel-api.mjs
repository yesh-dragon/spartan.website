import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const targets = [
  path.join(repoRoot, "api", "_handler.cjs"),
  path.join(repoRoot, "client", "api", "_handler.cjs"),
  path.join(repoRoot, "server", "api", "_handler.cjs"),
];

await Promise.all(targets.map((outFile) => mkdir(path.dirname(outFile), { recursive: true })));

await build({
  entryPoints: [path.join(repoRoot, "server", "src", "serverless.ts")],
  outfile: targets[0],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  logLevel: "info",
});

await Promise.all(targets.slice(1).map((outFile) => copyFile(targets[0], outFile)));
