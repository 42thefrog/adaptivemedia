import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  nextboundToolNames,
  proceduralToolNames,
  LocalToolAdapter,
} from "../nextbound/adapter.js";
import { NextboundService } from "../nextbound/service.js";
import { luna, profiles } from "../nextbound/fixtures.js";
import { proceduralSchemas, schemas } from "./nextbound-api.js";
import { MCPNextboundTransport } from "../web/src/nextbound-transport.js";

describe("Step 7 Nextbound MCP capability layer", () => {
  it("declares all 13 tools with strict schemas", () => {
    assert.equal(nextboundToolNames.length, 13);
    assert.deepEqual(Object.keys(schemas), [...nextboundToolNames]);
    assert.equal(
      schemas.publish_intent.safeParse({ intentId: "afterlight" }).success,
      true,
    );
    assert.equal(
      schemas.publish_intent.safeParse({ intentId: "afterlight", extra: true })
        .success,
      false,
    );
  });
  it("adds seven strict procedural operations without replacing Step 7", async () => {
    assert.equal(proceduralToolNames.length, 7);
    assert.deepEqual(Object.keys(proceduralSchemas), [...proceduralToolNames]);
    assert.equal(
      proceduralSchemas.process_interaction.safeParse({
        sessionId: "session-loop-maya",
        actionType: "word_activated",
        extra: true,
      }).success,
      false,
    );
    const local = new LocalToolAdapter();
    const opened = await local.call("open_seed", {
      seedId: "seed-afterlight-maya",
      recipientId: "maya",
    });
    const trace = await local.call("get_session_trace", {
      sessionId: opened.session.id,
    });
    assert.equal(opened.execution.contractId, "visual-lab");
    assert.equal(trace.session.contextWeights.liveSession, 0.6);
  });
  it("rejects unknown fixture IDs safely", () => {
    const s = new NextboundService();
    assert.throws(() => s.publishIntent("missing"), /not available/);
    assert.throws(() => s.deliverToInbox("afterlight", ["unknown"]), /profile/);
    assert.throws(() => s.getExperienceSession("missing"), /does not exist/);
  });
  it("preserves the immutable Intent and delivers it to every profile", () => {
    const s = new NextboundService();
    assert.equal(
      s.publishIntent("afterlight").intent.immutableMessage.text,
      luna.immutableMessage.text,
    );
    assert.deepEqual(
      s
        .deliverToInbox(
          "afterlight",
          profiles.map((p) => p.id),
        )
        .deliveries.map((d) => d.intentId),
      ["afterlight", "afterlight", "afterlight"],
    );
  });
  it("minimizes context and compiles three golden experiences", () => {
    const s = new NextboundService(),
      context = s.resolveOkfContext("afterlight", "maya");
    assert.equal("name" in context.normalizedContext, false);
    assert.equal("knowledge" in context.normalizedContext, false);
    assert.deepEqual(
      profiles.map(
        (p) =>
          s.compileExperience("afterlight", p.id).experience.personalizedTitle,
      ),
      [
        "AFTERLIGHT: Build the Memory Machine",
        "AFTERLIGHT: A Private Memory Salon in Paris",
        "AFTERLIGHT: Turn One Memory Into a Visual World",
      ],
    );
  });
  it("executes the golden Maya path with deterministic attribution", () => {
    const s = new NextboundService(),
      id = s.compileExperience("afterlight", "maya").session.id;
    let step = s.resolveNextAction(id, "create_visual_memory");
    assert.match(step.currentNode.summary, /Visual Artifact Builder/);
    assert.deepEqual(
      step.contributors.map((c) => c.contributorName),
      ["Luna Vale", "Maya"],
    );
    step = s.resolveNextAction(id, "add_soundtrack");
    assert.equal(step.currentNode.artifact?.creatorName, "Elias North");
    s.connectArtifact(
      id,
      "maya-visual-memory",
      "memory-soundscape",
      "add_soundtrack",
    );
    step = s.resolveNextAction(id, "turn_into_short_film");
    assert.equal(
      step.currentNode.artifact?.creatorName,
      "Cinematic Artifact Composer",
    );
    assert.deepEqual(
      step.contributors.map((c) => c.contributorName),
      ["Luna Vale", "Maya", "Elias North", "Cinematic Artifact Composer"],
    );
    const share = s.share(id);
    assert.equal(
      share.invitationAction.label,
      "Create what AFTERLIGHT becomes for you",
    );
    assert.equal(JSON.stringify(share).includes("preferences"), false);
  });
  it("supports pause, resume, stop, and clean restart", () => {
    const s = new NextboundService(),
      id = s.compileExperience("afterlight", "maya").session.id;
    s.pause(id);
    assert.throws(
      () => s.resolveNextAction(id, "create_visual_memory"),
      /paused/,
    );
    assert.equal(s.resume(id).session.status, "active");
    assert.equal(s.stop(id).session.status, "completed");
    const restarted = s.restart(id).session;
    assert.equal(restarted.status, "active");
    assert.deepEqual(restarted.actionHistory, []);
    assert.equal(restarted.contributors.length, 1);
  });
  it("keeps local output and normalizes MCP Apps results", async () => {
    const local = new LocalToolAdapter();
    assert.equal(
      (await local.call("publish_intent", { intentId: "afterlight" })).view,
      "publisher",
    );
    const transport = new MCPNextboundTransport({
      request: async () => ({
        result: { structuredContent: { view: "publisher", ok: true } },
      }),
    });
    assert.deepEqual(
      await transport.call("publish_intent", { intentId: "afterlight" }),
      { view: "publisher", ok: true },
    );
  });
});
