/**
 * Copies the repository's `rules/`, `skills/`, `agents/`, and `workflows/` directories into
 * `mcp/assets/` so they can be embedded in the published npm package (see `package.json#files`).
 * Run before every build/dev/test/pack — deterministic and idempotent, so the packaged snapshot
 * always matches the commit that was built.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mcpDir = join(scriptDir, "..");
const repoRoot = join(mcpDir, "..");
const assetsDir = join(mcpDir, "assets");

function copyDir(name: "rules" | "skills" | "agents" | "workflows"): void {
  const src = join(repoRoot, name);
  const dest = join(assetsDir, name);

  if (!existsSync(src)) {
    throw new Error(`copy-assets: expected '${src}' to exist.`);
  }

  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

mkdirSync(assetsDir, { recursive: true });
copyDir("rules");
copyDir("skills");
copyDir("agents");
copyDir("workflows");

const ruleCount = countMarkdownFiles(join(assetsDir, "rules"));
const skillCount = readdirSync(join(assetsDir, "skills")).length;
const agentCount = readdirSync(join(assetsDir, "agents")).filter((entry) => entry.endsWith(".md")).length;
const workflowCount = readdirSync(join(assetsDir, "workflows")).filter((entry) => entry.endsWith(".js")).length;

function countMarkdownFiles(dir: string): number {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countMarkdownFiles(join(dir, entry.name));
    } else if (entry.name.endsWith(".md")) {
      count += 1;
    }
  }
  return count;
}

console.error(
  `copy-assets: bundled ${ruleCount} rule(s), ${skillCount} skill(s), ${agentCount} agent(s), and ` +
    `${workflowCount} workflow(s) into ${assetsDir}`
);
