import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getThemeById } from "@/data/themes";

export async function POST(request: NextRequest) {
  try {
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
      email,
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

    // 2. Create book record
    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        child_profile_id: childProfile.id,
        theme_id: themeId,
        child_name: childName,
        theme_title: theme.name,
        contextual_answers: contextualAnswers || {},
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
