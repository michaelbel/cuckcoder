import assert from "node:assert/strict";
import { test } from "node:test";
import { GithubSource } from "../src/source/github-source.js";

test("GithubSource.listRules() exposes only flat rule basenames", async () => {
  const tree = {
    tree: [
      { path: "rules/mvi.md", type: "blob" },
      { path: "rules/git.md", type: "blob" },
      { path: "rules/android/LEGACY_RULES.md", type: "blob" },
      { path: "rules/MVI_RULES.md", type: "blob" },
      { path: "rules/lowercase_rule.md", type: "blob" },
      { path: "rules/README.txt", type: "blob" },
      { path: "skills/example/SKILL.md", type: "blob" },
    ],
  };
  const fetchImpl: typeof fetch = async () => new Response(JSON.stringify(tree), { status: 200 });
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  assert.deepEqual(await source.listRules(), ["git", "mvi"]);
});

test("GithubSource.getRule() reads a flat rules/<name>.md path", async () => {
  let requestedUrl = "";
  const fetchImpl: typeof fetch = async (input) => {
    requestedUrl = String(input);
    return new Response("# MVI", { status: 200 });
  };
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  assert.equal(await source.getRule("mvi"), "# MVI");
  assert.ok(requestedUrl.endsWith("/mcp-vtest/rules/mvi.md"));
});

test("GithubSource.listAgents() reads agents/<name>.md frontmatter descriptions", async () => {
  const tree = {
    tree: [
      { path: "agents/kotlin-engineer.md", type: "blob" },
      { path: "agents/not-an-agent.txt", type: "blob" },
      { path: "skills/example/SKILL.md", type: "blob" },
    ],
  };
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("git/trees/mcp-vtest?recursive=1")) {
      return new Response(JSON.stringify(tree), { status: 200 });
    }
    return new Response("---\ndescription: Kotlin engineer.\n---\nbody", { status: 200 });
  };
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  const agents = await source.listAgents();
  assert.deepEqual(agents, [{ name: "kotlin-engineer", description: "Kotlin engineer." }]);
});

test("GithubSource.getAgent() reads a flat agents/<name>.md path", async () => {
  let requestedUrl = "";
  const fetchImpl: typeof fetch = async (input) => {
    requestedUrl = String(input);
    return new Response("---\ndescription: Kotlin engineer.\ntools: Read, Write\n---\nbody", { status: 200 });
  };
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  const agent = await source.getAgent("kotlin-engineer");
  assert.equal(agent.description, "Kotlin engineer.");
  assert.equal(agent.tools, "Read, Write");
  assert.equal(agent.content, "body");
  assert.ok(requestedUrl.endsWith("/mcp-vtest/agents/kotlin-engineer.md"));
});

test("GithubSource.listWorkflows() reads workflows/<name>.js meta blocks", async () => {
  const tree = { tree: [{ path: "workflows/full-review.js", type: "blob" }] };
  const workflowSource = "export const meta = {\n  name: 'full-review',\n  description: 'Reviews things.',\n}\n";
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("git/trees/mcp-vtest?recursive=1")) {
      return new Response(JSON.stringify(tree), { status: 200 });
    }
    return new Response(workflowSource, { status: 200 });
  };
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  const workflows = await source.listWorkflows();
  assert.deepEqual(workflows, [{ name: "full-review", description: "Reviews things." }]);
});

test("GithubSource.getWorkflow() reads a flat workflows/<name>.js path", async () => {
  let requestedUrl = "";
  const workflowSource = "export const meta = {\n  name: 'full-review',\n  description: 'Reviews things.',\n  whenToUse: 'Before merging.',\n}\n";
  const fetchImpl: typeof fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(workflowSource, { status: 200 });
  };
  const source = new GithubSource("mcp-vtest", undefined, fetchImpl);

  const workflow = await source.getWorkflow("full-review");
  assert.equal(workflow.description, "Reviews things.");
  assert.equal(workflow.whenToUse, "Before merging.");
  assert.equal(workflow.content, workflowSource);
  assert.ok(requestedUrl.endsWith("/mcp-vtest/workflows/full-review.js"));
});
