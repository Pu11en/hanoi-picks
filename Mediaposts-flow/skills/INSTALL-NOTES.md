# Video pipeline tools — install state (verified 2026-06-23)

## Cloned skill repos (in this folder, .git stripped, tracked in our repo)
- video-use/            — browser-use/video-use (chat-driven video editor brain)
- tiktok-video-skills/  — iart-ai (short-form-video, caption-animation, lower-thirds, countdown-video)
- visual-skills/        — smixs (Gemini Nano Banana Pro/Flash prompting)
- bananahub-skill/      — bananahub-ai (Google image best-practices)

## rembg (background cutouts) — VERIFIED WORKING
Local venv at Mediaposts-flow/.rembg-venv (gitignored, heavy). Recreate with:
    uv venv --python 3.12 .rembg-venv
    uv pip install --python .rembg-venv "rembg>=2.0.65" onnxruntime pillow "numpy<2.2" click filetype
Use via Python (NOT the CLI — its server cmd needs gradio):
    .rembg-venv/bin/python -c "from rembg import remove; from PIL import Image; remove(Image.open('in.png')).save('out.png')"
u2net model auto-downloads once to ~/.u2net/ (cached).

## Already present (system): yt-dlp, ffmpeg, whisper, node 22, uv
