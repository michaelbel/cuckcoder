export interface WorkflowMeta {
  name: string;
  description: string;
  whenToUse: string;
}

const META_BLOCK_PATTERN = /export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/;

/**
 * Extracts `export const meta = { name, description, whenToUse? }` from a workflow module's
 * source text without importing the module. Workflow files reference sweep-runtime globals
 * (`args`, `agent`, `phase`, ...) at the top level, so `import()`-ing one directly would throw;
 * this only evaluates the isolated `meta` object literal, which in every workflow is just string
 * literals joined with `+`.
 */
export function parseWorkflowMeta(source: string): WorkflowMeta {
  const match = source.match(META_BLOCK_PATTERN);
  if (!match) {
    throw new Error("no 'export const meta = {...}' block found");
  }

  let meta: unknown;
  try {
    meta = new Function(`"use strict"; return (${match[1]});`)();
  } catch (error) {
    throw new Error(`failed to evaluate the workflow meta block: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (
    typeof meta !== "object" ||
    meta === null ||
    typeof (meta as Record<string, unknown>).name !== "string" ||
    typeof (meta as Record<string, unknown>).description !== "string"
  ) {
    throw new Error("workflow meta block did not evaluate to { name: string, description: string, ... }");
  }

  const { name, description, whenToUse } = meta as { name: string; description: string; whenToUse?: unknown };
  return { name, description, whenToUse: typeof whenToUse === "string" ? whenToUse : "" };
}
