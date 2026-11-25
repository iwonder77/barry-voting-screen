#!/usr/bin/env bash
# Prepares designer PDFs for development. For every PDF in design/pdf/:
#   design/renders/<name>.png     the whole screen rendered 1080 px wide (layout reference)
#   design/extracted/<name>/      every embedded image, at its original resolution
# Then prints each PDF's image list so you can pick the files the app needs.
# Run from the project root: npm run design
set -eo pipefail # (no -u: macOS ships an old bash where it misfires on empty arrays)

WIDTH=1080 # screen width in portrait

SRC="design/pdf"
RENDERS="design/renders"
EXTRACTED="design/extracted"

command -v pdftocairo >/dev/null || { echo "pdftocairo not found: run 'brew install poppler'"; exit 1; }
mkdir -p "$RENDERS" "$EXTRACTED"

shopt -s nullglob
pdfs=("$SRC"/*.pdf)
[ ${#pdfs[@]} -gt 0 ] || { echo "No PDFs found in $SRC"; exit 1; }

for pdf in "${pdfs[@]}"; do
  base="$(basename "$pdf" .pdf)"
  # "Voting_Screen_1" -> "voting-screen-1"
  name="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"

  pdftocairo -png -singlefile -scale-to-x "$WIDTH" -scale-to-y -1 "$pdf" "$RENDERS/$name"

  rm -rf "${EXTRACTED:?}/$name" && mkdir -p "$EXTRACTED/$name"
  pdfimages -all "$pdf" "$EXTRACTED/$name/img"

  echo "== $base.pdf -> $RENDERS/$name.png, images in $EXTRACTED/$name/"
  pdfimages -list "$pdf" | awk 'NR > 2 { printf "   img-%03d  %5s x %-5s %-6s %s\n", $2, $4, $5, $3, $9 }'
done
