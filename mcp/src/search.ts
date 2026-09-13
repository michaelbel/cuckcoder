import type { WorkflowSource } from "./source/types.js";

export interface SearchResult {
  type: "rule" | "skill";
  name: string;
  snippet: string;
}

const SNIPPET_RADIUS = 80;

function buildSnippet(content: string, query: string): string {
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return content.slice(0, SNIPPET_RADIUS * 2).trim();
  }
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(content.length, index + query.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

/**
 * Rough case-insensitive keyword search across every rule and skill's full content (and, for
 * skills, their description). Fetches every item from `source` — cheap for the bundled source
 * (local reads), and no worse than a caller looping `get_rule`/`get_skill` themselves for the
 * GitHub source, which caches/dedupes per-file fetches already.
 */
export async function searchRulesAndSkills(source: WorkflowSource, query: string): Promise<SearchResult[]> {
  const needle = query.toLowerCase();
  const results: SearchResult[] = [];

  const [ruleNames, skills] = await Promise.all([source.listRules(), source.listSkills()]);

  await Promise.all(
    ruleNames.map(async (name) => {
      const content = await source.getRule(name);
      if (content.toLowerCase().includes(needle) || name.toLowerCase().includes(needle)) {
        results.push({ type: "rule", name, snippet: buildSnippet(content, query) });
      }
    })
  );

  await Promise.all(
    skills.map(async (skill) => {
      const { description, content } = await source.getSkill(skill.name);
      const haystack = `${skill.name}\n${description}\n${content}`;
      if (haystack.toLowerCase().includes(needle)) {
        results.push({ type: "skill", name: skill.name, snippet: buildSnippet(`${description}\n\n${content}`, query) });
      }
    })
  );

  results.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type)));
  return results;
}
