/**
 * Ambient types for the WebMCP imperative API as of the July 2026 Community
 * Group draft, matching Chrome's `document.modelContext` surface. Shipped as
 * declarations because no browser lib includes them yet.
 *
 * Spec: https://github.com/webmachinelearning/webmcp
 * Docs: https://developer.chrome.com/docs/ai/webmcp/imperative-api
 */

export interface JsonSchemaProperty {
  type?: "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";
  description?: string;
  enum?: readonly (string | number)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  default?: unknown;
  items?: JsonSchemaProperty;
  properties?: Readonly<Record<string, JsonSchemaProperty>>;
  required?: readonly string[];
  additionalProperties?: boolean;
}

export interface ToolInputSchema {
  type: "object";
  properties: Readonly<Record<string, JsonSchemaProperty>>;
  required?: readonly string[];
  additionalProperties: false;
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  untrustedContentHint?: boolean;
}

export type ToolArguments = Readonly<Record<string, unknown>>;

export interface ToolExecutionContext {
  signal: AbortSignal;
}

export interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  annotations?: ToolAnnotations;
  execute: (
    args: ToolArguments,
    context: ToolExecutionContext,
  ) => Promise<string> | string;
}

export interface RegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: readonly string[];
}

export interface ModelContext extends EventTarget {
  registerTool(tool: ToolDescriptor, options?: RegisterToolOptions): Promise<void>;
  getTools(options?: { fromOrigins?: readonly string[] }): Promise<
    readonly { name: string; description: string; origin: string }[]
  >;
  executeTool(
    tool: { name: string },
    args: string,
    options?: { signal?: AbortSignal },
  ): Promise<string | null>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  return document.modelContext ?? null;
}

export function isWebMCPAvailable(): boolean {
  return getModelContext() !== null;
}
