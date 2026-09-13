import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { toToolErrorResult } from "./errors.js";
import { searchRulesAndSkills } from "./search.js";
import { createSource, type CreateSourceEnv, type WorkflowSource } from "./source/index.js";
import { validateAgentName, validateRuleName, validateSkillName, validateWorkflowName } from "./validation.js";
import { getServerName, getServerVersion } from "./version.js";

const SERVER_INSTRUCTIONS = [
  "Use this server as the source of truth for Cuckcoder rules, skills, agents, and workflows.",
  "Before any git commit, call get_rule with name 'git' and apply the returned rules.",
  "Before deleting files, call get_rule with name 'filesystem' and apply the returned rules.",
  "Use search to find relevant rules/skills by keyword instead of guessing names.",
].join("\n");

const sourceOutputShape = {
  kind: z.enum(["bundled", "github"]),
  ref: z.string(),
};

export interface CreateServerOptions {
  /** Environment used to pick/configure the source when `source` isn't supplied directly. Defaults to `process.env`. */
  env?: CreateSourceEnv;
  /** Inject a WorkflowSource directly (used by tests). Takes precedence over `env`. */
  source?: WorkflowSource;
  /** Inject a fetch implementation for the GitHub source (used by tests). Ignored if `source` is supplied. */
  fetchImpl?: typeof fetch;
}

/**
 * Builds the MCP server and registers its tools. Contains no transport/connect logic, so it can
 * be constructed and exercised directly in tests without spawning a process or opening stdio.
 */
