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
  /** Null means the finding applies to the whole book. */
  pageNumber?: number | null;
  severity?: "minor" | "major" | "blocker";
  source?: "text" | "image" | "both";
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

/**
 * Theme IDs whose scene descriptions routinely include non-catalogue background
 * creatures (e.g. aliens, glowing floaters). A companion animal being visible
 * alongside these is correct behaviour, not a conflict. Also, a monster_like
 * verdict from vision does NOT mean the companion was drawn as a monster -
 * it may just mean an alien or fantasy creature is in the background.
 */
export const THEME_BACKGROUND_CREATURE_WORDS: Record<string, string[]> = {
  "space-adventure": [
    "alien",
    "extraterrestrial",
    "glowing creature",
    "floating creature",
    "purple creature",
  ],
  "dinosaur-discovery": ["dinosaur"],
  "fairy-garden": ["fairy", "sprite", "gnome"],
  "halloween-adventure": [
    "ghost",
    "witch",
    "vampire",
    "werewolf",
    "pumpkin creature",
    "jack-o-lantern",
    "jack-o'-lantern",
  ],
  "christmas-magic": ["elf"],
};

export const THEMES_WITH_BACKGROUND_CREATURES = new Set(
  Object.keys(THEME_BACKGROUND_CREATURE_WORDS),
);

function hasWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("\\b" + escaped + "\\b", "i").test(haystack);
}

// ─── Pure classification helpers (exported for deterministic unit tests) ──────

/**
 * Returns true when the vision-reported animal name looks like a theme
 * background character (alien, fairy, etc.) rather than a real catalogue animal.
 *
 * This is a pure string test - no network, no side-effects.
 */
export function isThemeBackgroundCreature(
  animalName: string,
  themeId?: string | null,
  sceneDescription?: string | null,
): boolean {
  const lower = animalName.toLowerCase().trim();
  if (!lower) return false;
  const allowed = themeId
    ? (THEME_BACKGROUND_CREATURE_WORDS[themeId] ?? [])
    : [];
  if (
    allowed.some(
      (word) => lower === word || lower.includes(word) || word.includes(lower),
    )
  ) {
    return true;
  }
  const scene = sceneDescription?.toLowerCase() ?? "";
  return Boolean(
    scene &&
      (scene.includes(lower) ||
        allowed.some((word) => scene.includes(word) && lower.includes(word))),
  );
}

function scenePermitsCatalogueCreature(
  spec: CreatureSpec,
  sceneDescription?: string | null,
): boolean {
  const scene = sceneDescription?.toLowerCase() ?? "";
  if (!scene) return false;
  if (
    [spec.id, spec.label, ...spec.aliases].some((term) =>
      scene.includes(term.toLowerCase()),
    )
  ) {
    return true;
  }
  return spec.kind === "dinosaur" && /\bdinosaurs?\b/.test(scene);
}

/**
 * Given the list of animal names reported by the vision model and the selected
 * creature, classify them into three buckets:
 *
 *  - companionFound : the selected companion creature was recognised
 *  - conflicts      : other real catalogue animals that could be replacements
 *  - backgroundOnly : names that match no catalogue entry (aliens, fairies …)
 *
 * This is a pure function - no network, no side-effects.
 */
export function classifySeenAnimals(
  seen: string[],
  creature: CreatureSpec,
  context: {
    themeId?: string | null;
    sceneDescription?: string | null;
  } = {},
): {
  companionFound: boolean;
  conflicts: CreatureSpec[];
  permittedBackground: string[];
  unclassified: string[];
} {
  const normalised = seen.map((value) => value.toLowerCase().trim());
  const wanted = [
    creature.id,
    creature.label.toLowerCase(),
    ...creature.aliases.map((a) => a.toLowerCase()),
  ];
  const companionFound = normalised.some((a) =>
    wanted.some((w) => a.includes(w) || w.includes(a)),
  );

  const conflicts: CreatureSpec[] = [];
  const permittedBackground: string[] = [];
  const unclassified: string[] = [];

  for (const a of normalised) {
    // Skip the selected companion itself
    const isCompanion = wanted.some((w) => a.includes(w) || w.includes(a));
    if (isCompanion) continue;

    // Is it a known catalogue animal?
    const match = Object.values(CREATURES).find(
      (spec) =>
        spec.id !== creature.id &&
        (a === spec.label.toLowerCase() || a === spec.id),
    );
    if (match) {
      if (
        companionFound &&
        scenePermitsCatalogueCreature(match, context.sceneDescription)
      ) {
        permittedBackground.push(a);
      } else {
        conflicts.push(match);
      }
    } else if (
      isThemeBackgroundCreature(
        a,
        context.themeId,
        context.sceneDescription,
      )
    ) {
      permittedBackground.push(a);
    } else {
      unclassified.push(a);
    }
  }

  return { companionFound, conflicts, permittedBackground, unclassified };
}

