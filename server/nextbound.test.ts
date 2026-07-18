import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseIntentDsl } from "../nextbound/dsl.js";
import {
  compileExperience,
  pauseExperience,
  resolveNextAction,
} from "../nextbound/engine.js";
import { intentDsl, luna, profiles } from "../nextbound/fixtures.js";
import { LocalToolAdapter } from "../nextbound/adapter.js";

describe("Nextbound local experience engine", () => {
  it("parses the declarative DSL and rejects executable markup", () => {
    assert.equal(parseIntentDsl(intentDsl, luna).id, "afterlight");
    assert.throws(
      () =>
        parseIntentDsl(
          intentDsl.replace(
            "</nextbound-intent>",
            "<script>alert(1)</script></nextbound-intent>",
          ),
          luna,
        ),
      /Unsafe/,
    );
  });
  it("compiles three distinct expected experiences without mutating OKF", () => {
    const original = structuredClone(profiles);
    const c = profiles.map((p) => compileExperience(luna, p));
    assert.deepEqual(profiles, original);
    assert.deepEqual(
      c.map((x) => x.personalizedTitle),
      [
        "AFTERLIGHT: Build the Memory Machine",
        "AFTERLIGHT: A Private Memory Salon in Paris",
        "AFTERLIGHT: Turn One Memory Into a Visual World",
      ],
    );
    assert.equal(new Set(c.map((x) => x.visualTheme.key)).size, 3);
    c.forEach((x) =>
      assert.equal(x.immutableMessage.text, luna.immutableMessage.text),
    );
  });
  it("completes Maya’s deterministic collaborative path with persistent attribution", () => {
    let s = compileExperience(luna, profiles[2]).session;
    const choose = (id: string) => {
      const a = s.nodes.at(-1)!.actions.find((x) => x.id === id)!;
      s = resolveNextAction(s, a);
    };
    choose("create-visual");
    assert.match(s.nodes.at(-1)!.summary, /Visual Artifact Builder/);
    assert.deepEqual(
      s.contributors.map((x) => x.contributorName),
      ["Luna Vale", "Maya"],
    );
    choose("add-soundtrack");
    assert.equal(s.nodes.at(-1)!.artifact?.creatorName, "Elias North");
    choose("short-film");
    assert.match(
      s.nodes.at(-1)!.modules.at(-1)!.body,
      /Luna.*Maya.*Elias.*Cinematic/,
    );
    assert.deepEqual(
      s.contributors.map((x) => x.contributorName),
      ["Luna Vale", "Maya", "Elias North", "Cinematic Artifact Composer"],
    );
    assert.deepEqual(s.actionHistory, [
      "create-visual",
      "add-soundtrack",
      "short-film",
    ]);
  });
  it("pause and stop prevent progression", () => {
    const base = compileExperience(luna, profiles[2]).session;
    const paused = pauseExperience(base);
    assert.throws(
      () => resolveNextAction(paused, base.nodes[0].actions[0]),
      /paused/,
    );
    const stopped = resolveNextAction(base, {
      id: "stop",
      label: "Stop here",
      description: "",
      requiredCapability: "stop",
      destinationType: "artifact",
      sourceArtifactId: "afterlight",
    });
    assert.equal(stopped.status, "completed");
    assert.throws(
      () => resolveNextAction(stopped, base.nodes[0].actions[0]),
      /completed/,
    );
  });
  it("exposes future MCP-shaped local calls", async () => {
    const a = new LocalToolAdapter();
    const { experience } = await a.call("compile_experience", {
      profileId: "maya",
    });
    const r = await a.call("resolve_next_action", {
      sessionId: experience.session.id,
      actionId: "create-visual",
    });
    assert.match(
      r.session.currentNodeId,
      /^maya-visual-visual-lab-execution-1-/,
    );
    assert.doesNotMatch(JSON.stringify(a), /\/mcp/);
  });
});
