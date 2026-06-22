import { ElevenLabsClient } from "elevenlabs";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    return NextResponse.json(
      { error: "ElevenLabs API key is not set. Add ELEVENLABS_API_KEY to app/.env.local" },
      { status: 500 }
    );
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const res = await client.voices.getAll();
    const voices = (res.voices || [])
      .filter(v => v.voice_id)
      .map(v => ({
        voiceId: v.voice_id,
        name: v.name || v.voice_id,
        previewUrl: v.preview_url,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ voices, defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load ElevenLabs voices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
