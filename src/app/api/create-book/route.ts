import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { getThemeById } from "@/data/themes";
import { isValidLanguageCode } from "@/data/languages";
import { AppearanceProfile } from "@/types/child";
import { CONSENT_VERSION } from "@/lib/consent";
import { resolveCreatureFromAnswers } from "@/data/animals";

/**
 * Whitelisted Character Profile keys accepted from the client.
 * referenceSheetUrl is intentionally excluded — it is only ever set
 * server-side by the book pipeline.
 */
const PROFILE_KEYS = [
  "hairColor",
  "hairStyle",
  "hairLength",
  "hairTexture",
  "skinTone",
  "faceShape",
  "facialFeatures",
  "eyeColor",
  "eyeShape",
  "approximateAge",
  "freckles",
  "glasses",
  "distinctiveFeatures",
  "description",
] as const;

/** Sanitises a client-supplied Character Profile. Returns null if unusable. */
function sanitizeProfile(raw: unknown): AppearanceProfile | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const cleaned: Record<string, string> = {};
  for (const key of PROFILE_KEYS) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      cleaned[key] = value.trim().slice(0, 300);
    }
  }
  if (Object.keys(cleaned).length === 0) return null;

  return {
    skinTone: cleaned.skinTone || "warm medium",
    hairColor: cleaned.hairColor || "brown",
    hairStyle: cleaned.hairStyle || "short straight",
    eyeColor: cleaned.eyeColor || "brown",
    ...cleaned,
  } as AppearanceProfile;
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !isAdminConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 }
      );
    }

    // Try to get the authenticated user — but do NOT block anonymous visitors
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // No session — that's fine for free preview
    }

    const body = await request.json();
    const {
      childName,
      childAge,
      childGender,
      photoUrl,
      appearanceDescription,
      themeId,
      contextualAnswers,
      dedication,
      language,
      email,
      marketingConsent,
      adultConfirmed,
      secondChildName,
      secondChildAge,
      secondChildGender,
      secondChildPhotoUrl,
      appearanceProfile,
      secondAppearanceDescription,
      secondAppearanceProfile,
    } = body;

    const sanitizedProfile = sanitizeProfile(appearanceProfile);
    const sanitizedSecondProfile = sanitizeProfile(secondAppearanceProfile);

    // Validate required fields
    if (!childName || childAge === undefined || !childGender || !themeId) {
      return NextResponse.json(
        { error: "Missing required fields: childName, childAge, childGender, themeId" },
        { status: 400 }
      );
    }

    // Look up theme title
    const theme = getThemeById(themeId);
    if (!theme) {
      return NextResponse.json(
        { error: "Invalid theme ID" },
        { status: 400 }
      );
    }

    // Subscriber-only themes require an authenticated, active subscriber
    if (theme.subscriberOnly) {
      if (!userId) {
        return NextResponse.json(
          { error: "This theme is exclusive to subscribers. Subscribe to the Monthly Book Club to unlock it!" },
          { status: 403 }
        );
      }
      const { data: activeSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (!activeSub) {
        return NextResponse.json(
          { error: "This theme is exclusive to subscribers. Subscribe to the Monthly Book Club to unlock it!" },
          { status: 403 }
        );
      }
    }

    // Use admin client for all inserts so RLS doesn't block anonymous visitors
    const { data: childProfile, error: childError } = await supabaseAdmin
      .from("child_profiles")
      .insert({
        user_id: userId,
        name: childName,
        age: childAge,
        gender: childGender,
        photo_url: photoUrl || null,
        appearance_profile: sanitizedProfile,
      })
      .select("id")
      .single();

    if (childError) {
      console.error("Failed to create child profile:", childError);
      return NextResponse.json(
        { error: "Failed to create child profile" },
        { status: 500 }
      );
    }

    let secondChildProfileId: string | null = null;

    if (secondChildName && secondChildAge !== undefined && secondChildGender) {
      const { data: secondProfile, error: secondError } = await supabaseAdmin
        .from("child_profiles")
        .insert({
          user_id: userId,
          name: secondChildName,
          age: secondChildAge,
          gender: secondChildGender,
          photo_url: secondChildPhotoUrl || null,
          appearance_profile: sanitizedSecondProfile,
        })
        .select("id")
        .single();

      if (secondError) {
        console.error("Failed to create second child profile:", secondError);
        return NextResponse.json(
          { error: "Failed to create second child profile" },
          { status: 500 }
        );
      }
      secondChildProfileId = secondProfile.id;
    }

    const bookTitle = secondChildProfileId
      ? `${childName} & ${secondChildName}'s ${theme.name}`
      : theme.titleTemplate?.replace("[Child]", childName) || `${childName}'s ${theme.name}`;

    // --- Starmee order + consent capture (server-side validated) ---

    const nowIso = new Date().toISOString();

    const purchaserEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaserEmail)) {

      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

    }

    const recipientName = typeof childName === "string" ? childName.trim() : "";

    if (!recipientName || recipientName.length > 40) {

      return NextResponse.json({ error: "Please enter the child's name (40 characters or fewer)." }, { status: 400 });

    }

    if (adultConfirmed !== true) {

      return NextResponse.json({ error: "Please confirm you are 18 or older to place this order." }, { status: 400 });

    }

    const marketingOptIn = marketingConsent === true;

    const selectedCreature = resolveCreatureFromAnswers(contextualAnswers as Record<string, unknown>);

    
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .insert({
        user_id: userId,
        child_profile_id: childProfile.id,
        second_child_profile_id: secondChildProfileId,
        theme_id: themeId,
        child_name: secondChildProfileId ? `${childName} & ${secondChildName}` : childName,
        theme_title: bookTitle,
        purchaser_email: purchaserEmail,
        recipient_name: recipientName,
        selected_animal: selectedCreature ? selectedCreature.label : null,
        marketing_consent: marketingOptIn,
        marketing_consent_at: marketingOptIn ? nowIso : null,
        consent_version: CONSENT_VERSION,
        adult_confirmed: true,
        adult_confirmed_at: nowIso,
        contextual_answers: {
          ...(contextualAnswers || {}),
          ...(appearanceDescription ? { __appearance_desc: appearanceDescription } : {}),
          ...(secondAppearanceDescription
            ? { __appearance_desc2: secondAppearanceDescription }
            : {}),
        },
        dedication: dedication?.trim() || null,
        language: isValidLanguageCode(language) ? language : "en",
        status: "draft",
      })
      .select("id")
      .single();

    if (bookError) {
      console.error("Failed to create book:", bookError);
      return NextResponse.json(
        { error: "Failed to create book" },
        { status: 500 }
      );
    }

    // Capture email for anonymous visitors (and optionally for logged-in users too)
    if (email) {
      await supabaseAdmin.from("email_captures").insert({
        email,
        book_id: book.id,
      }).then(({ error }) => {
        if (error) console.warn("email_captures insert failed:", error.message);
      });
    }

    return NextResponse.json({
      childProfileId: childProfile.id,
      secondChildProfileId,
      bookId: book.id,
    });
  } catch (error) {
    console.error("Create book error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
