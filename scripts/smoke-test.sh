#!/usr/bin/env bash
# smoke-test.sh — Sanity-check a deployed Starmee instance.
#
# Usage:
#   ./scripts/smoke-test.sh https://starmee.com
#   ./scripts/smoke-test.sh http://localhost:5000      (default if no arg)
#
# Hits the critical public routes and verifies:
#   - HTTP 200
#   - Page contains an expected string (catches "wrong page rendered" bugs)
#
# Exit code: 0 if all checks pass, 1 otherwise.

set -u

BASE_URL="${1:-http://localhost:5000}"
BASE_URL="${BASE_URL%/}"  # strip trailing slash

pass=0
fail=0

check() {
  local path="$1"
  local expected_substring="$2"
  local label="$3"

  local url="${BASE_URL}${path}"
  local tmp
  tmp="$(mktemp)"
  local status
  status="$(curl -s -o "$tmp" -w '%{http_code}' "$url")"
  local body
  body="$(cat "$tmp")"
  rm -f "$tmp"

  if [ "$status" != "200" ]; then
    echo "  FAIL  $label — $url returned $status"
    fail=$((fail + 1))
    return
  fi

  if ! echo "$body" | grep -q -- "$expected_substring"; then
    echo "  FAIL  $label — $url returned 200 but missing '$expected_substring'"
    fail=$((fail + 1))
    return
  fi

  echo "  PASS  $label ($status)"
  pass=$((pass + 1))
}

echo "Smoke-testing: $BASE_URL"
echo

check "/api/health"    '"ok"'          "health endpoint"
check "/"              "Starmee"       "landing page"
check "/pricing"       "9.99"          "pricing page"
check "/privacy"       "Privacy"       "privacy policy"
check "/terms"         "Terms"         "terms of service"
check "/auth/login"    "email"         "login page"

echo
echo "Results: $pass passed, $fail failed"
exit $((fail > 0 ? 1 : 0))