/**
 * Decides whether a monster_like verdict from the vision model should be
 * treated as a blocker given the theme and companion visibility context.
 *
 * Returns false (not a blocker) when the monster-like appearance is explained
 * by expected background creatures in the theme (e.g. Space Adventure aliens).
 *
 * This is a pure function - exported for deterministic unit tests.
 */
export function isMonsterLikeBlocker(params: {
  monsterLike: boolean;
  companionFound: boolean;
  companionKind: CreatureSpec["kind"];
  themeId?: string | null;
  sceneDescription?: string | null;
  seen?: string[];
}): boolean {
  const {
    monsterLike,
    companionFound,
    companionKind,
    themeId,
    sceneDescription,
    seen = [],
  } = params;

  if (!monsterLike) return false;

  // Fantasy companions are allowed to look fantastical
  if (companionKind === "fantasy") return false;

  // Dinosaur companions get a minor advisory, never a full blocker
  if (companionKind === "dinosaur") return false;

  // For real animals: if the companion WAS correctly drawn AND the theme
  // routinely features alien/fantasy background creatures, then monster_like
  // is almost certainly describing those background characters, not the companion.
  if (
    companionFound &&
    themeId &&
    seen.some((name) =>
      isThemeBackgroundCreature(name, themeId, sceneDescription),
    )
  ) {
    return false;
  }

  // Check scene description for explicit mentions of alien/glowing creatures
  if (companionFound && sceneDescription) {
    const lower = sceneDescription.toLowerCase();
    const permittedTerms = themeId
      ? (THEME_BACKGROUND_CREATURE_WORDS[themeId] ?? [])
      : [];
    if (permittedTerms.some((term) => lower.includes(term))) {
      return false;
    }
  }

  return true;
}

// ─── Text validation ──────────────────────────────────────────────────────────

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

// ─── Illustration validation ──────────────────────────────────────────────────

/** Vision model used to check what was actually drawn. */
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

interface VisionVerdict {
  animals_visible: string[];
  monster_like: boolean;
  frightening: boolean;
  child_friendly: boolean;
  matches_theme: boolean;
  description: string;
}

/**
 * Asks a vision model what is actually in the illustration, then checks that
 * answer against the creature the customer selected. This is what catches a
 * "dolphin" that came back as a Loch Ness monster.
 *
 * Optional `themeId` and `sceneDescription` improve companion-aware decisions:
 *  - Space Adventure aliens / glowing creatures are theme-permitted and must
 *    not raise monster_present or animal_conflict when the companion is present.
 *  - Any catalogue animal that is also visible is only a conflict when the
 *    selected companion itself is absent (replacement detection).
 */
export async function validateIllustration(params: {
  imageUrl: string;
  creature: CreatureSpec | null;
  themeTitle?: string | null;
  themeId?: string | null;
  sceneDescription?: string | null;
}): Promise<ValidationFailure[]> {
  const { imageUrl, creature, themeTitle, themeId, sceneDescription } = params;
  const failures: ValidationFailure[] = [];
  if (!imageUrl) return failures;

  // The illustration bucket is private, so the stored public URL now returns
  // 400 and vision cannot read it. Hand it a signed URL it can download.
  const { toViewableUrl } = await import("@/lib/storage-urls");
  const viewableUrl = (await toViewableUrl(imageUrl)) ?? imageUrl;

  const {
    getOpenAI,
    isTransientOpenAIError,
    toRetryableProviderError,
  } = await import("@/lib/openai");
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
                 "creature looks frightening, serpentine, dragon-like or like a Loch Ness monster. " +
                 (creature
                   ? `The customer-selected companion is "${creature.label}". List it separately and do not treat a permitted background character as its replacement. `
                   : "") +
                 (sceneDescription
                   ? `The intended scene is: "${sceneDescription}". Characters named by that scene are permitted background characters. `
                   : "") +
                 (themeId === "space-adventure"
                   ? "Friendly aliens and glowing alien creatures are permitted theme characters and are not monsters merely because they are alien. "
                   : "") +
                (themeTitle
                  ? "Set matches_theme to false ONLY if the picture clearly contradicts the story theme \"" + themeTitle + "\"; if it is plausible or you are unsure, set it to true."
                  : "Set matches_theme to true."),
            },
            { type: "image_url", image_url: { url: viewableUrl } },
          ],
        },
      ],
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) throw new Error("empty vision response");
    verdict = JSON.parse(raw) as VisionVerdict;
  } catch (err) {
    if (isTransientOpenAIError(err)) {
      throw toRetryableProviderError(
        err,
        "vision chat.completions.create",
      );
    }
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

  // ── Companion-aware classification ──────────────────────────────────────────
  //
  // Distinguish three kinds of thing the vision model might report:
  //
  //  1. The selected companion              → good, we want it
  //  2. Another real catalogue animal       → conflict ONLY if companion absent
  //  3. A theme background creature (alien) → never a conflict or monster blocker
  //
  const { companionFound, conflicts } = classifySeenAnimals(seen, creature, {
    themeId,
    sceneDescription,
  });

  if (!companionFound) {
    failures.push({
      code: "animal_missing",
      detail:
        "Illustration does not show a " + creature.label + ". Vision model saw: " +
        (seen.length ? seen.join(", ") : "nothing recognisable") + ".",
    });
  }

  // Theme/scene-permitted characters were removed from `conflicts` by the
  // classifier. A remaining catalogue animal is therefore either a true
  // replacement or an unexpected extra.
  for (const other of conflicts) {
    failures.push({
      code: "animal_conflict",
      detail: companionFound
        ? `Illustration includes an unexpected ${other.label} alongside the selected ${creature.label}.`
        : `Illustration shows a ${other.label} instead of the selected ${creature.label}.`,
    });
  }

  if (themeTitle && verdict.matches_theme === false) {
    failures.push({
      code: "theme_mismatch",
      detail: "Illustration does not match the chosen theme (" + themeTitle + "). " + verdict.description,
    });
  }

  // ── Monster-like check with companion + theme awareness ─────────────────────
  //
  // Space Adventure aliens and similar theme background creatures legitimately
  // look "alien/fantastical". Only raise monster_present if the companion itself
  // appears to have been drawn monstrously (companion absent or non-exempt theme).
  //
  if (
    isMonsterLikeBlocker({
      monsterLike: verdict.monster_like,
      companionFound,
      companionKind: creature.kind,
      themeId,
      sceneDescription,
      seen,
    })
  ) {
    failures.push({
      code: "monster_present",
      detail:
        "Illustration looks mythical/monstrous but " + creature.label + " is a real " + creature.kind + ". " + verdict.description,
    });
  } else if (verdict.monster_like && creature.kind === "dinosaur") {
    failures.push({
      code: "monster_present",
      detail:
        "Advisory only: the dinosaur has a dramatic or monster-like appearance. " +
        verdict.description,
      severity: "minor",
    });
  }

  return failures;
}

