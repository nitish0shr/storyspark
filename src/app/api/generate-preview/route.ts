import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { generatePreview } from "@/services/book-pipeline";
import { isOpenAIConfigured } from "@/lib/openai";
import {
  creatorIdentityFromUser,
  isCreatorOwner,
} from "@/lib/creator-session";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !isAdminConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 }
      );
    }
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured. Please add OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    // Guests are welcome, but they must be real authenticated anonymous users.
    let identity = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!authError) {
        identity = creatorIdentityFromUser(user);
      }
    } catch {
      identity = null;
    }
    if (!identity) {
      return NextResponse.json(
        {
          error:
            "A secure creator session is required. Please refresh and try again.",
        },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { bookId } = body;

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    // Fetch with the admin client, then enforce the exact authenticated owner
    // before starting any billable work.
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, user_id, status, lifecycle_stage")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (!isCreatorOwner(identity.userId, book.user_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // This public/customer endpoint is for a newly created draft only.
    // Lifecycle-null legacy recovery is privileged, explicitly confirmed, and
    // must pass /api/admin/regenerate-legacy-book instead.
    if (book.lifecycle_stage !== null || book.status !== "draft") {
      return NextResponse.json(
        {
          error:
            "This book cannot be generated through the public preview endpoint.",
        },
        { status: 409 },
      );
    }

    // Atomically claim the draft before dispatching expensive background work.
    // Two concurrent requests may both read "draft", but only one can update
    // the row while that predicate is still true.
    const { data: claimedBook, error: claimError } = await supabaseAdmin
      .from("books")
      .update({ status: "preview_generating" })
      .eq("id", bookId)
      .eq("user_id", identity.userId)
      .eq("status", "draft")
      .is("lifecycle_stage", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error(`Failed to claim preview generation for ${bookId}:`, claimError);
      return NextResponse.json(
        { error: "Failed to start book generation" },
        { status: 500 },
      );
    }
    if (!claimedBook) {
      return NextResponse.json(
        { error: "Book generation already in progress" },
        { status: 409 }
      );
    }

    // Start preview generation (fire-and-forget — client polls /api/book-status)
    generatePreview(bookId, false, { claimedPublicGeneration: true }).catch((err) => {
      console.error(`Background preview generation failed for ${bookId}:`, err);
    });

    return NextResponse.json(
      { status: "preview_generating", bookId },
      { status: 202 }
    );
  } catch (error) {
    console.error("Generate preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
