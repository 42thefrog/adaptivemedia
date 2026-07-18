import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextboundService } from "../nextbound/service.js";
import {
  replayArtifactEvents,
  visualLabContract,
} from "../nextbound/procedural.js";

const runLoop = (withSound = true) => {
  const service = new NextboundService();
  const sessionId = service.compileExperience("afterlight", "maya").session.id;
  const first = service.resolveNextAction(sessionId, "create-visual");
  if (withSound) service.resolveNextAction(sessionId, "add-soundtrack");
  service.resolveNextAction(sessionId, "short-film");
  const returned = service.resolveNextAction(sessionId, "return-visual-lab");
  return { service, sessionId, first, returned };
};

describe("procedural ArtifactContract loop", () => {
  it("returns to the same stable contract with a new execution", () => {
    const { first, returned } = runLoop();
    const before = first.currentNode.execution!;
    const after = returned.currentNode.execution!;
    assert.equal(before.contractId, visualLabContract.contractId);
    assert.equal(after.contractId, before.contractId);
    assert.equal(after.contractVersion, before.contractVersion);
    assert.notEqual(after.executionId, before.executionId);
    assert.equal(after.visitNumber, 2);
    assert.notEqual(after.pathFingerprint, before.pathFingerprint);
    assert.notDeepEqual(after.content, before.content);
    assert.notDeepEqual(after.presentation, before.presentation);
    assert.notDeepEqual(after.anchors, before.anchors);
    assert.notDeepEqual(after.nextbounds, before.nextbounds);
  });

  it("produces different executions for different ordered paths", () => {
    const soundPath = runLoop(true).returned.currentNode.execution!;
    const silentPath = runLoop(false).returned.currentNode.execution!;
    assert.notEqual(soundPath.pathFingerprint, silentPath.pathFingerprint);
    assert.notDeepEqual(soundPath.content, silentPath.content);
    assert.notDeepEqual(soundPath.nextbounds, silentPath.nextbounds);
    assert.equal(
      soundPath.scratchpadObservations.some(
        (x) => x.id === "obs-sound-attached",
      ),
      true,
    );
    assert.equal(
      silentPath.scratchpadObservations.some(
        (x) => x.id === "obs-sound-attached",
      ),
      false,
    );
  });

  it("increments visitNumber through a real multi-contract loop", () => {
    const { returned } = runLoop();
    assert.deepEqual(
      returned.session.executions.map((x) => [x.contractId, x.visitNumber]),
      [
        ["visual-lab", 1],
        ["memory-soundscape", 1],
        ["cinematic-composer", 1],
        ["visual-lab", 2],
      ],
    );
  });

  it("transforms Nextbounds with a 40/60 contextual resolution", () => {
    const execution = runLoop().returned.currentNode.execution!;
    assert.equal(execution.okfContribution, 0.4);
    assert.equal(execution.sessionContribution, 0.6);
    assert.deepEqual(
      execution.nextbounds.map((x) => x.id),
      ["edit-resonance", "remix-sound", "share-return"],
    );
    assert.match(execution.nextboundExplanation.join(" "), /60%.*40%/);
  });

  it("exposes a transformation without navigation while only the new execution is real", () => {
    const { returned } = runLoop();
    const transition = returned.executionTransition;
    assert.ok(transition);
    assert.equal(transition.navigationRequired, false);
    assert.equal(
      returned.session.nodes.at(-1)!.execution!.executionId,
      transition.to.executionId,
    );
    assert.notEqual(transition.from.executionId, transition.to.executionId);
  });

  it("replays the ordered event log deterministically", () => {
    const first = runLoop();
    const second = runLoop();
    const firstReplay = replayArtifactEvents(first.returned.session.eventLog);
    const secondReplay = replayArtifactEvents(second.returned.session.eventLog);
    assert.deepEqual(firstReplay, secondReplay);
    assert.deepEqual(
      firstReplay.executions,
      first.returned.session.executions.map((x) => x.executionId),
    );
  });

  it("preserves contract invariants across executions", () => {
    const snapshot = structuredClone(visualLabContract);
    const { returned } = runLoop();
    assert.deepEqual(visualLabContract, snapshot);
    for (const execution of returned.session.executions.filter(
      (x) => x.contractId === visualLabContract.contractId,
    )) {
      assert.equal(
        execution.contractVersion,
        visualLabContract.contractVersion,
      );
      assert.equal(
        execution.content.every((module) =>
          visualLabContract.allowedModuleTypes.includes(module.type),
        ),
        true,
      );
    }
  });
});
