import assert from "node:assert/strict";
import { test } from "node:test";
import { BundledSource } from "../src/source/bundled.js";
import { searchRulesAndSkills } from "../src/search.js";

test("searchRulesAndSkills finds a rule by content keyword", async () => {
  const results = await searchRulesAndSkills(new BundledSource("mcp-vtest"), "dispatch");
  assert.ok(results.some((r) => r.type === "rule" && r.name === "mvi"));
});

test("searchRulesAndSkills finds a skill by content keyword", async () => {
  const results = await searchRulesAndSkills(new BundledSource("mcp-vtest"), "ViewModel");
  assert.ok(results.some((r) => r.type === "skill"));
});

test("searchRulesAndSkills is case-insensitive", async () => {
  const lower = await searchRulesAndSkills(new BundledSource("mcp-vtest"), "dispatch");
  const upper = await searchRulesAndSkills(new BundledSource("mcp-vtest"), "DISPATCH");
  assert.deepEqual(
    lower.map((r) => `${r.type}:${r.name}`).sort(),
    upper.map((r) => `${r.type}:${r.name}`).sort()
  );
});

test("searchRulesAndSkills returns [] for a query matching nothing", async () => {
  const results = await searchRulesAndSkills(new BundledSource("mcp-vtest"), "xyzzy-nonexistent-term");
  assert.deepEqual(results, []);
});

test("searchRulesAndSkills snippets include the matched query text", async () => {
  const results = await searchRulesAndSkills(new BundledSource("mcp-vtest"), "dispatch");
  const mvi = results.find((r) => r.type === "rule" && r.name === "mvi");
  assert.ok(mvi);
  assert.ok(mvi!.snippet.toLowerCase().includes("dispatch"));
});
