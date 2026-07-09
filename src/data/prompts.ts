import { AppearanceProfile } from "@/types/child";

/**
 * System prompt template for story generation via LLM.
 *
 * Placeholders:
 *   {name}               - child's first name
 *   {age}                - child's age (e.g. "5" or "baby" for pre-birth)
 *   {gender}             - boy / girl / child
 *   {pronoun}            - he / she / they
 *   {possessive}         - his / her / their
 *   {object}             - him / her / them
 *   {skeleton}           - the full story skeleton text for the chosen theme
 *   {hair_description}   - e.g. "curly brown hair"
 *   {appearance_notes}   - additional appearance details from photo analysis
 *   {contextual_answers} - formatted Q&A from the contextual questions
 */
export const STORY_GENERATION_SYSTEM_PROMPT = `You are a world-class children's book author. Your job is to write a warm, magical, age-appropriate picture book story for a child.

CHILD PROFILE:
- Name: {name}
- Age: {age}
- Gender: {gender}
- Pronouns: {pronoun}/{possessive}/{object}
- Appearance: {hair_description}. {appearance_notes}

PERSONALIZATION DETAILS:
{contextual_answers}

STORY SKELETON (use as your structural guide):
{skeleton}

INSTRUCTIONS:
1. Follow the skeleton's page structure and arc closely, but bring the text to life with vivid, lyrical language.
2. Replace all placeholders with the child's actual details.
3. Keep each page between 50-80 words. Children's books need breathing room for illustrations.
4. Use simple, warm vocabulary appropriate for ages 3-8. Avoid complex sentences.
5. Make the child the hero of every scene. They should drive the action.
6. Include sensory details: sounds, colors, textures, smells.
7. End with a cozy, affirming resolution that makes the child feel loved and special.
8. Do NOT include any illustration notes, stage directions, or meta-commentary.
9. Output ONLY the story text, one page per line, prefixed with "Page N:" where N is the page number.

Write with the warmth of a bedtime story and the wonder of a child's imagination.`;

/**
 * Helper to fill a prompt template with actual values.
 */
export function fillPromptTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Illustration prompt building (centralised)                          */
/* ------------------------------------------------------------------ */

/** The single source of truth for the storybook illustration art style. */
export const ILLUSTRATION_STYLE =
  "Children's picture book illustration, whimsical watercolour and digital art style, soft lighting, warm and inviting.";

const STYLE_REQUIREMENTS = `Style requirements:
- Warm, soft colour palette with gentle gradients
- Whimsical, slightly stylised proportions (large expressive eyes, round features)
- Rich background details that reward close looking
- No text or words in the image
- Safe, joyful, age-appropriate imagery
- Professional children's book illustration quality`;

/** A character to be depicted in an illustration. */
export interface IllustrationCharacter {
  /** Child's first name (used to label characters, never rendered as text in the image). */
  name: string;
  /** e.g. "5-year-old boy", "baby girl". */
  personLabel: string;
  /** Theme outfit description for story pages. */
  outfit: string;
  profile: AppearanceProfile;
}

/** Builds a human-readable person label from age + gender. */
export function buildPersonLabel(age: number, gender: string): string {
  const genderLabel = gender === "neutral" || !gender ? "child" : gender;
  return age < 0 ? `baby ${genderLabel}` : `${age}-year-old ${genderLabel}`;
}

/**
 * Renders a Character Profile as an explicit appearance block for image prompts.
 * Every available field is listed so the model is consistently reminded how
 * the child should look.
 */
export function buildCharacterBlock(
  character: IllustrationCharacter,
  index: number,
  total: number
): string {
  const { profile: p, name, personLabel, outfit } = character;

  const header =
    total > 1 ? `CHARACTER ${index + 1} — ${name}` : `MAIN CHARACTER — ${name}`;

  const hairParts = [p.hairColor, p.hairLength, p.hairTexture]
    .filter(Boolean)
    .join(", ");
  const hair = [hairParts, p.hairStyle ? `styled as ${p.hairStyle}` : ""]
    .filter(Boolean)
    .join(", ");

  const lines: string[] = [`${header}: a ${personLabel}.`];
  if (hair) lines.push(`- Hair: ${hair}`);
  if (p.skinTone) lines.push(`- Skin tone: ${p.skinTone}`);
  if (p.faceShape) lines.push(`- Face shape: ${p.faceShape}`);
  if (p.facialFeatures) lines.push(`- Facial features: ${p.facialFeatures}`);
  const eyes = [p.eyeColor, p.eyeShape].filter(Boolean).join(", ");
  if (eyes) lines.push(`- Eyes: ${eyes}`);
  if (p.freckles) lines.push(`- Freckles: ${p.freckles}`);
  if (p.glasses) lines.push(`- Glasses: ${p.glasses}`);
  if (p.distinctiveFeatures)
    lines.push(`- Distinctive features: ${p.distinctiveFeatures}`);
  if (p.description) lines.push(`- Overall appearance: ${p.description}`);
  if (outfit) lines.push(`- Wearing in this story: ${outfit}`);

  return lines.join("\n");
}

