// Adaptive Media — artifact template parser and hydrator.
//
// An artifact template is ordinary HTML enriched with two XML tags plus an
// inline reference placeholder:
//
//   <mcp id="exp" tool="generate_experience"
//        args='{"intentId":"intent_luna_main_character","personaId":"maya"}'
//        select="experience" />
//
//        Declares an MCP call. Its result (optionally narrowed by `select`)
//        is bound under the reference namespace `id`. The tag renders to
//        nothing; it only produces a call to run.
//
//   <intent ref="exp.personalizedTitle">fallback</intent>   (reference mode)
//   <intent>the personalized scene title for Maya</intent>  (free mode)
//
//        A hole the chat fills. In reference mode the path is declared. In
//        free mode the chat interprets the natural-language intention and
//        maps it to a reference path before hydration.
//
//   {{ref:exp.structuredOutcome.steps[0].title}}
//
//        An inline placeholder resolved from a bound MCP result.
//
// The pipeline is intentionally split so the MCP calls happen through the
// chat/agent, not inside this library:
//
//   parseArtifactTemplate(source) -> planMcpCalls(parsed) -> [agent runs them]
//   -> hydrateArtifact(parsed, { results, intentResolutions }) -> final HTML

export interface McpDirective {
  /** Reference namespace the result is bound to. */
  id: string;
  /** MCP tool to invoke. */
  tool: string;
  /** Parsed arguments object passed to the tool. */
  args: Record<string, unknown>;
  /** Optional path narrowing the stored value to a slice of the output. */
  select?: string;
  /** The original tag text, for diagnostics. */
  raw: string;
}

export type IntentMode = "reference" | "free";

export interface IntentTag {
  /** Stable id (declared `name`, or auto-assigned `intent-N`). */
  intentId: string;
  mode: IntentMode;
  /** Declared reference path (reference mode only). */
  ref?: string;
  /** Natural-language intention (free mode only). */
  instruction?: string;
  /** Optional fallback used when the reference cannot be resolved. */
  fallback?: string;
  raw: string;
}

export interface RefPlaceholder {
  /** Reference path inside the `{{ref:...}}` token. */
  path: string;
  raw: string;
}

export interface ParsedTemplate {
  /**
   * Normalized HTML: `<mcp>` tags removed, `<intent>` tags replaced by a
   * stable `{{intent:ID}}` token, `{{ref:...}}` left intact.
   */
  html: string;
  mcp: McpDirective[];
  intents: IntentTag[];
  placeholders: RefPlaceholder[];
}

export interface McpCall {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  select?: string;
}

export interface HydrateInput {
  /** Raw tool outputs keyed by directive id. `select` is applied here. */
  results?: Record<string, unknown>;
  /** Maps a free intent id to the reference path the chat chose for it. */
  intentResolutions?: Record<string, string>;
  /** Insert resolved values without HTML-escaping. Default false. */
  raw?: boolean;
}

export interface Unresolved {
  kind: "intent" | "ref";
  id: string;
  path?: string;
  reason: "missing-resolution" | "path-not-found";
}

export interface HydrateResult {
  html: string;
  unresolved: Unresolved[];
}

// Closing tags tolerate whitespace before `>` (e.g. prettier-formatted HTML).
const MCP_TAG = /<mcp\b([^>]*?)\/?>(?:([\s\S]*?)<\/mcp\s*>)?/gi;
const INTENT_TAG = /<intent\b([^>]*?)(?:\/>|>([\s\S]*?)<\/intent\s*>)/gi;
const REF_TOKEN = /\{\{\s*ref:\s*([^}]+?)\s*\}\}/g;
const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let m: RegExpExecArray | null;
  ATTR.lastIndex = 0;
  while ((m = ATTR.exec(source)) !== null) {
    attrs[m[1]] = m[3] !== undefined ? m[3] : (m[4] ?? "");
  }
  return attrs;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Parse a template into its normalized HTML plus the directives, intents, and
 * inline placeholders it declares. Pure and deterministic; no MCP calls.
 */
