#!/usr/bin/env bash
set -euo pipefail

# Browser QA uses the built Next app, not a static mock. No provider keys or
# public deployment are required: only the three public GET screens are tested.
out="${BROWSER_SMOKE_DIR:-browser-smoke-artifacts}"
mkdir -p "$out"

browser="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$browser" ]]; then
  echo "No headless Chrome/Chromium is available on this runner." >&2
  exit 1
fi

echo "Browser: $("$browser" --version)"

pnpm run start --hostname 127.0.0.1 --port 3000 > "$out/server.log" 2>&1 &
app_pid="$!"
cleanup() {
  kill "$app_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 60); do
  if curl --fail --silent --output /dev/null http://127.0.0.1:3000/; then
    ready=1
    break
  fi
  if ! kill -0 "$app_pid" 2>/dev/null; then
    echo "Server exited before it became available." >&2
    tail -n 100 "$out/server.log" >&2 || true
    exit 1
  fi
  sleep 0.5
done
if [[ "$ready" -ne 1 ]]; then
  echo "Production server did not become ready." >&2
  tail -n 100 "$out/server.log" >&2 || true
  exit 1
fi

for page in 'home|/|Examine it.' 'analyze|/analyze|What is this article really claiming?' 'method|/methodology|Truth is not a vote.' 'journal|/blog|Arguments deserve better questions.' 'essay|/blog/why-we-dont-have-a-truth-meter|Why we refuse to give an article a truth percentage' 'arena|/debates|Who actually got the floor?'; do
  IFS='|' read -r slug route expected <<< "$page"
  url="http://127.0.0.1:3000$route"

  # Assert that the server has rendered the right route before screenshots.
  curl --fail --silent --show-error "$url" -o "$out/$slug.html"
  if ! grep -Fq "$expected" "$out/$slug.html"; then
    echo "Expected content not found on $route: $expected" >&2
    exit 1
  fi

  for viewport in '390x844' '1440x900'; do
    width="${viewport%x*}"
    height="${viewport#*x}"
    png="$out/$slug-$viewport.png"

    timeout 45 "$browser" \
      --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
      --disable-extensions --force-device-scale-factor=1 \
      --window-size="$width,$height" --hide-scrollbars \
      --virtual-time-budget=2000 \
      --user-data-dir="/tmp/biaslens-browser-$slug-$viewport" \
      --screenshot="$png" "$url" > "$out/$slug-$viewport.log" 2>&1

    python3 - "$png" "$width" "$height" <<'PY'
import struct
import sys
from pathlib import Path

path = Path(sys.argv[1])
expected_w, expected_h = map(int, sys.argv[2:4])
data = path.read_bytes()
assert data.startswith(b'\x89PNG\r\n\x1a\n'), f"Not a PNG: {path}"
width, height = struct.unpack('>II', data[16:24])
assert (width, height) == (expected_w, expected_h), (
    f"Requested {expected_w}x{expected_h}, captured {width}x{height}: {path}"
)
assert len(data) > 5000, f"Suspiciously empty screenshot: {path}"
print(f"PASS {path}: {width}x{height}, {len(data)} bytes")
PY
  done
done
