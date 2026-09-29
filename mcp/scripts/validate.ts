/**
 * `npm run validate` — repo-wide static checks. Prints one line per failure with the offending
 * file and reason, and exits non-zero if anything fails. Each check enforces a current repository
 * contract or prevents a previously fixed regression.
 */
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../src/frontmatter.js";

const mcpDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(mcpDir, "..");

interface Failure {
  file: string;
  reason: string;
}

const failures: Failure[] = [];

function fail(file: string, reason: string): void {
  failures.push({ file: relative(repoRoot, file), reason });
}

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

// ─── 1. Skill frontmatter: valid, name == directory, description present/bounded/routing-shaped ──

const skillsDir = join(repoRoot, "skills");
const skillDirs = readdirSync(skillsDir).filter((entry) => lstatSync(join(skillsDir, entry)).isDirectory());

const MAX_DESCRIPTION_LENGTH = 1024;

for (const dir of skillDirs) {
  const skillMdPath = join(skillsDir, dir, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    fail(skillMdPath, "missing SKILL.md");
    continue;
  }

  const raw = readText(skillMdPath);
  const { fields } = parseFrontmatter(raw);

  if (!raw.startsWith("---\n")) {
    fail(skillMdPath, "does not start with a '---' frontmatter block");
    continue;
  }

  if (!fields.name) {
    fail(skillMdPath, "frontmatter is missing 'name'");
  } else if (fields.name !== dir) {
    fail(skillMdPath, `frontmatter 'name: ${fields.name}' does not match directory '${dir}'`);
  }

  const description = fields.description ?? "";
  if (!description) {
    fail(skillMdPath, "frontmatter is missing a non-empty 'description'");
    continue;
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    fail(skillMdPath, `description is ${description.length} chars, exceeds the ${MAX_DESCRIPTION_LENGTH} limit`);
  }

  // Skills carrying a `license:` field are vendored from a third-party skill pack (Google,
  // chrisbanes, etc.) and keep that vendor's own description conventions — only skills authored
  // in this repo are held to the "Use when ..." routing-shape requirement.
  if (!fields.license) {
    const lower = description.toLowerCase();
    if (!lower.includes("use when")) {
      fail(skillMdPath, "description does not explain when to use the skill (expected 'Use when ...')");
    }
  }
}

// ─── 2. Rules are flat and use lowercase kebab-case public identifiers ───────────────────────

const rulesDir = join(repoRoot, "rules");
const ruleNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const ruleEntries = readdirSync(rulesDir, { withFileTypes: true });

for (const entry of ruleEntries) {
  const rulePath = join(rulesDir, entry.name);
  if (entry.isDirectory()) {
    fail(rulePath, "rules must be stored directly in rules/, without intermediate directories");
  } else if (!ruleNamePattern.test(entry.name)) {
    fail(rulePath, "rule filename must be lowercase kebab-case and end in .md");
  }
}

// ─── 3. AGENTS.md @rules/... imports all resolve ──────────────────────────────────────────────

const agentsMdPath = join(repoRoot, "AGENTS.md");
const agentsMd = readText(agentsMdPath);
const importPattern = /^@(rules\/[^\s]+\.md)$/gm;
let importMatch: RegExpExecArray | null;
let foundAnyImport = false;
while ((importMatch = importPattern.exec(agentsMd)) !== null) {
  foundAnyImport = true;
  const importedPath = join(repoRoot, importMatch[1]);
  if (!existsSync(importedPath)) {
    fail(agentsMdPath, `imports '@${importMatch[1]}' but that file does not exist`);
  }
}
if (!foundAnyImport) {
  fail(agentsMdPath, "no '@rules/...' imports found — expected at least one");
}

// ─── 4. package.json version has a single source of truth (no hardcoded literal in server code) ──

const packageJsonPath = join(mcpDir, "package.json");
const packageJson = JSON.parse(readText(packageJsonPath)) as { version: string };

