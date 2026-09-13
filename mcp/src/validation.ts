import { WorkflowError } from "./errors.js";

const DEPRECATED_SKILL_SUFFIX = "/SKILL";

/**
 * Pure kebab-case skill directory name: lowercase alphanumeric segments separated by `-`.
 * No slash, dot, backslash, underscore, uppercase letter, or whitespace can appear, which is
 * sufficient to make path traversal (`..`, `/`, absolute paths) impossible.
 */
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Rule name: the lowercase kebab-case basename without `.md`, e.g. `mvi-error-handling`.
 * Slashes, dots, backslashes, underscores and uppercase letters cannot match, so path traversal
 * is impossible.
 */
const RULE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates a skill name from an MCP caller. Accepts the deprecated `<name>/SKILL` alias (stripped
 * before validation) for backward compatibility, but the returned value is always the bare name.
 */
export function validateSkillName(rawName: string): string {
  const name = rawName.endsWith(DEPRECATED_SKILL_SUFFIX)
    ? rawName.slice(0, -DEPRECATED_SKILL_SUFFIX.length)
    : rawName;

  if (!SKILL_NAME_PATTERN.test(name)) {
    throw new WorkflowError(
      "INVALID_NAME",
      `Invalid skill name '${rawName}'. Expected a kebab-case skill directory name, e.g. 'create-feature-scaffold-screen'.`
    );
  }

  return name;
}

export function validateRuleName(rawName: string): string {
  if (!RULE_NAME_PATTERN.test(rawName)) {
    throw new WorkflowError(
      "INVALID_NAME",
      `Invalid rule name '${rawName}'. Expected a lowercase kebab-case rule name, e.g. 'mvi-error-handling'.`
    );
  }

  return rawName;
}

/** Agent name: the lowercase kebab-case basename without `.md`, e.g. `kotlin-engineer`. */
const AGENT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateAgentName(rawName: string): string {
  if (!AGENT_NAME_PATTERN.test(rawName)) {
    throw new WorkflowError(
      "INVALID_NAME",
      `Invalid agent name '${rawName}'. Expected a lowercase kebab-case agent name, e.g. 'kotlin-engineer'.`
    );
  }

  return rawName;
}

/** Workflow name: the lowercase kebab-case basename without `.js`, e.g. `full-review`. */
const WORKFLOW_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateWorkflowName(rawName: string): string {
  if (!WORKFLOW_NAME_PATTERN.test(rawName)) {
    throw new WorkflowError(
      "INVALID_NAME",
      `Invalid workflow name '${rawName}'. Expected a lowercase kebab-case workflow name, e.g. 'full-review'.`
    );
  }

  return rawName;
}
