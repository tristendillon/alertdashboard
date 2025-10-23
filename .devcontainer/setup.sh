#!/bin/bash

echo "Setting up development environment..."

if [ -f "package.json" ]; then
    echo "Installing dependencies with Bun..."
    bun install
    echo "Bun environment configured. Projects installed via Bun."
fi


echo "Development environment ready!"
echo "Installed tools:"
echo "  - Bun: $(bun --version)"
echo "  - GitHub CLI: $(command -v gh &> /dev/null && gh --version | head -n 1 || echo 'Not installed')"