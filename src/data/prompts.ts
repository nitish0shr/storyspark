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
 * Illustration prompt template for image generation.
 *
 * Placeholders:
 *   {scene_description}  - description of what happens in this scene
 *   {name}               - child's name
 *   {age}                - child's age
 *   {gender}             - boy / girl / child
 *   {skin_tone}          - e.g. "light", "medium", "olive", "brown", "dark"
 *   {hair_color}         - e.g. "brown", "black", "blonde", "red"
 *   {hair_style}         - e.g. "curly", "straight", "wavy", "braided"
 *   {eye_color}          - e.g. "brown", "blue", "green", "hazel"
 *   {outfit_for_theme}   - theme-appropriate outfit description
 */
export const ILLUSTRATION_PROMPT_TEMPLATE = `Children's picture book illustration, whimsical watercolor and digital art style, soft lighting, warm and inviting.

Scene: {scene_description}

Main character: A {age}-year-old {gender} named {name} with {skin_tone} skin, {hair_color} {hair_style} hair, and {eye_color} eyes. Wearing {outfit_for_theme}.

Style requirements:
- Warm, soft color palette with gentle gradients
- Whimsical, slightly stylized proportions (large expressive eyes, round features)
- Rich background details that reward close looking
- No text or words in the image
- Safe, joyful, age-appropriate imagery
- Professional children's book illustration quality
- Consistent character design across all pages`;

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