export function parseArtifactTemplate(source: string): ParsedTemplate {
  const mcp: McpDirective[] = [];
  const intents: IntentTag[] = [];

  // Mask HTML comments so tags/placeholders mentioned inside them (e.g. a
  // "<mcp> calls" note) are not parsed as real directives. Restored at the end.
  const comments: string[] = [];
  let html = source.replace(/<!--[\s\S]*?-->/g, (comment) => {
    comments.push(comment);
    return ` __AM_COMMENT_${comments.length - 1}__ `;
  });

  html = html.replace(MCP_TAG, (raw, attrText: string) => {
    const attrs = parseAttributes(attrText);
    const id = attrs.id?.trim();
    const tool = attrs.tool?.trim();
    if (!id || !tool) {
      throw new Error(`<mcp> tag requires "id" and "tool": ${raw.trim()}`);
    }
    let args: Record<string, unknown> = {};
    if (attrs.args !== undefined && attrs.args.trim() !== "") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(decodeEntities(attrs.args));
      } catch {
        throw new Error(`<mcp id="${id}"> has invalid JSON in "args".`);
      }
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error(`<mcp id="${id}"> "args" must be a JSON object.`);
      }
      args = parsed as Record<string, unknown>;
    }
    const directive: McpDirective = { id, tool, args, raw: raw.trim() };
    const select = attrs.select?.trim();
    if (select) directive.select = select;
    mcp.push(directive);
    return "";
  });

  let autoIntent = 0;
  html = html.replace(
    INTENT_TAG,
    (raw, attrText: string, inner: string | undefined) => {
      const attrs = parseAttributes(attrText);
      const ref = attrs.ref?.trim();
      const declaredName = attrs.name?.trim();
      const body = (inner ?? "").trim();
      const intentId = declaredName || `intent-${++autoIntent}`;
      const tag: IntentTag = ref
        ? { intentId, mode: "reference", ref, raw: raw.trim() }
        : { intentId, mode: "free", instruction: body, raw: raw.trim() };
      if (ref && body) tag.fallback = body;
      intents.push(tag);
      return `{{intent:${intentId}}}`;
    },
  );

  const placeholders: RefPlaceholder[] = [];
  let pm: RegExpExecArray | null;
  REF_TOKEN.lastIndex = 0;
  while ((pm = REF_TOKEN.exec(html)) !== null) {
    placeholders.push({ path: pm[1].trim(), raw: pm[0] });
  }

  // Restore the masked comments now that tag/placeholder parsing is done.
  html = html.replace(
    / __AM_COMMENT_(\d+)__ /g,
    (_m, i: string) => comments[Number(i)],
  );

  return { html, mcp, intents, placeholders };
}

/** The MCP calls the agent must run before hydration. */
export function planMcpCalls(parsed: ParsedTemplate): McpCall[] {
  return parsed.mcp.map(({ id, tool, args, select }) => {
    const call: McpCall = { id, tool, args };
    if (select) call.select = select;
    return call;
  });
}

/** Resolve a dotted path with `[n]` array indexing against a value. */
export function resolveReference(root: unknown, path: string): unknown {
  const tokens = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  let current: unknown = root;
  for (const token of tokens) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(token);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[token];
    } else {
      return undefined;
    }
  }
  return current;
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

/**
 * Apply `select` narrowing to each raw tool output, producing the reference
 * namespace hydration reads from.
 */
function collectResults(
  parsed: ParsedTemplate,
  results: Record<string, unknown>,
): Record<string, unknown> {
  const bound: Record<string, unknown> = { ...results };
  for (const directive of parsed.mcp) {
    if (!directive.select || !(directive.id in results)) continue;
    bound[directive.id] = resolveReference(
      results[directive.id],
      directive.select,
    );
  }
  return bound;
}

/**
 * Produce the final artifact HTML by resolving every intent and inline
 * reference against the collected MCP results. Unresolved holes are reported
 * and rendered as their fallback (intents) or empty string (references).
 */
export function hydrateArtifact(
  parsed: ParsedTemplate,
  input: HydrateInput = {},
): HydrateResult {
  const results = collectResults(parsed, input.results ?? {});
  const intentResolutions = input.intentResolutions ?? {};
  const unresolved: Unresolved[] = [];
  const format = (value: string) => (input.raw ? value : escapeHtml(value));

  let html = parsed.html;

  for (const intent of parsed.intents) {
    const token = `{{intent:${intent.intentId}}}`;
    let path: string | undefined;
    if (intent.mode === "reference") {
      path = intent.ref;
    } else {
      path = intentResolutions[intent.intentId];
      if (!path) {
        unresolved.push({
          kind: "intent",
          id: intent.intentId,
          reason: "missing-resolution",
        });
        html = html.split(token).join(format(intent.fallback ?? ""));
        continue;
      }
    }
    const value = resolveReference(results, path!);
    if (value === undefined) {
      unresolved.push({
        kind: "intent",
        id: intent.intentId,
        path,
        reason: "path-not-found",
      });
      html = html.split(token).join(format(intent.fallback ?? ""));
      continue;
    }
    html = html.split(token).join(format(stringify(value)));
  }

  html = html.replace(REF_TOKEN, (_raw, rawPath: string) => {
    const path = rawPath.trim();
    const value = resolveReference(results, path);
    if (value === undefined) {
      unresolved.push({
        kind: "ref",
        id: path,
        path,
        reason: "path-not-found",
      });
      return "";
    }
    return format(stringify(value));
  });

  return { html, unresolved };
}
