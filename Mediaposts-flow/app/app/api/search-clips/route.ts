import { NextRequest, NextResponse } from "next/server";
import { findClips } from "../../../lib/clips";

export async function POST(req: NextRequest) {
  try {
    const { subjects, sportHint } = await req.json() as { subjects: string[]; sportHint?: string };
    if (!subjects?.length) return NextResponse.json({ error: "No subjects" }, { status: 400 });

    const results = await Promise.all(
      subjects.map(async (subject) => ({
        subject,
        clips: await findClips(subject, { sportHint: sportHint ?? "soccer", want: 6 }),
      }))
    );
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Search failed" }, { status: 500 });
  }
}
