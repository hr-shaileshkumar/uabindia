#!/bin/sh
echo "Running fallback pre-commit checks (sh)..."
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Check for staged .env or keystore files
for file in $(git diff --cached --name-only); do
  case "$file" in
    *.env|*.jks|*.keystore|*.pfx|*.pem)
      echo "Blocked commit: $file matches forbidden pattern." >&2
      exit 1
      ;;
  esac
  if [ -f "$file" ]; then
    size=$(stat -c%s "$file")
    if [ "$size" -gt $((50*1024*1024)) ]; then
      echo "Blocked commit: $file is larger than 50MB." >&2
      exit 1
    fi
  fi
done

# dotnet format check
if command -v dotnet-format >/dev/null 2>&1; then
  echo "Running dotnet format --verify-no-changes"
  dotnet format --verify-no-changes || { echo "dotnet format issues" >&2; exit 1; }
else
  echo "dotnet-format not installed; skipping format check"
fi

# frontend lint if present
if [ -f "$REPO_ROOT/frontend/package.json" ]; then
  if grep -q '"lint"' "$REPO_ROOT/frontend/package.json"; then
    echo "Running frontend lint"
    npm --prefix frontend run lint || { echo "Frontend lint failed" >&2; exit 1; }
  fi
fi

echo "Pre-commit checks passed."
exit 0
