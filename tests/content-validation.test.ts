import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CREATURES, resolveCreature, resolveCreatureFromAnswers, buildCreatureBlock } from "@/data/animals";
import {
  validateStoryText,
  buildCorrectivePrompt,
  isBlockingFailure,
  MAX_GENERATION_ATTEMPTS,
  classifySeenAnimals,
  isThemeBackgroundCreature,
  isMonsterLikeBlocker,
  THEMES_WITH_BACKGROUND_CREATURES,
} from "@/lib/content-validation";

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

// Regression cover for the outage where a private storage bucket made every
// illustration unreadable to vision, which failed every book and burned a
// second full generation attempt on a problem retrying could never fix.
describe("advisory vs blocking failures", () => {
  test("vision_unavailable is advisory, not blocking", () => {
    assert.equal(
      isBlockingFailure({
        code: "vision_unavailable",
        detail: "400 Error while downloading file",
      }),
      false,
    );
  });

  test("real content problems stay blocking", () => {
    const codes = [
      "unsafe_content",
      "monster_present",
      "animal_missing",
      "theme_mismatch",
    ] as const;
    for (const code of codes) {
      assert.equal(
        isBlockingFailure({ code, detail: "x" }),
        true,
        code + " must still block",
      );
    }
  });

  test("a corrective prompt is not built from advisory failures alone", () => {
    const prompt = buildCorrectivePrompt(
      [{ code: "vision_unavailable", detail: "could not download" }],
      null,
    );
    assert.equal(prompt.includes("could not download"), false);
  });

  test("a corrective prompt still carries real content problems", () => {
    const prompt = buildCorrectivePrompt(
      [
        { code: "vision_unavailable", detail: "could not download" },
        { code: "monster_present", detail: "dolphin looks like a sea monster" },
      ],
      null,
    );
    assert.equal(prompt.includes("sea monster"), true);
    assert.equal(prompt.includes("could not download"), false);
  });
});

// ─── ValidationFailure shape ──────────────────────────────────────────────────

describe("ValidationFailure shape", () => {
  test("all known failure codes are accepted by the type", () => {
    const codes: Array<import("@/lib/content-validation").ValidationFailure["code"]> = [
      "animal_missing",
      "animal_conflict",
      "monster_present",
      "name_missing",
      "name_wrong",
      "theme_mismatch",
      "unsafe_content",
      "text_image_mismatch",
      "empty_story",
      "vision_unavailable",
    ];
    // If this compiles, the type union is correct.
    assert.ok(codes.length === 10);
  });

  test("a passing validateStoryText result has zero failures", () => {
    const f = validateStoryText({
      storyText: "Prisha splashed in the waves with a friendly dolphin.",
      creature: dolphin,
      recipientName: "Prisha",
    });
    assert.equal(f.length, 0);
  });

  test("multiple independent failures are all returned", () => {
    // Missing name, missing animal, unsafe content
    const f = validateStoryText({
      storyText: "The sea creature killed the fish.",
      creature: dolphin,
      recipientName: "Prisha",
    });
    // Should have at least: name_missing, animal_missing, unsafe_content
    const codeSet = new Set(f.map((x) => x.code));
    assert.ok(codeSet.has("name_missing"), "Should flag missing name");
    assert.ok(codeSet.has("animal_missing"), "Should flag missing animal");
    assert.ok(codeSet.has("unsafe_content"), "Should flag unsafe content");
  });
});

// ─── Page-level finding integration ──────────────────────────────────────────

describe("page-level findings (integration contract)", () => {
  test("validateStoryText returns findings with code and detail", () => {
    const findings = validateStoryText({
      storyText: "A monster appeared and killed everyone.",
      creature: dolphin,
      recipientName: "Prisha",
    });

    for (const finding of findings) {
      assert.ok(typeof finding.code === "string", "code must be a string");
      assert.ok(typeof finding.detail === "string", "detail must be a string");
      assert.ok(finding.detail.length > 0, "detail must be non-empty");
    }
  });

  test("findings can be serialised to JSON (for DB storage)", () => {
    const findings = validateStoryText({
      storyText: "   ",
      creature: null,
      recipientName: "",
    });

    const json = JSON.stringify(findings);
    const parsed = JSON.parse(json);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed[0].code, "empty_story");
  });
});

// ─── Companion-aware visual QA helpers (pure / deterministic) ─────────────────
//
// These tests cover the exported classification helpers that drive the
// companion-aware logic inside validateIllustration. They require no network
// and no mocking.

