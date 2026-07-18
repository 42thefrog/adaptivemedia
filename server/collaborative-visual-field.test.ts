import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  commonsContributions,
  commonsEvents,
  commonsObject,
  contractsAreCompatible,
  privateShell,
  resolveCollaborativeVisualField,
  sanitizeVisualContribution,
  type CollaborativeEvent,
} from "../nextbound/collaboration.js";
import { continuousContracts } from "../nextbound/runtime.js";

const fieldFor = (local: "maya" | "noa" | "elias", events = commonsEvents) => {
  const localContribution = commonsContributions[local];
  const contract =
    continuousContracts[
      local === "maya"
        ? "multiplayer-snake"
        : local === "noa"
          ? "living-canvas"
          : "constraint-room"
    ];
  return resolveCollaborativeVisualField({
    localVisualRecipe: {
      participantId: local,
      sessionColor: localContribution.sessionColor,
      typographyRole: localContribution.typographyRole,
      shapeLanguage: localContribution.shapeLanguage,
      textureLanguage: localContribution.textureLanguage,
      motionSignature: localContribution.motionSignature,
    },
    remoteVisualContributions: Object.values(commonsContributions).filter(
      (item) => item.participantId !== local,
    ),
    sharedObjects: [commonsObject],
    recentCollaborativeEvents: events,
    contractPolicy: contract.collaboration!,
  });
};

describe("compatible collaborative visual blending", () => {
  it("shares state across different compatible contract IDs", () => {
    assert.equal(
      contractsAreCompatible(
        continuousContracts["multiplayer-snake"],
        continuousContracts["living-canvas"],
      ),
      true,
    );
    assert.equal(fieldFor("noa").sharedObjects[0].id, "snake-trace-maya");
  });

  it("rejects contracts with different or absent compatibility keys", () => {
    assert.equal(
      contractsAreCompatible(
        continuousContracts["multiplayer-snake"],
        continuousContracts["visual-lab"],
      ),
      false,
    );
  });

  it("sanitizes contributions without private context or explanations", () => {
    const contribution = sanitizeVisualContribution({
      ...commonsContributions.maya,
      okfContext: { secret: true },
      semanticScratchpad: ["private"],
      privateNextbounds: ["private"],
      selectionReason: "derived from private context",
    });
    assert.deepEqual(Object.keys(contribution).sort(), [
      "activeObjectIds",
      "contributionStrength",
      "motionSignature",
      "participantId",
      "sessionColor",
      "shapeLanguage",
      "textureLanguage",
      "typographyRole",
    ]);
    assert.equal(JSON.stringify(contribution).includes("private"), false);
  });

  it("changes the field progressively when a participant arrives", () => {
    const before = fieldFor("maya", commonsEvents.slice(0, 2));
    const after = fieldFor("maya", commonsEvents.slice(0, 4));
    assert.notEqual(after.fingerprint, before.fingerprint);
    assert.equal(
      after.palette.includes(commonsContributions.noa.sessionColor),
      true,
    );
    assert.equal(
      after.transitionPlan.some(
        (step) => step.participantId === "noa" && step.mode === "propagate",
      ),
      true,
    );
  });

  it("keeps local identity dominant and gives each participant a distinct composite", () => {
    const maya = fieldFor("maya"),
      noa = fieldFor("noa"),
      elias = fieldFor("elias");
    for (const field of [maya, noa, elias]) {
      assert.equal(field.influence[0].weight, 0.6);
      assert.equal(
        field.palette[0],
        commonsContributions[field.localParticipantId].sessionColor,
      );
    }
    assert.equal(
      new Set([maya.fingerprint, noa.fingerprint, elias.fingerprint]).size,
      3,
    );
  });

  it("preserves shared object identity across every local composite", () => {
    assert.deepEqual(
      [fieldFor("maya"), fieldFor("noa"), fieldFor("elias")].map(
        (field) => field.sharedObjects[0].id,
      ),
      ["snake-trace-maya", "snake-trace-maya", "snake-trace-maya"],
    );
  });

  it("reduces departed presence without deleting authored work", () => {
    const leave: CollaborativeEvent = {
      id: "ce-7",
      sequenceNumber: 7,
      type: "participant_left",
      participantId: "maya",
      timestamp: "2026-07-17T12:00:07.000Z",
    };
    const before = fieldFor("noa");
    const after = fieldFor("noa", [...commonsEvents, leave]);
    const influence = (field: typeof before) =>
      field.influence.find((item) => item.participantId === "maya")!.weight;
    assert.ok(influence(after) < influence(before));
    assert.equal(
      after.sharedObjects.some((object) => object.id === "snake-trace-maya"),
      true,
    );
    assert.equal(
      after.transitionPlan.find((step) => step.participantId === "maya")?.mode,
      "fade-presence",
    );
  });

  it("keeps private Nextbounds and generated content inside PersonalShell", () => {
    const shell = privateShell({
      participantId: "maya",
      privateNextbounds: [{ id: "private-maya-next" }] as never[],
      privateGeneratedContent: [{ text: "private Maya content" }],
    });
    const field = fieldFor("maya");
    assert.equal(shell.privateNextbounds.length, 1);
    assert.equal(JSON.stringify(field).includes("private-maya-next"), false);
    assert.equal(JSON.stringify(field).includes("private Maya content"), false);
  });

  it("replays the same ordered event sequence into the same blend", () => {
    assert.deepEqual(
      fieldFor("elias", structuredClone(commonsEvents)),
      fieldFor("elias"),
    );
  });
});
