if command -v gh &> /dev/null; then
  if ! gh auth status &> /dev/null; then
    echo "GitHub CLI is not authenticated."
    echo "   Run 'gh auth login' inside the container to authenticate."
  else
    echo "--- GitHub CLI already authenticated. Running setup-git..."
    gh auth setup-git || echo "gh auth setup-git failed or already configured"
  fi
else
  echo "GitHub CLI (gh) not found. Skipping auth setup."
fi

echo "Bun environment configured. Projects installed via Bun."
