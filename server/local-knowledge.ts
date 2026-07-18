import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";

export type LocalKnowledgeProfile = {
  id: string;
  name: string;
  role: string;
  summary: string;
  knowledge: string[];
  preferences: string[];
  sourceFiles: string[];
};

const knowledgeRoot = new URL("../knowledge/", import.meta.url);

const field = (text: string, key: string) =>
  text.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, "m"))?.[1]?.trim();

const listBlock = (text: string, key: string) => {
  const match = text.match(new RegExp(`^${key}:\\n((?:\\s+- .+\\n?)+)`, "m"));
  return (
    match?.[1]
      .split("\n")
      .map((line) => line.trim().replace(/^- "?|"?$/g, ""))
      .filter(Boolean) ?? []
  );
};

const markdownTableValue = (text: string, key: string) =>
  text.match(new RegExp(`\\|\\s*${key}\\s*\\|\\s*([^|]+)\\|`, "i"))?.[1]
    ?.replace(/`/g, "")
    .trim();

const splitList = (value?: string) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const fromOkf = (filename: string, text: string): LocalKnowledgeProfile => ({
  id: field(text, "id") ?? basename(filename, ".okf"),
  name: field(text, "name") ?? basename(filename, ".okf"),
  role: field(text, "role") ?? "Local knowledge profile",
  summary: field(text, "summary") ?? "",
  knowledge: [
    ...listBlock(text, "focus"),
    ...listBlock(text, "style"),
    ...listBlock(text, "preferred_formats"),
    ...listBlock(text, "emphasize"),
  ],
  preferences: [
    ...listBlock(text, "personality_traits"),
    ...listBlock(text, "tone"),
    ...listBlock(text, "palette"),
  ],
  sourceFiles: [`knowledge/${filename}`],
});

const fromPersonaFolder = (
  folder: string,
  text: string,
): LocalKnowledgeProfile => ({
  id: markdownTableValue(text, "Persona ID") ?? folder,
  name: markdownTableValue(text, "Name") ?? folder.replace(/^persona_/, ""),
  role:
    markdownTableValue(text, "Label") ??
    markdownTableValue(text, "Occupation") ??
    "Local knowledge profile",
  summary: markdownTableValue(text, "Primary motivation") ?? "",
  knowledge: splitList(markdownTableValue(text, "Interests")),
  preferences: splitList(markdownTableValue(text, "Preferred format")),
  sourceFiles: [`knowledge/${folder}/profile.md`],
});

export function listLocalKnowledgeProfiles(): LocalKnowledgeProfile[] {
  const root = fileURLToPath(knowledgeRoot);
  const direct = readdirSync(root)
    .filter((file) => file.endsWith(".okf"))
    .map((file) => fromOkf(file, readFileSync(join(root, file), "utf8")));
  const folders = readdirSync(root)
    .filter((entry) => {
      const path = join(root, entry);
      return entry.startsWith("persona_") && statSync(path).isDirectory();
    })
    .map((folder) =>
      fromPersonaFolder(
        folder,
        readFileSync(join(root, folder, "profile.md"), "utf8"),
      ),
    );
  const byId = new Map<string, LocalKnowledgeProfile>();
  for (const profile of [...direct, ...folders]) {
    const normalizedId = profile.id.replace(/^persona_/, "");
    byId.set(normalizedId, { ...profile, id: normalizedId });
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function getLocalKnowledgeProfile(profileId: string) {
  return listLocalKnowledgeProfiles().find(
    (profile) => profile.id === profileId.replace(/^persona_/, ""),
  );
}
