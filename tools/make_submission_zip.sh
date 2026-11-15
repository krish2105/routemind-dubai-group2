#!/usr/bin/env bash
# Build the single submission zip for Group 2 (RouteMind Dubai).
# Run from anywhere:  bash tools/make_submission_zip.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT_NAME="$(basename "$PWD")"
mkdir -p dist
OUT="dist/RouteMind_Dubai_Group2_Submission.zip"
rm -f "$OUT"

# 1) Rebuild speaker PDFs so they match docs/frozen_results.json
if command -v python3 >/dev/null 2>&1; then
  python3 tools/build_speaker_pdfs.py >/dev/null && echo "speaker PDFs rebuilt"
else
  echo "WARNING: python3 not found, speaker PDFs not rebuilt"
fi

# 2) Zip everything except build output and heavy folders
cd ..
zip -r "$ROOT_NAME/$OUT" "$ROOT_NAME" \
  -x "$ROOT_NAME/dist/*" \
  -x "*/node_modules/*" \
  -x "*/test-results/*" \
  -x "*/playwright-report/*" \
  -x "*/tsconfig.tsbuildinfo" \
  -x "*/.next/*" \
  -x "*/.vercel/*" \
  -x "*/.git/*" \
  -x "*/__pycache__/*" \
  -x "*/.DS_Store" \
  -x "*/.env*" \
  -x "$ROOT_NAME/notebook/data/raw/*" >/dev/null
cd "$ROOT_NAME"

echo "Created $OUT"
ls -lh "$OUT"
echo "Files in zip: $(unzip -Z1 "$OUT" | wc -l)"