for (const relativeSrc of ["src/server.ts", "src/index.ts"]) {
  const srcPath = join(mcpDir, relativeSrc);
  const srcText = readText(srcPath);
  const hardcodedVersionPattern = /version:\s*["'`]\d+\.\d+\.\d+["'`]/;
  if (hardcodedVersionPattern.test(srcText)) {
    fail(srcPath, "contains a hardcoded semver literal for 'version' instead of reading it from package.json");
  }
}

// ─── 5. No execSync / run_skill left in mcp/src ───────────────────────────────────────────────

function listFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const srcDir = join(mcpDir, "src");
for (const file of listFilesRecursive(srcDir)) {
  if (!file.endsWith(".ts")) {
    continue;
  }
  const text = readText(file);
  if (text.includes("execSync")) {
    fail(file, "contains 'execSync' — arbitrary shell execution must not exist in this server");
  }
  if (/"run_skill"/.test(text)) {
    fail(file, "still references the removed 'run_skill' tool");
  }
}

// ─── 6. Rule/skill drift regressions ─────────────────────────────────────────────────────────

const newScreenSkill = readText(join(skillsDir, "create-feature-scaffold-screen", "SKILL.md"));
if (newScreenSkill.includes("viewModelScope")) {
  fail(join(skillsDir, "create-feature-scaffold-screen", "SKILL.md"), "regression: 'viewModelScope' reintroduced (mvi forbids ViewModel helper coroutine scopes)");
}
if (newScreenSkill.includes("private fun loadData")) {
  fail(join(skillsDir, "create-feature-scaffold-screen", "SKILL.md"), "regression: private ViewModel helper function reintroduced (mvi only allows dispatch/catch)");
}

const newDataLayerSkill = readText(join(skillsDir, "create-data-layer", "SKILL.md"));
if (newDataLayerSkill.includes("@PrimaryKey")) {
  fail(join(skillsDir, "create-data-layer", "SKILL.md"), "regression: '@PrimaryKey' reintroduced (room requires @Entity(primaryKeys = [...]))");
}
if (/database\.withTransaction \{\s*\n\s*\{feature\}Dao\.upsert/.test(newDataLayerSkill)) {
  fail(join(skillsDir, "create-data-layer", "SKILL.md"), "regression: single DAO call wrapped in withTransaction again (room forbids this)");
}
if (/suspend fun select\(id: String\): \{Feature\}Entity\s*$/m.test(newDataLayerSkill)) {
  fail(join(skillsDir, "create-data-layer", "SKILL.md"), "regression: 'select' returns non-null again (room naming convention reserves 'select' for the nullable form)");
}

const newAlertDialogSkill = readText(join(skillsDir, "create-feature-alert-dialog", "SKILL.md"));
if (/\)\s*=\s*when\s*\{/.test(newAlertDialogSkill)) {
  fail(join(skillsDir, "create-feature-alert-dialog", "SKILL.md"), "regression: expression-body function reintroduced (kotlin requires block bodies with explicit return)");
}

const newBottomSheetSkill = readText(join(skillsDir, "create-feature-bottom-sheet", "SKILL.md"));
if (/\}\n\s*\n\s*item \{/.test(newBottomSheetSkill)) {
  fail(join(skillsDir, "create-feature-bottom-sheet", "SKILL.md"), "regression: blank line reintroduced between adjacent item {} blocks (lazylist forbids this)");
}
if (newBottomSheetSkill.includes("height(0.dp)")) {
  fail(join(skillsDir, "create-feature-bottom-sheet", "SKILL.md"), "regression: zero-height Spacer reintroduced");
}

// ─── 7. README's tool table matches the tools actually registered in server.ts ────────────────

const readmePath = join(repoRoot, "README.md");
const readmeText = readText(readmePath);
const serverTsText = readText(join(mcpDir, "src", "server.ts"));

const registeredTools = [...serverTsText.matchAll(/server\.registerTool\(\s*\n?\s*"([a-z_]+)"/g)].map((m) => m[1]);
if (registeredTools.length === 0) {
  fail(join(mcpDir, "src", "server.ts"), "no tools found via 'server.registerTool(\"...\"' — validate script may be out of date");
}

for (const toolName of registeredTools) {
  if (!readmeText.includes(`\`${toolName}\``)) {
    fail(readmePath, `README does not mention the registered tool '${toolName}'`);
  }
}

if (/\|\s*`run_skill`\s*\|/.test(readmeText)) {
  fail(readmePath, "README's tool table still lists the removed 'run_skill' tool");
}

// ─── 8. README's skill list and summary count match skills/ on disk ───────────────────────────

const skillsSectionMatch = readmeText.match(/## Скиллы\n([\s\S]*?)\n## /);
if (!skillsSectionMatch) {
  fail(readmePath, "could not find a '## Скиллы' section followed by another '## ' heading");
} else {
  const skillsSection = skillsSectionMatch[1];
  const listedSkills = [...skillsSection.matchAll(/^- `([a-z0-9-]+)` — /gm)].map((m) => m[1]);
  const listedSet = new Set(listedSkills);
  const diskSet = new Set(skillDirs);

  for (const name of skillDirs) {
    if (!listedSet.has(name)) {
      fail(readmePath, `'## Скиллы' section does not list skill '${name}' (present in skills/)`);
    }
  }
  for (const name of listedSkills) {
    if (!diskSet.has(name)) {
      fail(readmePath, `'## Скиллы' section lists '${name}' but no matching directory exists in skills/`);
    }
  }

  const summaryRowMatch = readmeText.match(/\|\s*\[Скиллы\]\(#скиллы\)\s*\|\s*`skills\/`\s*\|\s*(\d+)\s*\|/);
  if (!summaryRowMatch) {
    fail(readmePath, "could not find the skills row in the harness summary table");
  } else if (Number(summaryRowMatch[1]) !== skillDirs.length) {
    fail(readmePath, `harness summary table says ${summaryRowMatch[1]} skills, but skills/ has ${skillDirs.length}`);
  }
}

// ─── 9. README's agent table and summary count match agents/ on disk ─────────────────────────

const agentsDir = join(repoRoot, "agents");
const agentFiles = readdirSync(agentsDir).filter((entry) => entry.endsWith(".md"));
const agentNames = agentFiles.map((entry) => entry.slice(0, -".md".length));

const agentsSectionMatch = readmeText.match(/## Агенты\n([\s\S]*?)\n## /);
if (!agentsSectionMatch) {
  fail(readmePath, "could not find an '## Агенты' section followed by another '## ' heading");
} else {
  const agentsSection = agentsSectionMatch[1];
  const listedAgents = [...agentsSection.matchAll(/^\|\s*`([a-z0-9-]+)`/gm)].map((m) => m[1]);
  const listedSet = new Set(listedAgents);
  const diskSet = new Set(agentNames);

  for (const name of agentNames) {
    if (!listedSet.has(name)) {
      fail(readmePath, `'## Агенты' table does not list agent '${name}' (present in agents/)`);
    }
  }
  for (const name of listedAgents) {
    if (!diskSet.has(name)) {
      fail(readmePath, `'## Агенты' table lists '${name}' but no matching file exists in agents/`);
    }
  }

  const summaryRowMatch = readmeText.match(/\|\s*\[Агенты\]\(#агенты\)\s*\|\s*`agents\/`\s*\|\s*(\d+)\s*\|/);
  if (!summaryRowMatch) {
    fail(readmePath, "could not find the agents row in the harness summary table");
  } else if (Number(summaryRowMatch[1]) !== agentNames.length) {
    fail(readmePath, `harness summary table says ${summaryRowMatch[1]} agents, but agents/ has ${agentNames.length}`);
  }
}

// ─── report ─────────────────────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error(`validate: ${failures.length} check(s) failed\n`);
  for (const failure of failures) {
    console.error(`  ${failure.file}: ${failure.reason}`);
  }
  process.exit(1);
}

console.log(`validate: all checks passed (${skillDirs.length} skills, package.json version ${packageJson.version})`);
