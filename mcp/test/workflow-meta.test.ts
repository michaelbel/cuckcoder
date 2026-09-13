import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWorkflowMeta } from "../src/workflow-meta.js";

test("parseWorkflowMeta reads name/description/whenToUse from a real workflow shape", () => {
  const source = [
    "export const meta = {",
    "  name: 'full-review',",
    "  description:",
    "    'Multi-lens review of a diff, branch, or PR: ' +",
    "    'runs correctness/security/performance checks in parallel.',",
    "  whenToUse:",
    "    'Full review before merging — code review, review this PR.',",
    "}",
    "",
    "const A = typeof args === 'string' ? JSON.parse(args) || {} : args || {}",
  ].join("\n");

  const meta = parseWorkflowMeta(source);
  assert.equal(meta.name, "full-review");
  assert.ok(meta.description.includes("Multi-lens review"));
  assert.ok(meta.whenToUse.includes("Full review before merging"));
});

test("parseWorkflowMeta tolerates a missing whenToUse field", () => {
  const source = ["export const meta = {", "  name: 'security-sweep',", "  description: 'A security sweep.',", "}", ""].join("\n");
  const meta = parseWorkflowMeta(source);
  assert.equal(meta.name, "security-sweep");
  assert.equal(meta.whenToUse, "");
});

test("parseWorkflowMeta does not execute the rest of the module (no ReferenceError on undeclared globals)", () => {
  const source = [
    "export const meta = {",
    "  name: 'x',",
    "  description: 'y',",
    "}",
    "",
    "const A = typeof args === 'string' ? JSON.parse(args) : args", // 'args' is undeclared here
    "await agent('this would throw if evaluated')", // 'agent' is undeclared here
  ].join("\n");

  assert.doesNotThrow(() => parseWorkflowMeta(source));
});

test("parseWorkflowMeta throws when no meta block is present", () => {
  assert.throws(() => parseWorkflowMeta("const x = 1;"));
});
