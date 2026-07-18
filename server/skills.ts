import { z } from "zod";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Skill + personality installers for the Adaptive Media MCP.
 *
 * Two MCP tools are backed here:
 *
 *   - `install_mcp_skill` installs the "functional" agent skill
 *     (`adaptive-media-use`) that teaches a terminal agent (Claude Code,
 *     Codex, …) how to drive this MCP and how to feed the knowledge base.
 *
 *   - `install_personality` reads one audience persona's file-based knowledge
 *     bundle under `knowledge/persona_<id>/` and installs it as a personality
 *     document at the exact location the functional skill loads from
 *     (`<skill>/personalities/<id>.md`), so typing e.g. "get camille
 *     personnalité" pulls Camille's knowledge base and wires it into the app's
 *     functional skill.
 *
 * Both tools mirror `saveFeedItem`: they write real files to disk
 * (deduplicated, no caller-controlled path traversal) AND return a manifest of
 * `{ relativePath, content }` so an MCP client that cannot reach the server's
 * filesystem can install the same files itself.
 */

// Repo root is the parent of this `server/` directory.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const KNOWLEDGE_DIR =
  process.env.ADAPTIVE_MEDIA_KNOWLEDGE_DIR ?? join(ROOT, "knowledge");
const DEFAULT_SKILLS_DIR =
  process.env.ADAPTIVE_MEDIA_SKILLS_DIR ?? join(ROOT, ".agents", "skills");

/** Id of the functional skill that consumes installed personalities. */
export const FUNCTIONAL_SKILL_ID = "adaptive-media-use";
/** Sub-directory (under the functional skill) where personalities are loaded. */
const PERSONALITIES_DIR = "personalities";
const PERSONA_PREFIX = "persona_";

export class SkillError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SkillError";
  }
}

export interface InstalledFile {
  /** Path relative to the skills root, always POSIX-style. */
  relativePath: string;
  /** Absolute path written on the server. */
  path: string;
  content: string;
  bytes: number;
  /** True when the file already existed with identical content. */
  deduped: boolean;
}

export interface InstallResult {
  skillId: string;
  installedPath: string;
  files: InstalledFile[];
  /** Human-readable next step for the calling agent. */
  instructions: string;
}

// --- disk helpers ----------------------------------------------------------

/** Write `content` at `abs`, skipping the write when it is already identical. */
function writeDeduped(
  abs: string,
  relativePath: string,
  content: string,
): InstalledFile {
  mkdirSync(join(abs, ".."), { recursive: true });
  let deduped = false;
  if (existsSync(abs) && readFileSync(abs, "utf8") === content) {
    deduped = true;
  } else {
    writeFileSync(abs, content, "utf8");
  }
  return {
    relativePath,
    path: abs,
    content,
    bytes: Buffer.byteLength(content, "utf8"),
    deduped,
  };
}

// --- persona discovery -----------------------------------------------------

/** List installed persona ids, e.g. `["persona_alex", "persona_camille"]`. */
export function listPersonas(knowledgeDir: string = KNOWLEDGE_DIR): string[] {
  if (!existsSync(knowledgeDir)) return [];
  return readdirSync(knowledgeDir)
    .filter(
      (name) =>
        name.startsWith(PERSONA_PREFIX) &&
        statSync(join(knowledgeDir, name)).isDirectory(),
    )
    .sort();
}

/**
 * Resolve a loose, human-typed personality reference to a canonical persona
 * directory id. Accepts "camille", "Camille", "persona_camille", and noisy
 * phrasing like "get camille personnalité". Matching is done on the bare
 * persona name (the part after `persona_`) as a whole word.
 */
export function resolvePersonaId(
  input: string,
  knowledgeDir: string = KNOWLEDGE_DIR,
): string {
  const personas = listPersonas(knowledgeDir);
  if (personas.length === 0) {
    throw new SkillError(
      "no_personas",
      `No persona knowledge bundles found under ${knowledgeDir}.`,
    );
  }
  const normalized = input.toLowerCase();
  // Exact directory id match first (e.g. "persona_camille").
  const direct = personas.find((p) => p === normalized);
  if (direct) return direct;
  // Then match on the bare name as a standalone token.
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const matches = personas.filter((p) =>
    tokens.includes(p.slice(PERSONA_PREFIX.length)),
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new SkillError(
      "ambiguous_persona",
      `"${input}" matched multiple personalities: ${matches.join(", ")}. Be specific.`,
    );
  }
  const names = personas.map((p) => p.slice(PERSONA_PREFIX.length)).join(", ");
  throw new SkillError(
    "unknown_persona",
    `No personality matched "${input}". Known personalities: ${names}.`,
  );
}

