/**
 * Automated safety + accuracy checks for a generated Starmee book.
 *
 * Two layers:
 *   1. validateStoryText  - pure, synchronous, no network. Unit tested.
 *   2. validateIllustration - asks a vision model what is actually drawn.
 *
 * A pass here does NOT release anything to the customer. Every book still
 * requires human approval; this only decides whether a book is good enough
 * to be shown to a reviewer, or should be regenerated first.
 */

import type { CreatureSpec } from "@/data/animals";
import { CREATURES, MONSTER_TRAITS } from "@/data/animals";

export interface ValidationFailure {
  code:
    | "animal_missing"
    | "animal_conflict"
    | "monster_present"
    | "name_missing"
    | "name_wrong"
    | "theme_mismatch"
    | "unsafe_content"
    | "text_image_mismatch"
    | "empty_story"
    | "vision_unavailable";
  detail: string;
}

export interface ValidationResult {
  ok: boolean;
  failures: ValidationFailure[];
  attempt: number;
  checkedAt: string;
}

/**
 * Words that should never appear in a children's story from Starmee.
 * Deliberately conservative: a false positive costs one regeneration,
 * a false negative could reach a child.
 */
const UNSAFE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(kill|killed|killing|murder|dead|death|died|dying)\b/i, "violence/death"],
  [/\b(blood|bloody|gore|wound|stab|shoot|gun|knife|weapon)\b/i, "graphic violence"],
  [/\b(hate|hateful|stupid|idiot|ugly|worthless)\b/i, "abusive language"],
  [/\b(sexy|sexual|nude|naked)\b/i, "sexual content"],
  [/\b(terrified|terrifying|horror|nightmare|screaming in fear)\b/i, "frightening content"],
  [/\b(drunk|alcohol|beer|wine|cigarette|smoking|drugs)\b/i, "adult substances"],
];

/** Generic words that mean the model dodged naming the actual animal. */
const VAGUE_CREATURE_WORDS = [
  "sea creature",
  "strange creature",
  "mysterious creature",
  "the creature",
  "a creature",
  "beast",
];

/** Mythical words that must not appear unless the customer chose a fantasy pick. */
const MONSTER_WORDS = [
  "monster",
  "dragon",
  "loch ness",
  "sea serpent",
  "serpent",
  "kraken",
  "beast",
];

function hasWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + escaped + "\\b", "i").test(haystack);
}

/**
 * Pure text validation. No network, no side effects - safe to unit test.
 * Returns an empty array when the story passes every check.
 */
export function validateStoryText(params: {
  storyText: string;
  creature: CreatureSpec | null;
  recipientName: string;
}): ValidationFailure[] {
  const { storyText, creature, recipientName } = params;
  const failures: ValidationFailure[] = [];
  const text = (storyText || "").trim();

  if (!text) {
    failures.push({ code: "empty_story", detail: "Story text is empty." });
    return failures;
  }

  // --- recipient name ---
  const name = (recipientName || "").trim();
  if (name && !hasWord(text, name)) {
    failures.push({
      code: "name_missing",
      detail: 'The recipient name "' + name + '" never appears in the story.',
    });
  }

  // --- child safety ---
  for (const [pattern, label] of UNSAFE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      failures.push({
        code: "unsafe_content",
        detail: label + ' - found "' + m[0] + '" in the story text.',
      });
    }
  }

  if (!creature) return failures;

  // --- the selected animal must actually be named ---
  const named =
    hasWord(text, creature.label) ||
    creature.aliases.some((a) => hasWord(text, a));
  if (!named) {
    failures.push({
      code: "animal_missing",
      detail: 'The story never names the selected animal (' + creature.label + ').',
    });
  }

  // --- vague dodges like "the sea creature" ---
  for (const vague of VAGUE_CREATURE_WORDS) {
    if (text.toLowerCase().includes(vague)) {
      failures.push({
        code: "animal_missing",
        detail: 'Story uses the vague phrase "' + vague + '" instead of naming the ' + creature.label + '.',
      });
      break;
    }
  }

  // --- a different animal must not take over ---
  for (const other of Object.values(CREATURES)) {
    if (other.id === creature.id) continue;
    if (hasWord(text, other.label)) {
      failures.push({
        code: "animal_conflict",
        detail: 'Story mentions "' + other.label + '" but the customer chose ' + creature.label + '.',
      });
    }
  }

  // --- no mythical creatures unless explicitly chosen ---
  if (creature.kind !== "fantasy") {
    for (const word of MONSTER_WORDS) {
      if (hasWord(text, word)) {
        failures.push({
          code: "monster_present",
          detail: 'Story contains "' + word + '" but no mythical theme was selected.',
        });
      }
    }
  }

  return failures;
}

/** Vision model used to check what was actually drawn. */
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

interface VisionVerdict {
  animals_visible: string[];
  monster_like: boolean;
  frightening: boolean;
  child_friendly: boolean;
  description: string;
}

