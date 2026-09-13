import { WorkflowError } from "../errors.js";
import { parseFrontmatter } from "../frontmatter.js";
import { parseWorkflowMeta } from "../workflow-meta.js";
import { GithubClient } from "./github.js";
import type {
  AgentContent,
  AgentSummary,
  SkillContent,
  SkillSummary,
  SourceInfo,
  WorkflowContent,
  WorkflowSource,
  WorkflowSummary,
} from "./types.js";

const OWNER = "michaelbel";
const REPO = "cuckcoder";

/**
 * Optional remote WorkflowSource: reads rules/skills straight from GitHub at a pinned,
 * validated ref (never `main`/`master`). Read-only, but network-dependent (`openWorldHint: true`
 * on the tools that use it).
 */
export class GithubSource implements WorkflowSource {
  private readonly client: GithubClient;

  constructor(private readonly ref: string, token: string | undefined, fetchImpl?: typeof fetch) {
    this.client = new GithubClient({ owner: OWNER, repo: REPO, token, fetchImpl });
  }

  info(): SourceInfo {
    return { kind: "github", ref: this.ref };
  }

  async listRules(): Promise<string[]> {
    const tree = await this.client.listTree(this.ref);
    return tree
      .filter((item) => item.type === "blob" && /^rules\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(item.path))
      .map((item) => item.path.replace(/^rules\//, "").replace(/\.md$/, ""))
      .sort();
  }

  async listSkills(): Promise<SkillSummary[]> {
    const tree = await this.client.listTree(this.ref);
    const skillPaths = tree
      .filter((item) => item.type === "blob" && /^skills\/[^/]+\/SKILL\.md$/.test(item.path))
      .map((item) => item.path)
      .sort();

    const summaries: SkillSummary[] = [];
    for (const path of skillPaths) {
      const name = path.replace(/^skills\//, "").replace(/\/SKILL\.md$/, "");
      const raw = await this.client.fetchFile(this.ref, path);
      const { fields } = parseFrontmatter(raw);
      summaries.push({ name, description: fields.description ?? "" });
    }
    return summaries;
  }

  async getRule(name: string): Promise<string> {
    try {
      return await this.client.fetchFile(this.ref, `rules/${name}.md`);
    } catch (error) {
      if (error instanceof WorkflowError && error.code === "NOT_FOUND") {
        throw new WorkflowError("NOT_FOUND", `Rule '${name}' was not found at ref '${this.ref}'.`);
      }
      throw error;
    }
  }

  async getSkill(name: string): Promise<SkillContent> {
    let raw: string;
    try {
      raw = await this.client.fetchFile(this.ref, `skills/${name}/SKILL.md`);
    } catch (error) {
      if (error instanceof WorkflowError && error.code === "NOT_FOUND") {
        throw new WorkflowError("NOT_FOUND", `Skill '${name}' was not found at ref '${this.ref}'.`);
      }
      throw error;
    }

    const { fields, body } = parseFrontmatter(raw);
    return { description: fields.description ?? "", content: body.trim() };
  }

  async listAgents(): Promise<AgentSummary[]> {
    const tree = await this.client.listTree(this.ref);
    const paths = tree
      .filter((item) => item.type === "blob" && /^agents\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(item.path))
      .map((item) => item.path)
      .sort();

    const summaries: AgentSummary[] = [];
    for (const path of paths) {
      const name = path.replace(/^agents\//, "").replace(/\.md$/, "");
      const raw = await this.client.fetchFile(this.ref, path);
      const { fields } = parseFrontmatter(raw);
      summaries.push({ name, description: fields.description ?? "" });
    }
    return summaries;
  }

  async getAgent(name: string): Promise<AgentContent> {
    let raw: string;
    try {
      raw = await this.client.fetchFile(this.ref, `agents/${name}.md`);
    } catch (error) {
      if (error instanceof WorkflowError && error.code === "NOT_FOUND") {
        throw new WorkflowError("NOT_FOUND", `Agent '${name}' was not found at ref '${this.ref}'.`);
      }
      throw error;
    }

    const { fields, body } = parseFrontmatter(raw);
    return {
      description: fields.description ?? "",
      tools: fields.tools ?? "",
      disallowedTools: fields.disallowedTools ?? "",
      content: body.trim(),
    };
  }

  async listWorkflows(): Promise<WorkflowSummary[]> {
    const tree = await this.client.listTree(this.ref);
    const paths = tree
      .filter((item) => item.type === "blob" && /^workflows\/[a-z0-9]+(?:-[a-z0-9]+)*\.js$/.test(item.path))
      .map((item) => item.path)
      .sort();

    const summaries: WorkflowSummary[] = [];
    for (const path of paths) {
      const name = path.replace(/^workflows\//, "").replace(/\.js$/, "");
      const raw = await this.client.fetchFile(this.ref, path);
      try {
        const meta = parseWorkflowMeta(raw);
        summaries.push({ name, description: meta.description });
      } catch {
        // A workflow file whose meta block can't be parsed is not listed; get_workflow will
        // still surface an error if it's requested directly.
      }
    }
    return summaries;
  }

  async getWorkflow(name: string): Promise<WorkflowContent> {
    let raw: string;
    try {
      raw = await this.client.fetchFile(this.ref, `workflows/${name}.js`);
    } catch (error) {
      if (error instanceof WorkflowError && error.code === "NOT_FOUND") {
        throw new WorkflowError("NOT_FOUND", `Workflow '${name}' was not found at ref '${this.ref}'.`);
      }
      throw error;
    }

    let meta: { description: string; whenToUse: string };
    try {
      meta = parseWorkflowMeta(raw);
    } catch (error) {
      throw new WorkflowError(
        "INTERNAL_ERROR",
        `Workflow '${name}' has an unparsable meta block: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return { description: meta.description, whenToUse: meta.whenToUse, content: raw };
  }
}