/** Read a persona bundle's Markdown files in a stable order. */
function readPersonaKnowledge(
  personaId: string,
  knowledgeDir: string,
): { file: string; content: string }[] {
  const dir = join(knowledgeDir, personaId);
  if (!existsSync(dir)) {
    throw new SkillError("unknown_persona", `No knowledge bundle at ${dir}.`);
  }
  // profile first, then index, then the rest alphabetically.
  const rank = (name: string) =>
    name === "profile.md" ? 0 : name === "index.md" ? 1 : 2;
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return files.map((file) => ({
    file,
    content: readFileSync(join(dir, file), "utf8"),
  }));
}

// --- skill content ---------------------------------------------------------

/** SKILL.md for the functional "adaptive-media-use" skill. */
function functionalSkillMarkdown(): string {
  return `---
name: ${FUNCTIONAL_SKILL_ID}
description: Drive the Adaptive Media / Nextbound MCP server — discover creator Intents, generate deterministic personalized experiences, browse the OKF artifact feed — and feed its knowledge base. Use when the human asks to use Adaptive Media, Nextbound, install an audience personality, or feed the Adaptive Media knowledge base.
---

# Use the Adaptive Media MCP

Adaptive Media (a.k.a. Nextbound) turns one creator Intent into a personalized,
evolving experience while preserving the original message and attribution. This
skill is the functional layer: it tells you which MCP tools to call and how to
grow the knowledge base the tools read from.

Connect to the Streamable HTTP endpoint at \`/mcp\` (default
\`http://127.0.0.1:3000/mcp\`; health at \`/health\`). Every tool is
deterministic — no live model — so calls replay identically.

## Tools

Discovery & experiences:
- \`search_public_intents\` — search published public creator Intents.
- \`get_creator_profile\` — open a creator profile and their Intents.
- \`get_intent\` — open the original Intent before personalization.
- \`generate_experience\` — return the seeded personalized experience for an
  audience persona (Alex, Camille, Maya). Reads the installed **personality**
  (see below) as personalization texture.
- \`like_intent\`, \`follow_creator\`, \`save_experience\`, \`create_share_link\`
  — local demo state.

Knowledge feed (OKF):
- \`browse_artifact_feed\` — one cursor-paginated page of the unified feed
  (artifact, editorial, intent, okf). Pass \`nextCursor\` back as \`cursor\`.
- \`open_feed_item\` — open one item as a self-contained artifact (OKF sources
  include their ClickHouse schema).
- \`save_feed_item\` — write a feed item as a local Markdown document.

Install:
- \`install_mcp_skill\` — install this skill.
- \`install_personality\` — install an audience personality (below).

Nextbound experience engine: \`publish_intent\`, \`deliver_to_inbox\`,
\`resolve_okf_context\`, \`compile_experience\`, \`resolve_next_action\`,
\`match_tool\`, \`connect_artifact\`, \`get_experience_session\`,
\`pause_experience\`, \`resume_experience\`, \`stop_experience\`,
\`restart_experience\`, \`share_experience\`, plus the procedural runtime
(\`open_seed\`, \`execute_artifact_contract\`, \`process_interaction\`,
\`resolve_nextbounds\`, \`get_artifact_execution\`, \`get_session_trace\`,
\`replay_session\`).

## Personalities

An audience **personality** is one persona's knowledge bundle installed at the
exact place this skill reads from:

\`\`\`text
${FUNCTIONAL_SKILL_ID}/${PERSONALITIES_DIR}/<persona>.md
\`\`\`

To install one, call \`install_personality\` with the persona name — e.g. the
human types **"get camille personnalité"**, you call
\`install_personality { "personality": "camille" }\`. The tool pulls
\`knowledge/persona_camille/\` from the server's knowledge base and writes
\`${PERSONALITIES_DIR}/camille.md\` here. When personalizing for that persona
(\`generate_experience\`), load \`${PERSONALITIES_DIR}/<persona>.md\` and honor
its personalization notes.

Installed personalities are additive — installing one never overwrites another.

## Feed the knowledge base

Two knowledge bases back this MCP:

1. **Persona knowledge (files)** under \`knowledge/persona_<id>/\`. Add a new
   audience persona by creating that folder with a \`profile.md\` (front-matter
   \`type: Persona Profile\`, a profile table, and personalization notes),
   an \`index.md\`, and any narrative texture files. The source of record for
   the structured fields is \`server/data/seed.ts\` (\`audiencePersonas\`).
   Once the folder exists, \`install_personality\` can install it.

2. **OKF feed knowledge (in-code)** in \`server/artifact-feed.ts\`. Add an
   entry to the \`seeds\` array (family \`artifact | editorial | intent | okf\`);
   an \`okf\` \`source\` may carry a ClickHouse table schema
   (name + type + semantic description per field). New seeds surface through
   \`browse_artifact_feed\` / \`open_feed_item\` automatically.

Keep everything deterministic: no clocks, no randomness, so pages and
experiences stay reproducible.
`;
}

