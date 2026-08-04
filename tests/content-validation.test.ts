import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CREATURES, resolveCreature, resolveCreatureFromAnswers, buildCreatureBlock } from "@/data/animals";
import { validateStoryText, buildCorrectivePrompt, MAX_GENERATION_ATTEMPTS } from "@/lib/content-validation";

const dolphin = CREATURES.dolphin;
const werewolf = CREATURES.werewolf;

const codes = (fs: { code: string }[]) => [...new Set(fs.map((f) => f.code))].sort();

describe("creature catalogue", () => {
  test("resolves plain and prefixed animal names", () => {
    assert.equal(resolveCreature("Dolphin")?.id, "dolphin");
    assert.equal(resolveCreature("A friendly dolphin")?.id, "dolphin");
    assert.equal(resolveCreature("Rudolph")?.id, "reindeer");
    assert.equal(resolveCreature("A ship's cat")?.id, "cat");
  });

  test("returns null for answers that are not creatures", () => {
    assert.equal(resolveCreature("Find treasure"), null);
    assert.equal(resolveCreature("Mars"), null);
    assert.equal(resolveCreature(""), null);
  });

  test("finds the creature inside a contextual-answers blob", () => {
    assert.equal(resolveCreatureFromAnswers({ q1: "Find treasure", q2: "Turtle" })?.id, "turtle");
  });

  test("every creature declares required and forbidden anatomy", () => {
    for (const [id, spec] of Object.entries(CREATURES)) {
      assert.ok(spec.mustHave.length > 0, id + " has no mustHave");
      assert.ok(spec.mustNotHave.length > 0, id + " has no mustNotHave");
    }
  });

  test("dolphin and turtle produce different, mutually exclusive prompts", () => {
    const d = buildCreatureBlock(CREATURES.dolphin);
    const t = buildCreatureBlock(CREATURES.turtle);
    assert.notEqual(d, t);
    assert.match(d, /dorsal fin/);
    assert.match(d, /a shell/);
    assert.match(t, /domed patterned shell/);
    assert.match(t, /a dorsal fin/);
  });
});

describe("story text validation", () => {
  test("passes a clean story", () => {
    const f = validateStoryText({ storyText: "Prisha met a friendly dolphin near the reef. The dolphin leapt and Prisha laughed.", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), []);
  });

  test("flags a story that never names the animal", () => {
    const f = validateStoryText({ storyText: "Prisha swam with her friend all day.", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), ["animal_missing"]);
  });

  test("flags vague creature language", () => {
    const f = validateStoryText({ storyText: "Prisha met a sea creature. The dolphin was happy.", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), ["animal_missing"]);
  });

  test("flags a different animal taking over", () => {
    const f = validateStoryText({ storyText: "Prisha met a dolphin and a Turtle.", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), ["animal_conflict"]);
  });

  test("flags monsters for a real animal", () => {
    const f = validateStoryText({ storyText: "Prisha met a dolphin, but a monster appeared.", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), ["monster_present"]);
  });

  test("does NOT flag spooky words for an explicitly chosen fantasy creature", () => {
    const f = validateStoryText({ storyText: "Leo hugged the cuddly werewolf at the party.", creature: werewolf, recipientName: "Leo" });
    assert.deepEqual(codes(f), []);
  });

  test("flags a missing recipient name", () => {
    const f = validateStoryText({ storyText: "A dolphin swam in the reef.", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), ["name_missing"]);
  });

  test("flags unsafe content", () => {
    const f = validateStoryText({ storyText: "Prisha and the dolphin saw a shark kill a fish.", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), ["unsafe_content"]);
  });

  test("flags an empty story", () => {
    const f = validateStoryText({ storyText: "   ", creature: dolphin, recipientName: "Prisha" });
    assert.deepEqual(codes(f), ["empty_story"]);
  });
});

describe("corrective prompt", () => {
  test("restates the required anatomy and caps attempts at 2", () => {
    const p = buildCorrectivePrompt([{ code: "animal_missing", detail: "no dolphin" }], dolphin);
    assert.match(p, /dorsal fin/);
    assert.match(p, /serpentine/);
    assert.equal(MAX_GENERATION_ATTEMPTS, 2);
  });

  test("returns empty string when there is nothing to correct", () => {
    assert.equal(buildCorrectivePrompt([], dolphin), "");
  });
});
