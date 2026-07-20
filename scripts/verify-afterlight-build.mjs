import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const artifact = resolve("web/afterlight-dist/nextbound.html");

try {
  const html = await readFile(artifact, "utf8");
  if (!html.includes("Nextbound") || !html.includes("nextbound me")) {
    throw new Error("The file does not contain the expected Nextbound UI.");
  }
  console.log(`Verified MCP UI artifact: ${artifact}`);
} catch (error) {
  console.error(
    `Missing or invalid MCP UI artifact at ${artifact}. Run: npm run build:afterlight`,
  );
  if (error instanceof Error && error.message) console.error(error.message);
  process.exitCode = 1;
}
