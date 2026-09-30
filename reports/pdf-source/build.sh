#!/usr/bin/env bash
# Joins the HTML parts and prints the PDF with headless Microsoft Edge.
set -e
cd "$(dirname "$0")"
cat part0-head.html part*-[a-z]*.html > document.html
printf '\n</body>\n</html>\n' >> document.html
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
OUT="$(cd .. && pwd -W)/Metalix UI UX System.pdf"
"$EDGE" --headless=new --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw \
  --virtual-time-budget=5000 --print-to-pdf="$OUT" "file:///$(pwd -W)/document.html" 2>/dev/null | grep -v '^$' || true
echo "built: $OUT"