export function createServer(options: CreateServerOptions = {}): McpServer {
  const env = options.env ?? (process.env as CreateSourceEnv);
  const source = options.source ?? createSource(env, options.fetchImpl);
  const sourceInfo = source.info();
  const readOnlyHint = true;
  const openWorldHint = sourceInfo.kind === "github";

  const server = new McpServer(
    { name: getServerName(), version: getServerVersion() },
    { instructions: SERVER_INSTRUCTIONS }
  );

  // ─── list ──────────────────────────────────────────────────────────────────

  server.registerTool(
    "list",
    {
      title: "List rules and skills",
      description: "List all available rule names and skill names/descriptions in the Cuckcoder repository.",
      inputSchema: {},
      outputSchema: {
        rules: z.array(z.string()),
        skills: z.array(z.object({ name: z.string(), description: z.string() })),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "List rules and skills",
        readOnlyHint,
        openWorldHint,
      },
    },
    async () => {
      try {
        const [rules, skills] = await Promise.all([source.listRules(), source.listSkills()]);
        const structuredContent = { rules, skills, source: sourceInfo };

        const lines = [
          "## Rules",
          rules.length ? rules.map((rule) => `- ${rule}`).join("\n") : "_none_",
          "",
          "## Skills",
          skills.length
            ? skills.map((skill) => `- ${skill.name} — ${skill.description}`).join("\n")
            : "_none_",
        ];

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent,
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── get_rule ──────────────────────────────────────────────────────────────

  server.registerTool(
    "get_rule",
    {
      title: "Get rule content",
      description: "Get the content of a rule. Use a name from the `list` tool, e.g. 'mvi'.",
      inputSchema: {
        name: z.string().describe("Lowercase kebab-case rule name without the '.md' suffix, e.g. 'mvi-error-handling'"),
      },
      outputSchema: {
        name: z.string(),
        content: z.string(),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "Get rule content",
        readOnlyHint,
        openWorldHint,
      },
    },
    async ({ name }) => {
      try {
        const validName = validateRuleName(name);
        const content = await source.getRule(validName);
        return {
          content: [{ type: "text", text: content }],
          structuredContent: { name: validName, content, source: sourceInfo },
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── get_skill ─────────────────────────────────────────────────────────────

  server.registerTool(
    "get_skill",
    {
      title: "Get skill instructions",
      description: "Get the instructions for a skill. Use a name from the `list` tool, e.g. 'create-feature-scaffold-screen'.",
      inputSchema: {
        name: z.string().describe("Skill name (kebab-case directory name), e.g. 'create-feature-scaffold-screen'"),
      },
      outputSchema: {
        name: z.string(),
        description: z.string(),
        content: z.string(),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "Get skill instructions",
        readOnlyHint,
        openWorldHint,
      },
    },
    async ({ name }) => {
      try {
        const validName = validateSkillName(name);
        const skill = await source.getSkill(validName);
        return {
          content: [{ type: "text", text: skill.content }],
          structuredContent: {
            name: validName,
            description: skill.description,
            content: skill.content,
            source: sourceInfo,
          },
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── list_agents ───────────────────────────────────────────────────────────

  server.registerTool(
    "list_agents",
    {
      title: "List agents",
      description: "List all available sub-agent names and descriptions in the Cuckcoder repository.",
      inputSchema: {},
      outputSchema: {
        agents: z.array(z.object({ name: z.string(), description: z.string() })),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "List agents",
        readOnlyHint,
        openWorldHint,
      },
    },
    async () => {
      try {
        const agents = await source.listAgents();
        const structuredContent = { agents, source: sourceInfo };
        const lines = agents.length
          ? agents.map((agent) => `- ${agent.name} — ${agent.description}`).join("\n")
          : "_none_";
        return {
          content: [{ type: "text", text: lines }],
          structuredContent,
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── get_agent ─────────────────────────────────────────────────────────────

  server.registerTool(
    "get_agent",
    {
      title: "Get agent definition",
      description: "Get the role, tools, and full definition of a sub-agent. Use a name from `list_agents`, e.g. 'kotlin-engineer'.",
      inputSchema: {
        name: z.string().describe("Lowercase kebab-case agent name, e.g. 'kotlin-engineer'"),
      },
      outputSchema: {
        name: z.string(),
        description: z.string(),
        tools: z.string(),
        disallowedTools: z.string(),
        content: z.string(),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "Get agent definition",
        readOnlyHint,
        openWorldHint,
      },
    },
    async ({ name }) => {
      try {
        const validName = validateAgentName(name);
        const agent = await source.getAgent(validName);
        return {
          content: [{ type: "text", text: agent.content }],
          structuredContent: { name: validName, ...agent, source: sourceInfo },
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── list_workflows ────────────────────────────────────────────────────────

  server.registerTool(
    "list_workflows",
    {
      title: "List workflows",
      description: "List all available workflow (sweep pipeline) names and descriptions in the Cuckcoder repository.",
      inputSchema: {},
      outputSchema: {
        workflows: z.array(z.object({ name: z.string(), description: z.string() })),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "List workflows",
        readOnlyHint,
        openWorldHint,
      },
    },
    async () => {
      try {
        const workflows = await source.listWorkflows();
        const structuredContent = { workflows, source: sourceInfo };
        const lines = workflows.length
          ? workflows.map((workflow) => `- ${workflow.name} — ${workflow.description}`).join("\n")
          : "_none_";
        return {
          content: [{ type: "text", text: lines }],
          structuredContent,
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── get_workflow ──────────────────────────────────────────────────────────

  server.registerTool(
    "get_workflow",
    {
      title: "Get workflow source",
      description: "Get the description, when-to-use, and full source of a workflow. Use a name from `list_workflows`, e.g. 'full-review'.",
      inputSchema: {
        name: z.string().describe("Lowercase kebab-case workflow name, e.g. 'full-review'"),
      },
      outputSchema: {
        name: z.string(),
        description: z.string(),
        whenToUse: z.string(),
        content: z.string(),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "Get workflow source",
        readOnlyHint,
        openWorldHint,
      },
    },
    async ({ name }) => {
      try {
        const validName = validateWorkflowName(name);
        const workflow = await source.getWorkflow(validName);
        return {
          content: [{ type: "text", text: workflow.content }],
          structuredContent: { name: validName, ...workflow, source: sourceInfo },
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  // ─── search ────────────────────────────────────────────────────────────────

  server.registerTool(
    "search",
    {
      title: "Search rules and skills",
      description: "Rough case-insensitive keyword search across every rule's and skill's full content. Use instead of guessing a rule/skill name.",
      inputSchema: {
        query: z.string().min(1).describe("Keyword or phrase to search for, e.g. 'coroutine scope'"),
      },
      outputSchema: {
        results: z.array(z.object({ type: z.enum(["rule", "skill"]), name: z.string(), snippet: z.string() })),
        source: z.object(sourceOutputShape),
      },
      annotations: {
        title: "Search rules and skills",
        readOnlyHint,
        openWorldHint,
      },
    },
    async ({ query }) => {
      try {
        const results = await searchRulesAndSkills(source, query);
        const structuredContent = { results, source: sourceInfo };
        const lines = results.length
          ? results.map((result) => `- [${result.type}] ${result.name}: ${result.snippet}`).join("\n")
          : "_no matches_";
        return {
          content: [{ type: "text", text: lines }],
          structuredContent,
        };
      } catch (error) {
        return toToolErrorResult(error);
      }
    }
  );

  return server;
}
