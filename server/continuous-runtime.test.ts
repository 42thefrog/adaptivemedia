import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ContinuousProceduralRuntime,
  applyFramePlacement,
  composeRecipientContext,
  continuousContracts,
  executeArtifactContract,
  loopSeeds,
  pathFingerprint,
  runtimeOkf,
  validateArtifactExecution,
  type ArtifactExecution,
  type ExperienceSession,
  type Frame,
  type InteractionEvent,
  type SemanticObservation,
} from "../nextbound/runtime.js";

const interact = (
  runtime: ContinuousProceduralRuntime,
  sessionId: string,
  actionType:
    | "nextbound_opened"
    | "opportunity_claimed"
    | "navigation_returned"
    | "word_activated",
  nextboundId?: string,
  topic?: string,
) =>
  runtime.processInteraction(sessionId, {
    actionType,
    nextboundId,
    metadata: { topic: topic ?? nextboundId ?? actionType },
  });

const runFullLoop = (runtime = new ContinuousProceduralRuntime()) => {
  const opened = runtime.openSeed("seed-afterlight-maya", "maya");
  const sessionId = opened.session.id;
  const technical = interact(
    runtime,
    sessionId,
    "nextbound_opened",
    "open-technical-prototype",
    "prototype",
  );
  const snake = interact(
    runtime,
    sessionId,
    "nextbound_opened",
    "open-multiplayer-snake",
    "multiplayer",
  );
  const collaborative = interact(
    runtime,
    sessionId,
    "opportunity_claimed",
    "claim-multiplayer-slot",
    "collaborative",
  );
  const returned = interact(
    runtime,
    sessionId,
    "navigation_returned",
    "return-visual-lab-runtime",
    "collective visual",
  );
  return {
    runtime,
    opened,
    technical,
    snake,
    collaborative,
    returned,
    sessionId,
  };
};

