#!/usr/bin/env bash
# Render an HTML sheet to PNG with headless Chrome: render_sheet.sh <file.html> <out.png> <width> <height>
set -euo pipefail
in="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size="$3,$4" --virtual-time-budget=3000 \
  --screenshot="$2" "file://$in" 2>/dev/null
