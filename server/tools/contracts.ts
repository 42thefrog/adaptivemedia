import type { z } from "zod";

export type ToolContract<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
  name: string;
  title: string;
  description: string;
  inputSchema: I;
  outputSchema: O;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
};
