#!/bin/bash

echo "Setting up development environment..."

if [ -f "package.json" ]; then
    echo "Installing dependencies with Bun..."
    bun install
    echo "Bun environment configured. Projects installed via Bun."
fi

bun install -g turbo sst @anthropic-ai/claude-code

sst install

# alias npx to bunx so sst uses bunx instead of npx

mkdir -p ~/.local/bin
echo '#!/bin/sh' %3E ~/.local/bin/npx
echo 'exec bunx "$@"' >> ~/.local/bin/npx
chmod +x ~/.local/bin/npx

export PATH="$HOME/.local/bin:$PATH"

source ~/.bashrc

echo "Development environment ready!"
echo "Installed tools:"
echo "  - Bun: $(bun --version)"
echo "  - GitHub CLI: $(command -v gh &> /dev/null && gh --version | head -n 1 || echo 'Not installed')"
echo "  - Turbo: $(turbo --version)"
echo "  - SST: $(sst version)"