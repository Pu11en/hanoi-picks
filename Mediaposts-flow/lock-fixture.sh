#!/usr/bin/env bash
# Locks the latest ElevenLabs MP3 as the fixed test fixture for scraping/edit dev.
# Usage: ./lock-fixture.sh   (run from Mediaposts-flow/)
# Grabs the newest generated voice, transcribes it with word-level timings,
# and saves everything into test-fixtures/ so we never regenerate (saves credits).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VOICES="$ROOT/app/public/voices"
OUT="$ROOT/test-fixtures"
mkdir -p "$OUT"

LATEST="$(ls -t "$VOICES"/*.mp3 2>/dev/null | head -1 || true)"
if [ -z "$LATEST" ]; then
  echo "No MP3 found in $VOICES. Generate a voice in the app first."
  exit 1
fi

echo "Locking: $LATEST"
cp "$LATEST" "$OUT/locked-voice.mp3"

echo "Transcribing with word timings (this runs locally, no API cost)..."
whisper "$OUT/locked-voice.mp3" \
  --model base \
  --language en \
  --word_timestamps True \
  --output_format all \
  --output_dir "$OUT" >/dev/null 2>&1

# Normalize the transcript name
BASE="$(basename "$OUT/locked-voice.mp3" .mp3)"
[ -f "$OUT/$BASE.txt" ] && cp "$OUT/$BASE.txt" "$OUT/locked-transcript.txt" || true

echo ""
echo "Locked. Fixture files in test-fixtures/:"
ls -la "$OUT"
echo ""
echo "Spoken script:"
cat "$OUT/locked-transcript.txt" 2>/dev/null || true
