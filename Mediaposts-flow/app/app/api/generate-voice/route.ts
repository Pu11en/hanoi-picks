import { ElevenLabsClient } from "elevenlabs";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const { script, voiceId } = await req.json();

    if (!script || !script.trim()) {
      return NextResponse.json({ error: "Script is empty" }, { status: 400 });
    }

    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const vid = voiceId || process.env.ELEVENLABS_VOICE_ID;
    if (!vid) {
      return NextResponse.json(
        { error: "No voice selected. Pick a voice or set ELEVENLABS_VOICE_ID." },
        { status: 400 }
      );
    }

    const audio = await client.textToSpeech.convert(vid, {
      text: script,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) chunks.push(Buffer.from(chunk));
    const buf = Buffer.concat(chunks);

    const dir = join(process.cwd(), "public", "voices");
    await mkdir(dir, { recursive: true });
    const filename = `voice_${Date.now()}.mp3`;
    await writeFile(join(dir, filename), buf);

    return NextResponse.json({ url: `/voices/${filename}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
