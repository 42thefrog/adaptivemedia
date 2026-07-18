# Nextbound Inline Artifact Contract

## Artifact

- id: `nextbound-procedural-loop-artifact`
- title: `Nextbound Experience Engine`
- surface: `conversation_inline_artifact`
- entrypoint: `web/artifact.html`
- scenario: `procedural-loop`

## Seed

- seedId: `seed-afterlight-maya`
- recipientId: `maya`
- campaignId: `campaign-afterlight-runtime`
- initialContractId: `visual-lab`

## Initial Contract

- contractId: `visual-lab`
- contractVersion: `1.0.0`
- creatorId: `luna-vale`
- creatorIntent: `Turn This Moment Into Your Main-Character Scene`
- outputSchema: `nextbound.artifact-execution.v1`

## Load Sequence

1. The inline artifact bootstraps `web/src/nextbound.ts`.
2. The page forces `procedural-loop` mode with `window.__NEXTBOUND_ARTIFACT__`.
3. The local transport opens `seed-afterlight-maya` for recipient `maya`.
4. The runtime executes the initial `visual-lab` artifact contract.
5. The first rendered components come from the resulting artifact execution:
   frames, actions, nextbounds and contract summary.

## Invariants

- The artifact must not open the old `/` Adaptive Media interface.
- The first visible state must be the Nextbound procedural loop.
- The initial execution must be generated from the seed and contract above.
- The artifact must remain usable inside a conversation iframe without relying
  on external navigation state.