describe("isThemeBackgroundCreature (pure classifier)", () => {
  test("recognises alien variants as background creatures", () => {
    assert.equal(isThemeBackgroundCreature("alien", "space-adventure"), true);
    assert.equal(isThemeBackgroundCreature("aliens", "space-adventure"), true);
    assert.equal(isThemeBackgroundCreature("round alien", "space-adventure"), true);
    assert.equal(isThemeBackgroundCreature("extraterrestrial", "space-adventure"), true);
  });

  test("recognises glowing/floating creatures as background", () => {
    assert.equal(isThemeBackgroundCreature("glowing creature", "space-adventure"), true);
    assert.equal(isThemeBackgroundCreature("floating creatures", "space-adventure"), true);
  });

  test("recognises halloween and fairy-theme background characters", () => {
    assert.equal(isThemeBackgroundCreature("fairy", "fairy-garden"), true);
    assert.equal(isThemeBackgroundCreature("fairies", "fairy-garden"), true);
    assert.equal(isThemeBackgroundCreature("ghost", "halloween-adventure"), true);
    assert.equal(isThemeBackgroundCreature("witch", "halloween-adventure"), true);
  });

  test("does NOT classify real catalogue animals as background creatures", () => {
    assert.equal(isThemeBackgroundCreature("dolphin"), false);
    assert.equal(isThemeBackgroundCreature("turtle"), false);
    assert.equal(isThemeBackgroundCreature("octopus"), false);
    assert.equal(isThemeBackgroundCreature("lion"), false);
    assert.equal(isThemeBackgroundCreature("reindeer"), false);
  });
});

describe("classifySeenAnimals (pure classifier)", () => {
  const dolphin = CREATURES.dolphin;
  const reindeer = CREATURES.reindeer;

  test("companion present, no other animals → companionFound true, no conflicts", () => {
    const r = classifySeenAnimals(["dolphin"], dolphin);
    assert.equal(r.companionFound, true);
    assert.equal(r.conflicts.length, 0);
  });

  test("companion present alongside a background alien → not a conflict", () => {
    const r = classifySeenAnimals(["dolphin", "alien"], dolphin, {
      themeId: "space-adventure",
    });
    assert.equal(r.companionFound, true);
    assert.equal(r.conflicts.length, 0);
    assert.equal(r.permittedBackground.includes("alien"), true);
  });

  test("companion present alongside another real animal → classified as conflict (for reporting)", () => {
    // classifySeenAnimals still IDENTIFIES the conflict; it's validateIllustration
    // that decides whether to suppress it based on companionFound.
    const r = classifySeenAnimals(["dolphin", "turtle"], dolphin);
    assert.equal(r.companionFound, true);
    assert.equal(r.conflicts.length, 1);
    assert.equal(r.conflicts[0].id, "turtle");
  });

  test("companion absent, octopus visible → companionFound false, octopus in conflicts", () => {
    // This is the true-replacement scenario: reindeer absent, octopus visible.
    const r = classifySeenAnimals(["octopus"], reindeer);
    assert.equal(r.companionFound, false);
    assert.equal(r.conflicts.length, 1);
    assert.equal(r.conflicts[0].id, "octopus");
  });

  test("nothing seen → companionFound false, no conflicts", () => {
    const r = classifySeenAnimals([], dolphin);
    assert.equal(r.companionFound, false);
    assert.equal(r.conflicts.length, 0);
  });

  test("companion matched via alias", () => {
    // 'reindeer' aliases include 'rudolph'
    const r = classifySeenAnimals(["rudolph"], reindeer);
    assert.equal(r.companionFound, true);
    assert.equal(r.conflicts.length, 0);
  });
});

