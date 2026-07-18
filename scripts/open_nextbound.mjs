#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const artifactPath = join(
  root,
  "web",
  "public",
  "nextbound-loop",
  "Nextbound Loop.dc.html",
);
const nextboundUrl =
  "https://nextbound-adaptive-media.netlify.app/nextbound.html?scenario=procedural-loop";

if (!existsSync(artifactPath)) {
  console.error(`Missing local artifact: ${artifactPath}`);
  process.exit(1);
}

const open = (target) => {
  const child = spawn("open", [target], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
};

open(artifactPath);
open(nextboundUrl);

console.log(`Opened local artifact: ${artifactPath}`);
console.log(`Opened Nextbound browser URL: ${nextboundUrl}`);
