# Connect Nextbound MCP

The repository has two separate deliverables:

- The Nextbound experience UI: `ui://nextbound/afterlight.html` (published as
  `/nextbound.html` on the website).
- The Streamable HTTP MCP endpoint: `/mcp`.

The UI is linked only to `generate_experience`. Its output contains the
personalized experience while the UI uses the MCP Apps bridge to switch among
Alex, Camille and Maya.

## 1. Build and verify locally

```bash
npm install
npm run build:afterlight
npm run verify:afterlight
npm start
```

The local endpoint is `http://127.0.0.1:3000/mcp`.

## 2. Test with Codex locally

Add the local endpoint to a Codex development profile. Keep this configuration
outside the repository, because it is user-machine configuration.

```toml
[mcp_servers.nextbound]
url = "http://127.0.0.1:3000/mcp"
```

Restart or create a fresh Codex task, then ask: `Generate Luna's experience
for Maya.` The response should invoke `generate_experience` and show the
Nextbound UI resource.

## 3. Expose a temporary public endpoint

For manual testing with ChatGPT, run the server locally and expose only that
process through a temporary HTTPS tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:3000 --no-autoupdate
```

Use the generated URL with `/mcp` appended. The tunnel URL is temporary; do not
commit it, and stop the tunnel after testing.

## 4. Configure a production endpoint

Before connecting real users, deploy the MCP server behind a stable HTTPS
domain, for example `https://mcp.example.com/mcp`.

The production service must add, before storing or acting on personal data:

1. OAuth 2.1 authorization for the MCP client.
2. A consent screen specifying the profile fields sent to personalization.
3. Per-user and per-organization authorization checks in every write tool.
4. Persistent storage for saved experiences and events.
5. Audit logs and a revocation/deletion path.

The current repository is a deterministic demo: its user actions are in-memory
and it intentionally has no authentication or persistent profile data.

## 5. Connect ChatGPT

In the ChatGPT developer app flow, create or update the Nextbound app with:

- **MCP URL:** `https://mcp.example.com/mcp`
- **UI resource:** discovered automatically from `generate_experience`
- **Test prompt:** `Generate Luna's experience for Camille.`

Complete authorization in the ChatGPT flow only after the production OAuth
implementation is deployed. The exact ChatGPT settings labels can vary by
workspace and rollout; the MCP endpoint and OAuth callback URLs must use the
same production domain.
