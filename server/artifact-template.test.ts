import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hydrateArtifact,
  parseArtifactTemplate,
  planMcpCalls,
  resolveReference,
} from "./artifact-template.js";

const TEMPLATE = `<section class="card">
  <mcp id="exp" tool="generate_experience"
       args='{"intentId":"intent_luna_main_character","personaId":"maya"}'
       select="experience" />
  <h1><intent ref="exp.personalizedTitle">Untitled</intent></h1>
  <p class="lead">{{ref:exp.structuredOutcome.summary}}</p>
  <blockquote><intent name="hook">the confidence line for this scene</intent></blockquote>
  <small>{{ref:exp.commercialDisclosure.label}}</small>
</section>`;

const OUTPUT = {
  experience: {
    personalizedTitle: "Scene 18: She Posted the Idea",
    structuredOutcome: {
      summary: "A cinematic reframe & shareable card.",
      steps: [
        { title: "Cinematic scene title" },
        { title: "Personal reframing" },
      ],
    },
    commercialDisclosure: { label: "No commercial recommendations." },
  },
};

describe("artifact template parser", () => {
  it("extracts an <mcp> directive with parsed args and select", () => {
    const parsed = parseArtifactTemplate(TEMPLATE);
    assert.equal(parsed.mcp.length, 1);
    const d = parsed.mcp[0];
    assert.equal(d.id, "exp");
    assert.equal(d.tool, "generate_experience");
    assert.equal(d.select, "experience");
    assert.deepEqual(d.args, {
      intentId: "intent_luna_main_character",
      personaId: "maya",
    });
    // The <mcp> tag renders to nothing.
    assert.ok(!parsed.html.includes("<mcp"));
  });

  it("classifies reference-mode and free-mode intents", () => {
    const parsed = parseArtifactTemplate(TEMPLATE);
    assert.equal(parsed.intents.length, 2);
    const ref = parsed.intents.find((i) => i.mode === "reference");
    const free = parsed.intents.find((i) => i.mode === "free");
    assert.ok(ref);
    assert.equal(ref.ref, "exp.personalizedTitle");
    assert.equal(ref.fallback, "Untitled");
    assert.ok(free);
    assert.equal(free.intentId, "hook");
    assert.equal(free.instruction, "the confidence line for this scene");
    // Intents become stable tokens.
    assert.ok(parsed.html.includes("{{intent:hook}}"));
  });

  it("records inline {{ref:...}} placeholders", () => {
    const parsed = parseArtifactTemplate(TEMPLATE);
    const paths = parsed.placeholders.map((p) => p.path);
    assert.deepEqual(paths, [
      "exp.structuredOutcome.summary",
      "exp.commercialDisclosure.label",
    ]);
  });

  it("plans exactly the MCP calls the agent must run", () => {
    const plan = planMcpCalls(parseArtifactTemplate(TEMPLATE));
    assert.deepEqual(plan, [
      {
        id: "exp",
        tool: "generate_experience",
        args: {
          intentId: "intent_luna_main_character",
          personaId: "maya",
        },
        select: "experience",
      },
    ]);
  });

  it("throws on an <mcp> tag missing id or tool", () => {
    assert.throws(() => parseArtifactTemplate(`<mcp tool="x" />`));
    assert.throws(() => parseArtifactTemplate(`<mcp id="x" />`));
  });

  it("throws on invalid JSON args", () => {
    assert.throws(() =>
      parseArtifactTemplate(`<mcp id="x" tool="t" args="{not json}" />`),
    );
  });

  it("ignores tags and placeholders inside HTML comments", () => {
    const parsed = parseArtifactTemplate(
      `<!-- run the planned <mcp> calls, resolve <intent> and {{ref:x}} -->\n` +
        `<p>{{ref:v}}</p>`,
    );
    assert.equal(parsed.mcp.length, 0);
    assert.equal(parsed.intents.length, 0);
    assert.deepEqual(
      parsed.placeholders.map((p) => p.path),
      ["v"],
    );
    // The comment survives intact in the output.
    assert.ok(parsed.html.includes("<!-- run the planned <mcp> calls"));
    assert.ok(!parsed.html.includes("__AM_COMMENT_"));
  });

  it("parses a multi-line <mcp> tag", () => {
    const parsed = parseArtifactTemplate(
      `<mcp\n  id="exp"\n  tool="generate_experience"\n  select="experience"\n/>`,
    );
    assert.equal(parsed.mcp.length, 1);
    assert.equal(parsed.mcp[0].tool, "generate_experience");
    assert.equal(parsed.mcp[0].select, "experience");
  });

  it("tolerates whitespace in a prettier-formatted <intent> close tag", () => {
    // Prettier can emit `<intent name="x"\n  >text</intent\n>`.
    const parsed = parseArtifactTemplate(
      `<blockquote>\n  <intent name="hook"\n    >the confidence line</intent\n  >\n</blockquote>`,
    );
    assert.equal(parsed.intents.length, 1);
    assert.equal(parsed.intents[0].intentId, "hook");
    assert.equal(parsed.intents[0].instruction, "the confidence line");
    assert.ok(parsed.html.includes("{{intent:hook}}"));
  });
});