describe("Step 8 continuous procedural media runtime", () => {
  it("delivers a Campaign Seed without personalization and starts on open", () => {
    const runtime = new ContinuousProceduralRuntime();
    const campaign = runtime.getCampaign();
    const seed = runtime.getSeed("seed-afterlight-maya");
    assert.equal(campaign.initialContractId, seed.contractId);
    assert.equal("execution" in seed, false);
    assert.equal(seed.openedAt, undefined);
    const opened = runtime.openSeed(seed.id, "maya");
    assert.equal(opened.execution.contractId, seed.contractId);
    assert.ok(opened.seed.openedAt);
    assert.equal(
      loopSeeds.filter((item) => item.recipientId === "maya").length,
      1,
    );
  });

  it("keeps ArtifactContract free of recipient-rendered state", () => {
    for (const contract of Object.values(continuousContracts)) {
      const serialized = JSON.stringify(contract);
      assert.doesNotMatch(
        serialized,
        /recipientId|executionId|visitId|pathFingerprint/,
      );
      assert.ok(contract.invariants.creatorIntent);
    }
  });

  it("implements shared_content with locked text and personalized presentation", () => {
    const runtime = new ContinuousProceduralRuntime();
    const maya = runtime.openSeed("seed-afterlight-maya", "maya").execution;
    const camille = runtime.openSeed(
      "seed-afterlight-camille",
      "camille",
    ).execution;
    assert.deepEqual(maya.generatedContent, camille.generatedContent);
    assert.notDeepEqual(
      maya.resolvedPresentation,
      camille.resolvedPresentation,
    );
    assert.notDeepEqual(maya.activatedAnchors, camille.activatedAnchors);
  });

  it("implements shared_form with equivalent structure and personal content", () => {
    const runtime = new ContinuousProceduralRuntime();
    const mayaOpen = runtime.openSeed("seed-afterlight-maya", "maya");
    const maya = runtime.processInteraction(mayaOpen.session.id, {
      actionType: "nextbound_opened",
      targetId: "technical-prototype",
      metadata: { topic: "prototype" },
    }).execution;
    const camilleOpen = runtime.openSeed("seed-afterlight-camille", "camille");
    const camille = runtime.processInteraction(camilleOpen.session.id, {
      actionType: "nextbound_opened",
      targetId: "technical-prototype",
      metadata: { topic: "composition" },
    }).execution;
    assert.deepEqual(
      maya.generatedContent.map((block) => block.slotId),
      camille.generatedContent.map((block) => block.slotId),
    );
    assert.notDeepEqual(maya.generatedContent, camille.generatedContent);
  });

  it("uses valid configurable 40/60 context weights", () => {
    const opened = new ContinuousProceduralRuntime().openSeed(
      "seed-afterlight-maya",
      "maya",
    );
    assert.deepEqual(opened.session.contextWeights, {
      knowledgeBase: 0.4,
      liveSession: 0.6,
    });
    assert.equal(
      opened.execution.contextTrace.okfContribution +
        opened.execution.contextTrace.sessionContribution,
      1,
    );
    assert.throws(
      () =>
        composeRecipientContext({
          okfContext: runtimeOkf.maya,
          semanticScratchpad: [],
          interactionLog: [],
          contextWeights: { knowledgeBase: 0.5, liveSession: 0.6 },
        }),
      /sum to 1/,
    );
  });

  it("preserves exact order and makes A→B→C differ from A→C→B", () => {
    const session = "session-order";
    const make = (topics: string[]): InteractionEvent[] =>
      topics.map((topic, index) => ({
        id: `e-${index}`,
        sessionId: session,
        sequenceNumber: index + 1,
        timestamp: `2026-07-17T12:00:0${index}.000Z`,
        contractId: "visual-lab",
        executionId: "execution-1",
        actionType: "word_activated",
        targetId: topic,
        metadata: { topic },
      }));
    assert.notEqual(
      pathFingerprint(make(["A", "B", "C"]), []),
      pathFingerprint(make(["A", "C", "B"]), []),
    );
  });

  it("weights explicit and recent behavior above passive and old behavior", () => {
    const observations: SemanticObservation[] = [
      {
        id: "old-passive",
        sourceEventIds: ["old"],
        interpretation: "passive",
        topics: ["solo"],
        inferredIntent: "observe",
        polarity: 1,
        confidence: 0.6,
        strength: 0.15,
        createdAt: "2026-07-17T12:00:00.000Z",
      },
      {
        id: "new-explicit",
        sourceEventIds: ["new"],
        interpretation: "explicit",
        topics: ["multiplayer"],
        inferredIntent: "participate",
        polarity: 1,
        confidence: 0.95,
        strength: 1,
        createdAt: "2026-07-17T12:00:01.000Z",
      },
    ];
    const composed = composeRecipientContext({
      okfContext: runtimeOkf.maya,
      semanticScratchpad: observations,
      interactionLog: [],
      contextWeights: { knowledgeBase: 0.4, liveSession: 0.6 },
    });
    assert.equal(composed.liveSignals[0].topic, "multiplayer");
    assert.ok(composed.liveSignals[0].score > composed.liveSignals[1].score);
  });

  it("updates scratchpad and Nextbounds without navigation", () => {
    const runtime = new ContinuousProceduralRuntime();
    const opened = runtime.openSeed("seed-afterlight-maya", "maya");
    const mutation = interact(
      runtime,
      opened.session.id,
      "word_activated",
      undefined,
      "collaborative",
    );
    assert.equal(mutation.execution.contractId, opened.execution.contractId);
    assert.equal(
      mutation.mutations.some((item) => item.type === "remove_nextbound"),
      true,
    );
    assert.equal(
      mutation.mutations.some((item) => item.type === "add_nextbound"),
      true,
    );
    assert.equal(
      mutation.session.semanticScratchpad.at(-1)!.topics[0],
      "collaborative",
    );
  });

  it("revisits the same contract with a new execution and changed resolution", () => {
    const { opened, returned } = runFullLoop();
    const first = opened.execution;
    const second = returned.execution;
    assert.equal(second.contractId, first.contractId);
    assert.equal(second.contractVersion, first.contractVersion);
    assert.notEqual(second.id, first.id);
    assert.notEqual(second.visitId, first.visitId);
    assert.equal(second.visitNumber, 2);
    assert.notEqual(second.pathFingerprint, first.pathFingerprint);
    assert.notDeepEqual(
      second.resolvedPresentation,
      first.resolvedPresentation,
    );
    assert.notDeepEqual(second.activatedAnchors, first.activatedAnchors);
    assert.notDeepEqual(second.resolvedNextbounds, first.resolvedNextbounds);
  });

  it("claims the final ephemeral slot and makes it unavailable elsewhere", () => {
    const runtime = new ContinuousProceduralRuntime();
    runFullLoop(runtime);
    const alex = runtime.openSeed("seed-afterlight-alex", "alex");
    interact(
      runtime,
      alex.session.id,
      "nextbound_opened",
      "open-technical-prototype",
    );
    const snake = interact(
      runtime,
      alex.session.id,
      "nextbound_opened",
      "open-multiplayer-snake",
    );
    assert.equal(snake.execution.opportunityStates[0].status, "claimed");
    assert.equal(
      snake.execution.resolvedNextbounds[0].availability.status,
      "unavailable",
    );
  });

  it("replays the event log into the same scratchpad, fingerprint and output", () => {
    const completed = runFullLoop();
    const trace = completed.runtime.getSessionTrace(completed.sessionId);
    const replayed = completed.runtime.replaySession(
      trace.session.seedId,
      trace.session.recipientId,
      trace.session.interactionLog,
    );
    assert.deepEqual(
      replayed.session.semanticScratchpad,
      trace.session.semanticScratchpad,
    );
    assert.equal(
      replayed.currentExecution.pathFingerprint,
      trace.currentExecution.pathFingerprint,
    );
    assert.deepEqual(
      replayed.currentExecution.resolvedNextbounds,
      trace.currentExecution.resolvedNextbounds,
    );
  });

  it("freezes on pause, rejects after stop and resets intelligence on restart", () => {
    const runtime = new ContinuousProceduralRuntime();
    const opened = runtime.openSeed("seed-afterlight-maya", "maya");
    runtime.pause(opened.session.id);
    assert.throws(
      () =>
        interact(
          runtime,
          opened.session.id,
          "word_activated",
          undefined,
          "build",
        ),
      /paused/,
    );
    runtime.resume(opened.session.id);
    interact(runtime, opened.session.id, "word_activated", undefined, "build");
    runtime.stop(opened.session.id);
    assert.throws(
      () =>
        interact(
          runtime,
          opened.session.id,
          "word_activated",
          undefined,
          "visual",
        ),
      /stopped/,
    );
    const restarted = runtime.restart(opened.session.id);
    assert.equal(restarted.session.interactionLog.length, 1);
    assert.equal(restarted.session.semanticScratchpad.length, 1);
    assert.equal(restarted.execution.visitNumber, 1);
  });

  it("rejects invalid executions and prohibited context scopes", () => {
    const runtime = new ContinuousProceduralRuntime();
    const opened = runtime.openSeed("seed-afterlight-maya", "maya");
    const invalid = structuredClone(opened.execution) as ArtifactExecution;
    invalid.generatedContent[0].text = "Changed locked content";
    assert.throws(
      () =>
        validateArtifactExecution(continuousContracts["visual-lab"], invalid),
      /locked_content_changed/,
    );
    const session = structuredClone(opened.session) as ExperienceSession;
    assert.throws(
      () =>
        executeArtifactContract({
          contract: continuousContracts["visual-lab"],
          okfContext: {
            recipientId: "maya",
            scopes: { ...runtimeOkf.maya.scopes, secret: ["forbidden"] },
          },
          sessionState: session,
          pathFingerprint: "path-test",
          opportunityState: {
            id: "o",
            availableSlots: 1,
            expiresAt: "2026-07-17T18:00:00.000Z",
            status: "available",
          },
        }),
      /Prohibited OKF scopes/,
    );
    assert.equal(
      opened.execution.generatedContent.some((block) =>
        /https?:\/\//.test(block.text),
      ),
      false,
    );
  });

  it("supports append, insert_after, focus, replace and navigate frame placement", () => {
    const frame = (id: string, placement: Frame["placement"]): Frame => ({
      id,
      schemaId: id,
      placement,
      blocks: [],
      highlighted: false,
    });
    let frames = applyFramePlacement([], frame("a", "append"));
    frames = applyFramePlacement(frames, frame("b", "insert_after"), "a");
    frames = applyFramePlacement(frames, frame("c", "replace"), "b");
    frames = applyFramePlacement(frames, {
      ...frame("c", "focus"),
      highlighted: true,
    });
    assert.deepEqual(
      frames.map((item) => item.id),
      ["a", "c"],
    );
    assert.equal(frames[1].highlighted, true);
    assert.deepEqual(
      applyFramePlacement(frames, frame("destination", "navigate")).map(
        (item) => item.id,
      ),
      ["destination"],
    );
  });
});
