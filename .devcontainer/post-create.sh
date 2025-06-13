#!/bin/bash
set -euo pipefail # Good practice: exit on error, undefined variable, pipe failure

# Define the shell configuration file
export ENV="$HOME/.bashrc"
export SHELL="$(which bash)"
export EXPECTED_PNPM_HOME="$HOME/.local/share/pnpm"

# Ensure the .bashrc file exists, create if not (optional, but safe)
echo "--- Running pnpm setup ---"
# Run pnpm setup. This will modify $ENV to add PNPM_HOME and update PATH.
# It might output instructions, but we'll source the file next anyway.
pnpm setup || echo "pnpm setup finished (ignoring potential non-zero exit if dir already configured)"

echo "--- Sourcing $ENV to update environment ---"
# Source the potentially modified .bashrc to load PNPM_HOME and PATH
# into the *current* script's environment.
# Use '.' as a shorthand for 'source' for better POSIX compatibility
. "$ENV"

echo "--- Manually configuring environment variables for this script ---"
export PNPM_HOME="$EXPECTED_PNPM_HOME"
export PATH="$PNPM_HOME:$PATH"

# Add a tiny delay in case of filesystem sync issues (unlikely but harmless)
sleep 1

echo "--- Installing global packages ---"
pnpm install -g turbo \
  @anthropic-ai/claude-code \
  typescript \
  ts-node \
  eslint \
  prettier

echo "--- Installing local project dependencies ---"
# Install local dependencies (make sure package.json exists)
if [ -f "package.json" ]; then
  pnpm install
else
  echo "No package.json found, skipping local pnpm install."
fi

# --- Check GitHub auth and prompt login if missing ---
if command -v gh &> /dev/null; then
  if ! gh auth status &> /dev/null; then
    echo "⚠️  GitHub CLI is not authenticated."
    echo "👉 Run 'gh auth login' inside the container to authenticate with GitHub."
  else
    echo "--- GitHub CLI already authenticated ---"
    echo "--- Running gh auth setup-git ---"
    gh auth setup-git || echo "gh auth setup-git failed or already configured"
  fi
else
  echo "⚠️ GitHub CLI (gh) not found. Skipping auth setup."
fi


echo "--- Setup complete ---"
echo "pnpm environment configured. Global packages installed."
echo "If you open a NEW terminal, pnpm should be available."

exit 0