/**
 * `npm run smoke` — spawns the built server (`dist/index.js`) over stdio, sends `initialize` then
 * `tools/list`, and asserts the expected tool names/annotations/schemas are present. Exercises the
 * real entrypoint end to end (not just the createServer() factory used by the unit tests).
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const mcpDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = join(mcpDir, "dist", "index.js");

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

function send(child: ReturnType<typeof spawn>, message: Record<string, unknown>): void {
  if (!child.stdin) {
    throw new Error("smoke: child process has no stdin (expected 'pipe')");
  }
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

async function main(): Promise<void> {
  const child = spawn(process.execPath, [distEntry], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  let buffer = "";
  const responses = new Map<number, JsonRpcResponse>();
  const waiters = new Map<number, (response: JsonRpcResponse) => void>();

  child.stdout.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) {
        continue;
      }
      const parsed = JSON.parse(line) as JsonRpcResponse;
      const waiter = waiters.get(parsed.id);
      if (waiter) {
        waiters.delete(parsed.id);
        waiter(parsed);
      } else {
        responses.set(parsed.id, parsed);
      }
    }
  });

  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });

  function waitFor(id: number): Promise<JsonRpcResponse> {
    const existing = responses.get(id);
    if (existing) {
      responses.delete(id);
      return Promise.resolve(existing);
    }
    return new Promise((resolve) => waiters.set(id, resolve));
  }

  const exitPromise = new Promise<number>((resolve) => child.on("exit", (code) => resolve(code ?? 0)));

  try {
    send(child, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "smoke-test", version: "0.0.0" },
      },
    });
    const initResponse = await Promise.race([waitFor(1), timeout(10_000, "initialize")]);
    assert(!initResponse.error, `initialize failed: ${JSON.stringify(initResponse.error)}`);

    send(child, { jsonrpc: "2.0", method: "notifications/initialized" });

    send(child, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    const listResponse = await Promise.race([waitFor(2), timeout(10_000, "tools/list")]);
    assert(!listResponse.error, `tools/list failed: ${JSON.stringify(listResponse.error)}`);

    const result = listResponse.result as { tools: Array<Record<string, unknown>> };
    const toolNames = result.tools.map((tool) => tool.name).sort();
    const expectedToolNames = [
      "get_agent",
      "get_rule",
      "get_skill",
      "get_workflow",
      "list",
      "list_agents",
      "list_workflows",
      "search",
    ];
    assert(
      JSON.stringify(toolNames) === JSON.stringify(expectedToolNames),
      `expected exactly ${JSON.stringify(expectedToolNames)}, got ${JSON.stringify(toolNames)}`
    );

    for (const tool of result.tools) {
      assert(tool.inputSchema, `tool '${tool.name}' is missing inputSchema`);
      assert(tool.outputSchema, `tool '${tool.name}' is missing outputSchema`);
      const annotations = tool.annotations as Record<string, unknown> | undefined;
      assert(annotations, `tool '${tool.name}' is missing annotations`);
      assert(annotations.readOnlyHint === true, `tool '${tool.name}' should have readOnlyHint: true`);
      assert(typeof annotations.openWorldHint === "boolean", `tool '${tool.name}' is missing openWorldHint`);
    }

    console.log(`smoke: OK — tools ${toolNames.join(", ")} all have inputSchema/outputSchema/annotations`);
  } finally {
    child.kill();
    await Promise.race([exitPromise, timeout(5_000, "process exit")]);
  }

  if (stderr.trim()) {
    console.error(`smoke: server stderr output:\n${stderr}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`smoke: ${message}`);
  }
}

function timeout(ms: number, label: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`smoke: timed out waiting for ${label}`)), ms);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
