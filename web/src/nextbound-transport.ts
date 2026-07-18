import {
  localToolAdapter,
  type NextboundRuntimeToolName,
} from "../../nextbound/adapter.js";

export type NextboundTransport = {
  call<TInput, TOutput>(
    toolName: NextboundRuntimeToolName,
    input: TInput,
  ): Promise<TOutput>;
};

export class LocalNextboundTransport implements NextboundTransport {
  call<TInput, TOutput>(toolName: NextboundRuntimeToolName, input: TInput) {
    return localToolAdapter.call(
      toolName,
      input as Record<string, unknown>,
    ) as Promise<TOutput>;
  }
}

type Bridge = {
  callTool?: (name: string, args: unknown) => Promise<unknown>;
  request?: (request: { method: string; params: unknown }) => Promise<unknown>;
};
export class MCPNextboundTransport implements NextboundTransport {
  constructor(private bridge: Bridge = (window as any).openai) {}
  async call<TInput, TOutput>(
    toolName: NextboundRuntimeToolName,
    input: TInput,
  ): Promise<TOutput> {
    if (!this.bridge) throw new Error("The MCP Apps bridge is unavailable.");
    const raw: any = this.bridge.request
      ? await this.bridge.request({
          method: "tools/call",
          params: { name: toolName, arguments: input },
        })
      : await this.bridge.callTool?.(toolName, input);
    const result = raw?.result ?? raw;
    if (result?.isError)
      throw new Error(
        result.structuredContent?.error?.message ?? "The tool call failed.",
      );
    const output = result?.structuredContent ?? result;
    if (!output || typeof output !== "object")
      throw new Error("The MCP tool returned an invalid result.");
    return output as TOutput;
  }
}

export const createNextboundTransport = (
  mode: "local-preview" | "mcp",
): NextboundTransport =>
  mode === "mcp" ? new MCPNextboundTransport() : new LocalNextboundTransport();