describe("reference resolution", () => {
  it("resolves dotted paths with array indexing", () => {
    assert.equal(
      resolveReference(OUTPUT, "experience.structuredOutcome.steps[1].title"),
      "Personal reframing",
    );
  });

  it("returns undefined for missing paths", () => {
    assert.equal(resolveReference(OUTPUT, "experience.nope.deep"), undefined);
    assert.equal(resolveReference(OUTPUT, "experience.steps[9]"), undefined);
  });
});

describe("artifact hydration", () => {
  it("hydrates a fully-resolved template", () => {
    const parsed = parseArtifactTemplate(TEMPLATE);
    const { html, unresolved } = hydrateArtifact(parsed, {
      results: { exp: OUTPUT },
      intentResolutions: { hook: "exp.structuredOutcome.steps[0].title" },
    });
    assert.equal(unresolved.length, 0);
    assert.ok(html.includes("<h1>Scene 18: She Posted the Idea</h1>"));
    assert.ok(html.includes("A cinematic reframe &amp; shareable card."));
    assert.ok(html.includes("Cinematic scene title"));
    assert.ok(html.includes("No commercial recommendations."));
    assert.ok(!html.includes("{{"));
  });

  it("applies the directive select before binding", () => {
    // Without select the whole output lives under `exp`, so paths shift.
    const parsed = parseArtifactTemplate(
      `<mcp id="exp" tool="generate_experience" /><h1><intent ref="exp.experience.personalizedTitle" /></h1>`,
    );
    const { html, unresolved } = hydrateArtifact(parsed, {
      results: { exp: OUTPUT },
    });
    assert.equal(unresolved.length, 0);
    assert.ok(html.includes("Scene 18: She Posted the Idea"));
  });

  it("escapes HTML in resolved values by default", () => {
    const parsed = parseArtifactTemplate(`<p>{{ref:v}}</p>`);
    const { html } = hydrateArtifact(parsed, {
      results: { v: "<script>alert(1)</script>" },
    });
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(!html.includes("<script>"));
  });

  it("inserts raw values when raw: true", () => {
    const parsed = parseArtifactTemplate(`<div>{{ref:v}}</div>`);
    const { html } = hydrateArtifact(parsed, {
      results: { v: "<b>bold</b>" },
      raw: true,
    });
    assert.ok(html.includes("<b>bold</b>"));
  });

  it("reports a free intent with no resolution and uses its fallback", () => {
    const parsed = parseArtifactTemplate(
      `<h1><intent name="t">the title</intent></h1>`,
    );
    const { html, unresolved } = hydrateArtifact(parsed, { results: {} });
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].kind, "intent");
    assert.equal(unresolved[0].reason, "missing-resolution");
    assert.ok(html.includes("<h1></h1>"));
  });

  it("reports a reference whose path is not found", () => {
    const parsed = parseArtifactTemplate(`<p>{{ref:exp.missing}}</p>`);
    const { html, unresolved } = hydrateArtifact(parsed, {
      results: { exp: OUTPUT },
    });
    assert.equal(unresolved.length, 1);
    assert.equal(unresolved[0].reason, "path-not-found");
    assert.ok(html.includes("<p></p>"));
  });
});
