import { createHash, randomUUID } from "node:crypto";

const SITE_ORIGIN = "https://nextbound-adaptive-media.netlify.app";
const operationStore = globalThis.__nextboundGinseOperations ?? new Map();
globalThis.__nextboundGinseOperations = operationStore;

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const fingerprint = (input) =>
  createHash("sha256").update(canonicalJson(input)).digest("hex");

const isValidBearer = (authorization) =>
  typeof authorization === "string" &&
  /^Bearer [A-Za-z0-9._~+/-]+=*$/u.test(authorization) &&
  authorization.length >= 24;

const validateInput = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return "Input must be a JSON object.";
  }
  const allowed = new Set(["persona", "goal", "style"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) return `Unexpected input field: ${key}.`;
  }
  if (!["camille", "alex", "maya"].includes(input.persona)) {
    return "persona must be one of: camille, alex, maya.";
  }
  if (typeof input.goal !== "string" || input.goal.length < 3 || input.goal.length > 80) {
    return "goal must be a string between 3 and 80 characters.";
  }
  if (
    input.style !== undefined &&
    (typeof input.style !== "string" || input.style.length < 3 || input.style.length > 80)
  ) {
    return "style must be a string between 3 and 80 characters when provided.";
  }
  return "";
};

const buildOutput = (input) => {
  const url = new URL("/nextbound.html", SITE_ORIGIN);
  url.searchParams.set("scenario", "procedural-loop");
  url.searchParams.set("persona", input.persona);
  url.searchParams.set("goal", input.goal);
  if (input.style) url.searchParams.set("style", input.style);

  const personaLabel = {
    camille: "Camille, the artistic director",
    alex: "Alex, the CEO",
    maya: "Maya, the developer student",
  }[input.persona];

  return {
    experience_url: url.toString(),
    summary: `Nextbound prepared an adaptive media dashboard for ${personaLabel}, framed around “${input.goal}”${input.style ? ` with a ${input.style} visual direction` : ""}.`,
    persona: input.persona,
    next_steps: [
      "Open the experience URL.",
      "Switch persona/design/world controls to compare adaptation.",
      "Use the Team Game and media cards as interactive proof points.",
    ],
  };
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed. Use POST." });
  }

  if (!isValidBearer(event.headers.authorization || event.headers.Authorization)) {
    return json(401, { error: "Missing or invalid Ginse bearer token." });
  }

  const idempotencyKey =
    event.headers["idempotency-key"] || event.headers["Idempotency-Key"];
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8) {
    return json(400, { error: "Missing or invalid Idempotency-Key header." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Request body must be valid JSON." });
  }
  const input =
    body && typeof body === "object" && !Array.isArray(body) && body.input
      ? body.input
      : body;

  const validationError = validateInput(input);
  if (validationError) return json(400, { error: validationError });

  const requestFingerprint = fingerprint(input);
  const stored = operationStore.get(idempotencyKey);
  if (stored) {
    if (stored.fingerprint !== requestFingerprint) {
      return json(409, {
        error: "Idempotency-Key was reused with a different request fingerprint.",
      });
    }
    return json(200, {
      status: "succeeded",
      provider_operation_id: stored.provider_operation_id,
      replayed: true,
      output: stored.output,
    });
  }

  const output = buildOutput(input);
  const record = {
    fingerprint: requestFingerprint,
    provider_operation_id: `nextbound_${randomUUID()}`,
    output,
  };
  operationStore.set(idempotencyKey, record);

  return json(200, {
    status: "succeeded",
    provider_operation_id: record.provider_operation_id,
    replayed: false,
    output,
  });
};
