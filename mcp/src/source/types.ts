export type SourceKind = "bundled" | "github";

export interface SourceInfo {
  kind: SourceKind;
  ref: string;
}

export interface SkillSummary {
  name: string;
  description: string;
}

export interface SkillContent {
  description: string;
  content: string;
}

export interface AgentSummary {
  name: string;
  description: string;
}

export interface AgentContent {
  description: string;
  tools: string;
  disallowedTools: string;
  content: string;
}

export interface WorkflowSummary {
  name: string;
  description: string;
}

export interface WorkflowContent {
  description: string;
  whenToUse: string;
  content: string;
}

/**
 * Abstraction over where rules/skills/agents/workflows content is read from: the npm-packaged
 * bundled snapshot (default, no network) or an optional GitHub-backed remote mode.
 */
export interface WorkflowSource {
  info(): SourceInfo;
  listRules(): Promise<string[]>;
  listSkills(): Promise<SkillSummary[]>;
  getRule(name: string): Promise<string>;
  getSkill(name: string): Promise<SkillContent>;
  listAgents(): Promise<AgentSummary[]>;
  getAgent(name: string): Promise<AgentContent>;
  listWorkflows(): Promise<WorkflowSummary[]>;
  getWorkflow(name: string): Promise<WorkflowContent>;
}
