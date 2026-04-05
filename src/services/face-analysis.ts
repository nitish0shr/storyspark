import { replicate } from "@/lib/replicate";
import { AppearanceProfile } from "@/types/child";

const DEFAULT_PROFILE: AppearanceProfile = {
  skinTone: "warm medium",
  hairColor: "brown",
  hairStyle: "short straight",
  eyeColor: "brown",
};

const ANALYSIS_PROMPT = `Analyze this photo of a child and describe their physical appearance. Respond ONLY with a JSON object in this exact format, no other text:
{
  "skinTone": "<description like: fair, light, medium, olive, tan, brown, dark brown, deep>",
  "hairColor": "<color like: blonde, light brown, brown, dark brown, black, red, auburn, strawberry blonde>",
  "hairStyle": "<style like: curly short, curly medium, curly long, straight short, straight medium, straight long, wavy short, wavy medium, wavy long, braided, afro>",
  "eyeColor": "<color like: brown, dark brown, blue, green, hazel, gray>"
}

Be specific and accurate. If you cannot determine a feature clearly, use your best guess based on what is visible.`;

/**
 * Analyzes a child's photo using a vision model to extract appearance details.
 * Returns a default profile if analysis fails.
 */
export async function analyzeFace(
  photoUrl: string
): Promise<AppearanceProfile> {
  try {
    const output = await replicate.run("meta/meta-llama-3.2-90b-vision-instruct", {
      input: {
        image: photoUrl,
        prompt: ANALYSIS_PROMPT,
        max_tokens: 300,
        temperature: 0.1,
      },
    });

    // Replicate returns output as an array of string tokens or a single string
    const rawText = Array.isArray(output) ? output.join("") : String(output);

    // Extract JSON from the response (may be wrapped in markdown code fences)
    const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.warn("Face analysis: could not find JSON in response, using defaults");
      return DEFAULT_PROFILE;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const profile: AppearanceProfile = {
      skinTone: typeof parsed.skinTone === "string" ? parsed.skinTone : DEFAULT_PROFILE.skinTone,
      hairColor: typeof parsed.hairColor === "string" ? parsed.hairColor : DEFAULT_PROFILE.hairColor,
      hairStyle: typeof parsed.hairStyle === "string" ? parsed.hairStyle : DEFAULT_PROFILE.hairStyle,
      eyeColor: typeof parsed.eyeColor === "string" ? parsed.eyeColor : DEFAULT_PROFILE.eyeColor,
    };

    return profile;
  } catch (error) {
    console.error("Face analysis failed, using default profile:", error);
    return DEFAULT_PROFILE;
  }
}