/** Personality document composed from a persona's knowledge bundle. */
function personalityMarkdown(
  personaId: string,
  bundle: { file: string; content: string }[],
): string {
  const name = personaId.slice(PERSONA_PREFIX.length);
  const header = `---
name: ${FUNCTIONAL_SKILL_ID}-personality-${name}
persona_id: ${personaId}
description: Adaptive Media audience personality "${name}", installed from the persona knowledge bundle so the ${FUNCTIONAL_SKILL_ID} skill can personalize experiences for this persona.
---

# Personality — ${name}

Installed from \`knowledge/${personaId}/\`. This is the knowledge the
\`${FUNCTIONAL_SKILL_ID}\` skill loads when personalizing for \`${personaId}\`
(e.g. via \`generate_experience\`). Honor the personalization notes below.
`;
  const sections = bundle.map(({ file, content }) => {
    const trimmed = content.trim();
    return `\n<!-- source: knowledge/${personaId}/${file} -->\n\n${trimmed}\n`;
  });
  return `${header}${sections.join("\n---\n")}`;
}

// --- public schemas & installers -------------------------------------------

export const InstallMcpSkillInput = z.object({}).strict();
export type InstallMcpSkillArgs = z.infer<typeof InstallMcpSkillInput>;

export const InstallPersonalityInput = z
  .object({
    personality: z
      .string()
      .min(1)
      .max(120)
      .describe(
        'Personality / persona to install, e.g. "camille" or "persona_camille". Loose phrasing like "get camille personnalité" is accepted.',
      ),
  })
  .strict();
export type InstallPersonalityArgs = z.infer<typeof InstallPersonalityInput>;

/** Install the functional `adaptive-media-use` skill. */
export function installMcpSkill(
  _args: InstallMcpSkillArgs = {},
  skillsDir: string = DEFAULT_SKILLS_DIR,
): InstallResult {
  const relativePath = `${FUNCTIONAL_SKILL_ID}/SKILL.md`;
  const abs = join(skillsDir, FUNCTIONAL_SKILL_ID, "SKILL.md");
  const file = writeDeduped(abs, relativePath, functionalSkillMarkdown());
  return {
    skillId: FUNCTIONAL_SKILL_ID,
    installedPath: join(skillsDir, FUNCTIONAL_SKILL_ID),
    files: [file],
    instructions:
      `Installed the "${FUNCTIONAL_SKILL_ID}" skill at ${relativePath}. ` +
      "If your agent cannot read the server filesystem, write each file in " +
      "`files` (relativePath + content) under your local skills directory. " +
      'Then install personalities with `install_personality`, e.g. "get camille personnalité".',
  };
}

/** Install one audience personality into the functional skill's load path. */
export function installPersonality(
  args: InstallPersonalityArgs,
  opts: { skillsDir?: string; knowledgeDir?: string } = {},
): InstallResult & { personaId: string } {
  const knowledgeDir = opts.knowledgeDir ?? KNOWLEDGE_DIR;
  const skillsDir = opts.skillsDir ?? DEFAULT_SKILLS_DIR;
  const personaId = resolvePersonaId(args.personality, knowledgeDir);
  const name = personaId.slice(PERSONA_PREFIX.length);
  const bundle = readPersonaKnowledge(personaId, knowledgeDir);
  const content = personalityMarkdown(personaId, bundle);
  const relativePath = `${FUNCTIONAL_SKILL_ID}/${PERSONALITIES_DIR}/${name}.md`;
  const abs = join(
    skillsDir,
    FUNCTIONAL_SKILL_ID,
    PERSONALITIES_DIR,
    `${name}.md`,
  );
  const file = writeDeduped(abs, relativePath, content);
  return {
    personaId,
    skillId: FUNCTIONAL_SKILL_ID,
    installedPath: join(skillsDir, FUNCTIONAL_SKILL_ID, PERSONALITIES_DIR),
    files: [file],
    instructions:
      `Installed the "${name}" personality from knowledge/${personaId}/ at ` +
      `${relativePath}. The ${FUNCTIONAL_SKILL_ID} skill loads it when ` +
      `personalizing for ${personaId}. If your agent cannot read the server ` +
      "filesystem, write each file in `files` (relativePath + content) under " +
      "your local skills directory.",
  };
}

/** Exposed for tests. */
export const __skillInternals = {
  functionalSkillMarkdown,
  personalityMarkdown,
  readPersonaKnowledge,
  DEFAULT_SKILLS_DIR,
  KNOWLEDGE_DIR,
};
