import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  installMcpSkill,
  installPersonality,
  resolvePersonaId,
  listPersonas,
  SkillError,
  FUNCTIONAL_SKILL_ID,
  InstallPersonalityInput,
} from "./skills.js";

/** Build a throwaway knowledge base with two personas. */
function fakeKnowledge(): string {
  const dir = mkdtempSync(join(tmpdir(), "am-knowledge-"));
  for (const name of ["camille", "alex"]) {
    const personaDir = join(dir, `persona_${name}`);
    mkdirSync(personaDir, { recursive: true });
    writeFileSync(
      join(personaDir, "profile.md"),
      `# ${name} profile\nBudget premium.\n`,
      "utf8",
    );
    writeFileSync(join(personaDir, "index.md"), `# ${name} index\n`, "utf8");
  }
  return dir;
}

test("install_mcp_skill writes SKILL.md and returns a manifest", () => {
  const skillsDir = mkdtempSync(join(tmpdir(), "am-skills-"));
  const res = installMcpSkill({}, skillsDir);
  assert.equal(res.skillId, FUNCTIONAL_SKILL_ID);
  assert.equal(res.files.length, 1);
  const file = res.files[0];
  assert.equal(file.relativePath, `${FUNCTIONAL_SKILL_ID}/SKILL.md`);
  assert.equal(file.deduped, false);
  assert.ok(file.bytes > 0);
  // File really landed on disk with the manifest content.
  assert.equal(readFileSync(file.path, "utf8"), file.content);
  assert.match(file.content, /name: adaptive-media-use/);
  assert.match(file.content, /install_personality/);
  assert.match(file.content, /Feed the knowledge base/);
});

test("install_mcp_skill is idempotent (dedup on identical content)", () => {
  const skillsDir = mkdtempSync(join(tmpdir(), "am-skills-"));
  installMcpSkill({}, skillsDir);
  const again = installMcpSkill({}, skillsDir);
  assert.equal(again.files[0].deduped, true);
});

test("resolvePersonaId accepts loose phrasing", () => {
  const knowledgeDir = fakeKnowledge();
  assert.equal(resolvePersonaId("camille", knowledgeDir), "persona_camille");
  assert.equal(resolvePersonaId("Camille", knowledgeDir), "persona_camille");
  assert.equal(
    resolvePersonaId("persona_camille", knowledgeDir),
    "persona_camille",
  );
  assert.equal(
    resolvePersonaId("get camille personnalité", knowledgeDir),
    "persona_camille",
  );
});

test("resolvePersonaId rejects unknown personas", () => {
  const knowledgeDir = fakeKnowledge();
  assert.throws(
    () => resolvePersonaId("nobody", knowledgeDir),
    (err: unknown) =>
      err instanceof SkillError && err.code === "unknown_persona",
  );
});

test("listPersonas discovers persona bundles", () => {
  const knowledgeDir = fakeKnowledge();
  assert.deepEqual(listPersonas(knowledgeDir), [
    "persona_alex",
    "persona_camille",
  ]);
});

test("install_personality installs into the functional skill's load path", () => {
  const knowledgeDir = fakeKnowledge();
  const skillsDir = mkdtempSync(join(tmpdir(), "am-skills-"));
  const res = installPersonality(
    { personality: "get camille personnalité" },
    { knowledgeDir, skillsDir },
  );
  assert.equal(res.personaId, "persona_camille");
  assert.equal(res.files.length, 1);
  const file = res.files[0];
  assert.equal(
    file.relativePath,
    `${FUNCTIONAL_SKILL_ID}/personalities/camille.md`,
  );
  assert.equal(readFileSync(file.path, "utf8"), file.content);
  // Persona knowledge is embedded and profile comes first.
  assert.match(file.content, /persona_id: persona_camille/);
  assert.match(file.content, /camille profile/);
  const profileIdx = file.content.indexOf("camille profile");
  const indexIdx = file.content.indexOf("camille index");
  assert.ok(profileIdx < indexIdx, "profile should precede index");
});

test("install_personality is additive and idempotent", () => {
  const knowledgeDir = fakeKnowledge();
  const skillsDir = mkdtempSync(join(tmpdir(), "am-skills-"));
  installPersonality({ personality: "camille" }, { knowledgeDir, skillsDir });
  const alex = installPersonality(
    { personality: "alex" },
    { knowledgeDir, skillsDir },
  );
  // Installing alex does not remove camille.
  assert.equal(alex.files[0].relativePath.endsWith("alex.md"), true);
  const again = installPersonality(
    { personality: "camille" },
    { knowledgeDir, skillsDir },
  );
  assert.equal(again.files[0].deduped, true);
});

test("InstallPersonalityInput rejects extra keys", () => {
  assert.equal(
    InstallPersonalityInput.safeParse({ personality: "camille" }).success,
    true,
  );
  assert.equal(InstallPersonalityInput.safeParse({ nope: 1 }).success, false);
});