// ─── Book-level helpers ────────────────────────────────────────────────────────

/**
 * Hard cap on automatic regeneration. After this many attempts the book is
 * routed to a human as "needs_regeneration" rather than looping forever.
 */
/**
 * Codes that describe OUR infrastructure failing, not the content being wrong.
 *
 * These are recorded for diagnostics but must never fail a book or trigger a
 * regeneration: re-rolling the story cannot fix an image we could not download,
 * it just burns another few minutes and another round of OpenAI spend.
 */
const ADVISORY_CODES = new Set(["vision_unavailable"]);

/** True when a failure reflects the content itself, so a retry could help. */
export function isBlockingFailure(failure: ValidationFailure): boolean {
  return failure.severity !== "minor" && ADVISORY_CODES.has(failure.code) === false;
}

/**
 * Automatic illustration correction is safe only when every blocking finding
 * is image-scoped and identifies a real page. Any text/whole-book finding is
 * routed to human review rather than causing a broad regeneration.
 */
export function targetedIllustrationPages(
  failures: ValidationFailure[],
): number[] {
  const blocking = failures.filter(isBlockingFailure);
  if (
    blocking.length === 0 ||
    blocking.some(
      (failure) =>
        failure.source !== "image" ||
        !Number.isInteger(failure.pageNumber) ||
        Number(failure.pageNumber) <= 0,
    )
  ) {
    return [];
  }
  return Array.from(
    new Set(blocking.map((failure) => Number(failure.pageNumber))),
  ).sort((a, b) => a - b);
}

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
  themeTitle?: string | null;
  themeId?: string | null;
  sceneDescriptions?: (string | null)[] | null;
}): Promise<ValidationResult> {
  const { storyText, imageUrls, creature, recipientName, attempt, themeTitle, themeId, sceneDescriptions } = params;

  const failures: ValidationFailure[] = validateStoryText({
    storyText,
    creature,
    recipientName,
  }).map((failure) => ({
    ...failure,
    pageNumber: failure.pageNumber ?? null,
    severity:
      failure.severity ??
      (ADVISORY_CODES.has(failure.code) ? "minor" : "blocker"),
    source: "text",
  }));

  const images = (imageUrls || [])
    .map((url, index) => ({ url, pageIndex: index }))
    .filter(
      (entry): entry is { url: string; pageIndex: number } =>
        typeof entry.url === "string" && entry.url.length > 0,
    );
  const imageResults = await Promise.all(
    images.map(({ url, pageIndex }) =>
      validateIllustration({
        imageUrl: url,
        creature,
        themeTitle,
        themeId,
        sceneDescription: sceneDescriptions
          ? (sceneDescriptions[pageIndex] ?? null)
          : null,
      }),
    ),
  );
  imageResults.forEach((result, index) => {
    const pageNumber = images[index].pageIndex + 1;
    failures.push(
      ...result.map((failure) => ({
        ...failure,
        pageNumber,
        severity:
          failure.severity ??
          (ADVISORY_CODES.has(failure.code) ? "minor" : "blocker"),
        source: "image" as const,
      })),
    );
  });

  return {
    ok: failures.filter(isBlockingFailure).length === 0,
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
  for (const f of failures.filter(isBlockingFailure)) lines.push("- " + f.detail);
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