describe("isMonsterLikeBlocker (pure classifier)", () => {
  test("not a blocker when monster_like is false", () => {
    assert.equal(
      isMonsterLikeBlocker({ monsterLike: false, companionFound: false, companionKind: "animal" }),
      false,
    );
  });

  test("is a blocker for a real animal companion when monster_like and companion absent", () => {
    assert.equal(
      isMonsterLikeBlocker({ monsterLike: true, companionFound: false, companionKind: "animal" }),
      true,
    );
  });

  test("NOT a blocker for a real animal companion present on space-adventure theme", () => {
    // Space Adventure aliens look monster_like but the dolphin is present correctly.
    assert.equal(
      isMonsterLikeBlocker({
        monsterLike: true,
        companionFound: true,
        companionKind: "animal",
        themeId: "space-adventure",
        seen: ["dolphin", "alien"],
      }),
      false,
    );
  });

  test("NOT a blocker when companion present and scene description mentions glowing creatures", () => {
    assert.equal(
      isMonsterLikeBlocker({
        monsterLike: true,
        companionFound: true,
        companionKind: "animal",
        themeId: null,
        sceneDescription: "Child on an alien planet with glowing creatures floating around",
        seen: ["dolphin", "glowing creature"],
      }),
      false,
    );
  });

  test("IS a blocker for a real animal companion present on a non-exempt theme", () => {
    // dinosaur-discovery does not have background alien creatures
    assert.equal(
      isMonsterLikeBlocker({
        monsterLike: true,
        companionFound: true,
        companionKind: "animal",
        themeId: "dinosaur-discovery",
      }),
      true,
    );
  });

  test("fantasy companion is never a monster blocker (kind=fantasy)", () => {
    assert.equal(
      isMonsterLikeBlocker({ monsterLike: true, companionFound: false, companionKind: "fantasy" }),
      false,
    );
  });

  test("dinosaur companion is never a blocking monster (kind=dinosaur)", () => {
    assert.equal(
      isMonsterLikeBlocker({ monsterLike: true, companionFound: false, companionKind: "dinosaur" }),
      false,
    );
  });
});

describe("THEMES_WITH_BACKGROUND_CREATURES (catalogue)", () => {
  test("space-adventure is in the set", () => {
    assert.equal(THEMES_WITH_BACKGROUND_CREATURES.has("space-adventure"), true);
  });

  test("halloween-adventure is in the set", () => {
    assert.equal(THEMES_WITH_BACKGROUND_CREATURES.has("halloween-adventure"), true);
  });

  test("dinosaur-discovery permits scene-described dinosaur backgrounds", () => {
    assert.equal(THEMES_WITH_BACKGROUND_CREATURES.has("dinosaur-discovery"), true);
  });

  test("under-the-sea is NOT in the set", () => {
    assert.equal(THEMES_WITH_BACKGROUND_CREATURES.has("under-the-sea"), false);
  });
});

describe("companion-aware illustration validation (unit-level, pure helpers)", () => {
  // These tests exercise the interaction between classifySeenAnimals and
  // isMonsterLikeBlocker to verify the end-to-end decision logic without
  // needing a vision model or network.

  const reindeer = CREATURES.reindeer;
  const dolphin = CREATURES.dolphin;

  test("reindeer absent, octopus present → animal_missing + animal_conflict should both be raised", () => {
    const { companionFound, conflicts } = classifySeenAnimals(["octopus"], reindeer);
    // Both conditions that trigger the two failure codes must be true
    assert.equal(companionFound, false, "companion should not be found");
    assert.equal(conflicts.length, 1, "octopus should be in conflicts");
    assert.equal(conflicts[0].id, "octopus");
  });

  test("dolphin present + alien also seen on space-adventure → no conflict, no monster blocker", () => {
    const { companionFound, conflicts } = classifySeenAnimals(
      ["dolphin", "alien"],
      dolphin,
      { themeId: "space-adventure" },
    );
    const monsterBlocks = isMonsterLikeBlocker({
      monsterLike: true, // alien looks alien
      companionFound,
      companionKind: dolphin.kind,
      themeId: "space-adventure",
      seen: ["dolphin", "alien"],
    });
    assert.equal(companionFound, true, "dolphin should be found");
    assert.equal(conflicts.length, 0, "alien is not a catalogue conflict");
    assert.equal(monsterBlocks, false, "space-adventure alien should not be a monster blocker");
  });

  test("dolphin present + turtle also seen (background) → conflict identified but should not block", () => {
    // validateIllustration suppresses conflict when companionFound is true.
    // Here we verify the classification layer correctly separates them.
    const { companionFound, conflicts } = classifySeenAnimals(["dolphin", "turtle"], dolphin);
    assert.equal(companionFound, true);
    // conflicts has turtle but validateIllustration will skip it because companionFound=true
    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].id, "turtle");
  });

  test("glowing creature in non-theme scene with real animal absent → monster blocker active", () => {
    const { companionFound } = classifySeenAnimals(["alien"], dolphin);
    const monsterBlocks = isMonsterLikeBlocker({
      monsterLike: true,
      companionFound,
      companionKind: dolphin.kind,
      themeId: "under-the-sea", // not a background-creature theme
      sceneDescription: "child swimming underwater",
    });
    assert.equal(companionFound, false);
    assert.equal(monsterBlocks, true, "monster_like with absent companion on non-exempt theme should block");
  });
});