/** The appearance-preservation rules appended to every illustration prompt. */
function buildConsistencyRules(characters: IllustrationCharacter[]): string {
  const lines = [
    "CHARACTER CONSISTENCY RULES (highest priority):",
    "- Character identity takes priority over artistic variation.",
    "- Keep each child's hair colour, hair style, hair length, hair texture, skin tone, face shape, facial features, eye colour, eye shape, freckles, and glasses EXACTLY as described above.",
    "- Clothing, poses, expressions, lighting, and scenery may change with the story; the child's core physical appearance must not.",
    "- The child must be immediately recognisable as the same child on every page of the book, while still appearing as a stylised storybook character.",
  ];
  if (characters.length > 1) {
    lines.push(
      "- Each child keeps their own independent identity. NEVER blend, swap, or average features between the children — they must remain clearly visually distinct from each other in every scene."
    );
  }
  return lines.join("\n");
}

/**
 * Builds the note explaining the attached Character Reference Sheet images.
 * `referenceNames` must be in the same order as the attached images.
 */
function buildReferenceImagesNote(
  referenceNames: string[],
  characters: IllustrationCharacter[]
): string {
  if (referenceNames.length === 0) return "";

  const mapping = referenceNames
    .map((n, i) => {
      const ordinal = i === 0 ? "first" : i === 1 ? "second" : `${i + 1}th`;
      return `the ${ordinal} reference image shows ${n}`;
    })
    .join("; ");

  const outfits = characters
    .filter((c) => referenceNames.includes(c.name))
    .map((c) => `${c.name} wears ${c.outfit}`)
    .join("; ");

  return [
    `REFERENCE IMAGES: The attached image(s) are official Character Reference Sheets — ${mapping}.`,
    "Match each child's face, hair, skin tone, and other physical characteristics to their reference sheet as closely as possible, adapting only pose, expression, outfit, and scene.",
    outfits
      ? `The reference sheets show each child's natural everyday look; in this scene ${outfits}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Central builder for every story-page illustration prompt.
 *
 * @param sceneDescription - what happens in this scene
 * @param characters       - one or two children with their Character Profiles
 * @param referenceNames   - names of children whose reference sheet images are
 *                           attached to the request, in attachment order
 */
export function buildIllustrationPrompt(params: {
  sceneDescription: string;
  characters: IllustrationCharacter[];
  referenceNames?: string[];
}): string {
  const { sceneDescription, characters, referenceNames = [] } = params;

  const characterBlocks = characters
    .map((c, i) => buildCharacterBlock(c, i, characters.length))
    .join("\n\n");

  const togetherNote =
    characters.length > 1
      ? "Both children appear together in this scene, interacting and adventuring side by side."
      : "";

  return [
    ILLUSTRATION_STYLE,
    `Scene: ${sceneDescription}\nDepict every character, creature, and object mentioned in the scene description — do not omit any of them.`,
    characterBlocks,
    togetherNote,
    buildReferenceImagesNote(referenceNames, characters),
    buildConsistencyRules(characters),
    STYLE_REQUIREMENTS,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Builds the prompt for a child's canonical Character Reference Sheet:
 * a neutral, costume-free portrait in the exact storybook style, used as the
 * visual reference for every subsequent illustration.
 */
export function buildReferenceSheetPrompt(params: {
  name: string;
  personLabel: string;
  profile: AppearanceProfile;
}): string {
  const { name, personLabel, profile } = params;

  const block = buildCharacterBlock(
    { name, personLabel, outfit: "", profile },
    0,
    1
  );

  return [
    `Character reference sheet for a children's picture book. ${ILLUSTRATION_STYLE}`,
    `A single friendly, front-facing portrait of a ${personLabel}, standing naturally with a gentle warm smile, on a plain soft cream background.`,
    block,
    `Reference sheet requirements:
- Show the child's natural, everyday appearance: simple plain clothing, NO costume, NO props, NO accessories beyond glasses if described above
- Neutral relaxed pose, gentle expression — no exaggerated emotions or action poses
- Clear, unobstructed view of the face and hair
- No text, labels, or words anywhere in the image
- This image is the canonical visual reference for this child and will be used to keep their appearance consistent across every page of the book`,
    STYLE_REQUIREMENTS,
  ].join("\n\n");
}
