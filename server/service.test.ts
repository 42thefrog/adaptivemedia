import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  audiencePersonas,
  creators,
  intents,
  personalizedExperiences,
} from "./data/seed.js";
import { AdaptiveMediaService } from "./service.js";

describe("Step 6 MCP service", () => {
  it("searches only public published Intents and returns all relevant matches", () => {
    const r = new AdaptiveMediaService().searchPublicIntents({
      query: "AI technology project",
    });
    assert.ok(r.results.length > 0);
    assert.ok(
      r.results.every(
        (x) =>
          intents.find((i) => i.id === x.intent.id)?.visibility === "public",
      ),
    );
  });
  for (const [query, creatorId] of [
    ["OpenAI Build Week hackathon", "creator_noah"],
    ["beauty skincare personal recommendation", "creator_amelie"],
    ["confidence music main character", "creator_luna"],
  ])
    it(`ranks ${creatorId} first`, () =>
      assert.equal(
        new AdaptiveMediaService().searchPublicIntents({ query }).results[0]
          .creator.id,
        creatorId,
      ));
  it("respects the search limit", () =>
    assert.equal(
      new AdaptiveMediaService().searchPublicIntents({ query: "a", limit: 2 })
        .results.length,
      2,
    ));
  it("returns creator profile with public Intents and local follow state", () => {
    const s = new AdaptiveMediaService();
    assert.equal(s.getCreatorProfile("creator_noah").publicIntents.length, 1);
    s.followCreator("creator_noah", true);
    assert.equal(s.getCreatorProfile("creator_noah").following, true);
  });
  it("always identifies Luna as fictional", () =>
    assert.equal(
      new AdaptiveMediaService().getCreatorProfile("creator_luna").creator
        .fictional,
      true,
    ));
  it("returns original Intent and all personas", () => {
    const r = new AdaptiveMediaService().getIntent(intents[0].id);
    assert.deepEqual(r.intent.immutableMessage, intents[0].immutableMessage);
    assert.equal(r.availablePersonas.length, 3);
  });
  it("rejects private and draft Intents distinctly", () => {
    const privateIntent = {
      ...structuredClone(intents[0]),
      id: "intent_private",
      visibility: "private" as const,
    };
    const draft = {
      ...structuredClone(intents[0]),
      id: "intent_draft",
      status: "draft" as const,
      publicationStatus: "draft" as const,
    };
    const s = new AdaptiveMediaService({ intents: [privateIntent, draft] });
    assert.throws(() => s.getIntent("intent_private"), /private/i);
    assert.throws(() => s.getIntent("intent_draft"), /draft/i);
  });
  it("rejects unknown creators and Intents", () => {
    const s = new AdaptiveMediaService();
    assert.throws(
      () => s.getCreatorProfile("creator_unknown"),
      /Unknown creator/,
    );
    assert.throws(() => s.getIntent("intent_unknown"), /Unknown Intent/);
  });
  it("contains exactly nine deterministic experiences", () =>
    assert.equal(personalizedExperiences.length, 9));
  const expected: Record<string, string[]> = {
    intent_noah_build_week: [
      "Open Source Agent Debugger",
      "Adaptive Client Atelier",
      "Adaptive Campaign",
    ],
    intent_amelie_beauty_ritual: [
      "Screen-Time Reset",
      "Five-Minute Executive Ritual",
      "Camera-Ready Without the Ten-Step Routine",
    ],
    intent_luna_main_character: [
      "Scene 04: He Finally Let Other People See What He Built",
      "Scene 22: She Entered the Room Before Anyone Was Ready for Her",
      "Scene 18: She Posted the Idea Before the Trend Had a Name",
    ],
  };
  it("returns every golden deterministic title", () => {
    const s = new AdaptiveMediaService();
    for (const intent of intents)
      ["alex", "camille", "maya"].forEach((p, i) =>
        assert.equal(
          s.generateExperience(intent.id, p as any).experience
            .personalizedTitle,
          expected[intent.id][i],
        ),
      );
  });
  it("preserves immutable creator messages", () => {
    const s = new AdaptiveMediaService();
    for (const intent of intents)
      for (const p of ["alex", "camille", "maya"] as const)
        assert.deepEqual(
          s.generateExperience(intent.id, p).experience.preservedCreatorMessage,
          intent.immutableMessage,
        );
  });
  it("persona switching retains Intent and attribution", () => {
    const s = new AdaptiveMediaService();
    const a = s.generateExperience(intents[0].id, "alex").experience;
    const m = s.generateExperience(intents[0].id, "maya").experience;
    assert.equal(a.intentId, m.intentId);
    assert.equal(a.creatorAttribution, m.creatorAttribution);
    assert.notEqual(a.personalizedTitle, m.personalizedTitle);
  });
  it("like is toggleable and idempotent", () => {
    const s = new AdaptiveMediaService();
    assert.deepEqual(
      s.likeIntent(intents[0].id, true),
      s.likeIntent(intents[0].id, true),
    );
    assert.equal(s.likeIntent(intents[0].id, false).likeCount, 0);
  });
  it("follow is toggleable and idempotent", () => {
    const s = new AdaptiveMediaService();
    assert.deepEqual(
      s.followCreator(creators[0].id, true),
      s.followCreator(creators[0].id, true),
    );
    assert.equal(s.followCreator(creators[0].id, false).following, false);
  });
  it("save is toggleable and idempotent", () => {
    const s = new AdaptiveMediaService();
    const id = personalizedExperiences[0].id;
    assert.deepEqual(s.saveExperience(id, true), s.saveExperience(id, true));
    assert.equal(s.saveExperience(id, false).saved, false);
  });
  it("share IDs are stable and preserve attribution", () => {
    const s = new AdaptiveMediaService();
    const a = s.createShareLink(personalizedExperiences[0].id);
    const b = s.createShareLink(personalizedExperiences[0].id);
    assert.equal(a.shareId, b.shareId);
    assert.equal(a.creator.id, creators[0].id);
    assert.equal(a.intent.id, intents[0].id);
  });
  it("share artifacts exclude persona data", () => {
    const r = new AdaptiveMediaService().createShareLink(
      personalizedExperiences[0].id,
    ) as any;
    assert.equal(r.personaId, undefined);
    assert.doesNotMatch(JSON.stringify(r), /Developer Student|Paris|21/);
  });
  it("seed personas remain Alex, Camille and Maya", () =>
    assert.deepEqual(
      audiencePersonas.map((p) => p.name),
      ["Alex", "Camille", "Maya"],
    ));
});
