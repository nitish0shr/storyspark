import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getThemeById } from "@/data/themes";
import { isValidLanguageCode } from "@/data/languages";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 }
      );
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      childName,
      childAge,
      childGender,
      photoUrl,
      themeId,
      contextualAnswers,
      dedication,
      language,
      email,
      secondChildName,
      secondChildAge,
      secondChildGender,
      secondChildPhotoUrl,
    } = body;

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

    // 1. Create child profile
    const { data: childProfile, error: childError } = await supabase
      .from("child_profiles")
      .insert({
        user_id: user.id,
        name: childName,
        age: childAge,
        gender: childGender,
        photo_url: photoUrl || null,
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
      const { data: secondProfile, error: secondError } = await supabase
        .from("child_profiles")
        .insert({
          user_id: user.id,
          name: secondChildName,
          age: secondChildAge,
          gender: secondChildGender,
          photo_url: secondChildPhotoUrl || null,
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

    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        child_profile_id: childProfile.id,
        second_child_profile_id: secondChildProfileId,
        theme_id: themeId,
        child_name: secondChildProfileId ? `${childName} & ${secondChildName}` : childName,
        theme_title: bookTitle,
        contextual_answers: contextualAnswers || {},
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

    // 3. Capture email (if provided)
    if (email) {
      await supabase.from("email_captures").insert({
        email,
        book_id: book.id,
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
