import type { NextboundIntent } from "./types.js";

const allowed = new Set([
  "nextbound-intent",
  "sender",
  "immutable-message",
  "context-source",
  "adapt",
  "experience",
  "actions",
  "action",
]);
export function parseIntentDsl(
  source: string,
  template: NextboundIntent,
): NextboundIntent {
  if (
    /<\s*(script|iframe|object|embed|style)\b/i.test(source) ||
    /\son\w+\s*=|javascript:/i.test(source)
  )
    throw new Error("Unsafe markup is not permitted in an Intent");
  const tags = [...source.matchAll(/<\/?\s*([a-z-]+)/gi)].map((m) =>
    m[1].toLowerCase(),
  );
  if (!tags.length || tags.some((tag) => !allowed.has(tag)))
    throw new Error("Intent contains an unsupported element");
  const id = source.match(/<nextbound-intent\s+id="([a-z0-9-]+)"/i)?.[1];
  const message = source
    .match(/<immutable-message>([\s\S]*?)<\/immutable-message>/i)?.[1]
    .trim();
  const sender = source.match(/<sender\s+ref="([a-z0-9-]+)"\s*\/?\s*>/i)?.[1];
  if (!id || !message || sender !== template.sender.id)
    throw new Error("Intent DSL is incomplete");
  return structuredClone({
    ...template,
    id,
    immutableMessage: { text: message, locked: true },
  });
}
