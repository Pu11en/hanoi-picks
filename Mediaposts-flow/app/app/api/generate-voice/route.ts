import { ElevenLabsClient } from "elevenlabs";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  const { script, voiceId } = await req.json();

  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  const vid = voiceId || process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";

  const audio = await client.textToSpeech.convert(vid, {
    text: script,
    model_id: "eleven_turbo_v2_5",
    voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audio) chunks.push(Buffer.from(chunk));
  const buf = Buffer.concat(chunks);

  const filename = `voice_${Date.now()}.mp3`;
  const savePath = join(process.cwd(), "public", "voices", filename);
  await writeFile(savePath, buf);

  return NextResponse.json({ url: `/voices/${filename}` });
}