/**
 * Asks a vision model what is actually in the illustration, then checks that
 * answer against the creature the customer selected. This is what catches a
 * "dolphin" that came back as a Loch Ness monster.
 */
export async function validateIllustration(params: {
  imageUrl: string;
  creature: CreatureSpec | null;
}): Promise<ValidationFailure[]> {
  const { imageUrl, creature } = params;
  const failures: ValidationFailure[] = [];
  if (!imageUrl) return failures;

  const { getOpenAI } = await import("@/lib/openai");
  let verdict: VisionVerdict;
  try {
    const openai = getOpenAI();
    const res = await openai.chat.completions.create({
      model: VISION_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Look at this children's storybook illustration. Reply with JSON only: " +
                '{"animals_visible": ["..."], "monster_like": bool, "frightening": bool, ' +
                '"child_friendly": bool, "description": "one sentence"}. ' +
                "List every animal or creature you can actually see, using common names " +
                "(for example dolphin, turtle, octopus, lion). Set monster_like to true if any " +
                "creature looks mythical, serpentine, dragon-like or like a Loch Ness monster.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) throw new Error("empty vision response");
    verdict = JSON.parse(raw) as VisionVerdict;
  } catch (err) {
    // Never silently pass. If we cannot see the image, a human must look.
    failures.push({
      code: "vision_unavailable",
      detail:
        "Could not automatically inspect the illustration: " +
        (err instanceof Error ? err.message : String(err)),
    });
    return failures;
  }

  const seen = (verdict.animals_visible || []).map((a) => String(a).toLowerCase());

  if (verdict.child_friendly === false || verdict.frightening === true) {
    failures.push({
      code: "unsafe_content",
      detail: "Illustration looks frightening or not child-friendly: " + verdict.description,
    });
  }

  if (!creature) return failures;

  const wanted = [creature.label.toLowerCase(), ...creature.aliases];
  const found = seen.some((a) => wanted.some((w) => a.includes(w) || w.includes(a)));
  if (!found) {
    failures.push({
      code: "animal_missing",
      detail:
        'Illustration does not show a ' + creature.label + '. Vision model saw: ' +
        (seen.length ? seen.join(', ') : 'nothing recognisable') + '.',
    });
  }

  for (const other of Object.values(CREATURES)) {
    if (other.id === creature.id) continue;
    if (seen.some((a) => a === other.label.toLowerCase() || a === other.id)) {
      failures.push({
        code: "animal_conflict",
        detail: 'Illustration shows a ' + other.label + ' instead of the selected ' + creature.label + '.',
      });
    }
  }

  if (verdict.monster_like && creature.kind !== "fantasy") {
    failures.push({
      code: "monster_present",
      detail: 'Illustration looks mythical/monstrous but ' + creature.label + ' is a real ' + creature.kind + '. ' + verdict.description,
    });
  }

  return failures;
}

/**
 * Hard cap on automatic regeneration. After this many attempts the book is
 * routed to a human as "needs_regeneration" rather than looping forever.
 */
export const MAX_GENERATION_ATTEMPTS = 2;

/**
 * Full validation for one generated version of a book.
 * Passing does NOT release anything - a human still has to approve.
 */
export async function validateBook(params: {
  storyText: string;
  imageUrls: string[];
  creature: CreatureSpec | null;
  recipientName: string;
  attempt: number;
}): Promise<ValidationResult> {
  const { storyText, imageUrls, creature, recipientName, attempt } = params;

  const failures: ValidationFailure[] = validateStoryText({
    storyText,
    creature,
    recipientName,
  });

  const images = (imageUrls || []).filter(Boolean);
  const imageResults = await Promise.all(
    images.map((url) => validateIllustration({ imageUrl: url, creature })),
  );
  for (const r of imageResults) failures.push(...r);

  return {
    ok: failures.length === 0,
    failures,
    attempt,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Turns validation failures into a corrective instruction appended to the
 * next generation attempt, so a retry actually fixes the specific problem.
 */
export function buildCorrectivePrompt(
  failures: ValidationFailure[],
  creature: CreatureSpec | null,
): string {
  if (!failures.length) return "";
  const lines = [
    "CORRECTION REQUIRED. The previous attempt was rejected by automated checks:",
  ];
  for (const f of failures) lines.push("- " + f.detail);
  if (creature) {
    lines.push(
      "You MUST clearly and unambiguously feature a " + creature.label + ". " +
        "It must show: " + creature.mustHave.join("; ") + ". " +
        "It must NOT have: " + creature.mustNotHave.join("; ") + ".",
    );
    if (creature.kind !== "fantasy") {
      lines.push("Do not add any mythical or monster features: " + MONSTER_TRAITS.join("; ") + ".");
    }
  }
  lines.push("Keep the story warm, gentle and appropriate for a young child.");
  return lines.join("\n");
}
