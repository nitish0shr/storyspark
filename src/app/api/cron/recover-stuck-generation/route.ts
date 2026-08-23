import { NextRequest, NextResponse } from "next/server";
import { runGenerationRecoverySweep } from "@/services/generation-recovery";

export const dynamic = "force-dynamic";

/**
 * Optional secondary trigger for an external scheduler. Production recovery
 * does not depend on this endpoint: authenticated status polling invokes the
 * same sweep service inside the existing Autoscale deployment.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runGenerationRecoverySweep("protected_endpoint");
    return NextResponse.json(summary);
  } catch (error) {
    console.error(
      "[generation-recovery] protected sweep failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json(
      { error: "Generation recovery sweep failed" },
      { status: 500 },
    );
  }
}