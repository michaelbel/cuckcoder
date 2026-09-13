import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { BundledSource } from "../src/source/bundled.js";
import { createServer } from "../src/server.js";

async function connectedClient(source = new BundledSource("mcp-vtest")) {
  const server = createServer({ source });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, server };
}

test("the tool surface is exactly list, get_rule, get_skill, list_agents, get_agent, list_workflows, get_workflow, search (no run_skill)", async () => {
  const { client } = await connectedClient();
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, [
    "get_agent",
    "get_rule",
    "get_skill",
    "get_workflow",
    "list",
    "list_agents",
    "list_workflows",
    "search",
  ]);
});

test("every tool declares readOnlyHint, openWorldHint, inputSchema, and outputSchema", async () => {
  const { client } = await connectedClient();
  const { tools } = await client.listTools();
  for (const tool of tools) {
    assert.ok(tool.inputSchema, `${tool.name} missing inputSchema`);
    assert.ok(tool.outputSchema, `${tool.name} missing outputSchema`);
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} missing readOnlyHint`);
    assert.equal(typeof tool.annotations?.openWorldHint, "boolean", `${tool.name} missing openWorldHint`);
  }
});

test("bundled source reports openWorldHint: false (no network)", async () => {
  const { client } = await connectedClient(new BundledSource("mcp-vtest"));
  const { tools } = await client.listTools();
  for (const tool of tools) {
    assert.equal(tool.annotations?.openWorldHint, false);
  }
});

test("list returns structuredContent matching content, with the real rule/skill counts", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "list", arguments: {} });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { rules: string[]; skills: Array<{ name: string; description: string }>; source: { kind: string; ref: string } };
  assert.ok(structured.rules.includes("mvi"));
  assert.ok(!structured.rules.some((name) => name.includes("/")));
  assert.ok(structured.skills.some((skill) => skill.name === "create-feature-scaffold-screen"));
  assert.equal(structured.source.kind, "bundled");
  assert.ok(!structured.skills.some((skill) => skill.name.includes("/SKILL")));

  const textContent = (result.content as Array<{ type: string; text: string }>)[0].text;
  for (const rule of structured.rules) {
    assert.ok(textContent.includes(rule));
  }
});

test("get_skill('create-feature-scaffold-screen') reads the create-feature-scaffold-screen skill", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_skill", arguments: { name: "create-feature-scaffold-screen" } });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { name: string; content: string };
  assert.equal(structured.name, "create-feature-scaffold-screen");
  assert.ok(structured.content.includes("{Feature}ViewModel"));
});

test("get_skill accepts the deprecated 'create-feature-scaffold-screen/SKILL' alias and returns identical content", async () => {
  const { client } = await connectedClient();
  const canonical = await client.callTool({ name: "get_skill", arguments: { name: "create-feature-scaffold-screen" } });
  const deprecated = await client.callTool({ name: "get_skill", arguments: { name: "create-feature-scaffold-screen/SKILL" } });
  assert.deepEqual(deprecated.structuredContent, canonical.structuredContent);
});

test("get_rule('mvi') reads the rule content", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_rule", arguments: { name: "mvi" } });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { name: string; content: string };
  assert.equal(structured.name, "mvi");
  assert.ok(structured.content.includes("dispatch"));
});

test("get_skill returns NOT_FOUND for an unknown skill", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_skill", arguments: { name: "does-not-exist" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "NOT_FOUND");
});

test("get_skill rejects path traversal with INVALID_NAME", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_skill", arguments: { name: "../../etc/passwd" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "INVALID_NAME");
});

test("get_rule rejects path traversal with INVALID_NAME", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_rule", arguments: { name: "../../etc/passwd" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "INVALID_NAME");
});

test("get_rule returns NOT_FOUND for an unknown but validly-shaped rule name", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_rule", arguments: { name: "does-not-exist" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "NOT_FOUND");
});

test("get_rule rejects deprecated uppercase rule names with INVALID_NAME", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_rule", arguments: { name: "MVI_RULES" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "INVALID_NAME");
});

test("list_agents returns structuredContent with the real agent count", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "list_agents", arguments: {} });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { agents: Array<{ name: string; description: string }> };
  assert.ok(structured.agents.some((agent) => agent.name === "kotlin-engineer"));
  assert.ok(structured.agents.every((agent) => agent.description.length > 0));
});

test("get_agent('kotlin-engineer') reads the kotlin-engineer agent", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_agent", arguments: { name: "kotlin-engineer" } });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { name: string; description: string; content: string };
  assert.equal(structured.name, "kotlin-engineer");
  assert.ok(structured.content.length > 0);
});

test("get_agent returns NOT_FOUND for an unknown agent", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_agent", arguments: { name: "does-not-exist" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "NOT_FOUND");
});

test("get_agent rejects path traversal with INVALID_NAME", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_agent", arguments: { name: "../../etc/passwd" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "INVALID_NAME");
});

test("list_workflows returns structuredContent with the real workflow count", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "list_workflows", arguments: {} });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { workflows: Array<{ name: string; description: string }> };
  assert.ok(structured.workflows.some((workflow) => workflow.name === "full-review"));
  assert.ok(structured.workflows.every((workflow) => workflow.description.length > 0));
});

test("get_workflow('full-review') reads the full-review workflow", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_workflow", arguments: { name: "full-review" } });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { name: string; description: string; whenToUse: string; content: string };
  assert.equal(structured.name, "full-review");
  assert.ok(structured.whenToUse.length > 0);
  assert.ok(structured.content.includes("export const meta"));
});

test("get_workflow returns NOT_FOUND for an unknown workflow", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_workflow", arguments: { name: "does-not-exist" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "NOT_FOUND");
});

test("get_workflow rejects path traversal with INVALID_NAME", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "get_workflow", arguments: { name: "../../etc/passwd" } });
  assert.equal(result.isError, true);
  const text = (result.content as Array<{ type: string; text: string }>)[0].text;
  const payload = JSON.parse(text);
  assert.equal(payload.code, "INVALID_NAME");
});

test("search('dispatch') finds the mvi rule", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "search", arguments: { query: "dispatch" } });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { results: Array<{ type: string; name: string; snippet: string }> };
  assert.ok(structured.results.some((r) => r.type === "rule" && r.name === "mvi"));
});

test("search returns an empty result set for a query matching nothing", async () => {
  const { client } = await connectedClient();
  const result = await client.callTool({ name: "search", arguments: { query: "xyzzy-nonexistent-term" } });
  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as { results: unknown[] };
  assert.deepEqual(structured.results, []);
});
