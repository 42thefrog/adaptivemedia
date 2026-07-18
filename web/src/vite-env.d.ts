/// <reference types="vite/client" />

interface Window {
  openai?: {
    toolInput?: Record<string, unknown>;
    toolOutput?: Record<string, unknown>;
    widgetState?: Record<string, unknown>;
    callTool?: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ structuredContent?: Record<string, unknown> }>;
    setWidgetState?: (state: Record<string, unknown>) => void;
    sendFollowUpMessage?: (message: {
      prompt: string;
      scrollToBottom?: boolean;
    }) => Promise<void>;
  };
}
