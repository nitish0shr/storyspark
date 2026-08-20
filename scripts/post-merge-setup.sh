#!/usr/bin/env bash
set -euo pipefail

# Install the exact locked dependency tree non-interactively, then run the
# project's regression suite.
# Database migrations are deliberately applied through the documented Supabase
# release process rather than from a local merge hook.
npm ci --ignore-scripts --no-audit
npm test