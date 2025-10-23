#!/bin/bash

echo "Setting up development environment..."

if [ -f "package.json" ]; then
    echo "Installing dependencies with Bun..."
    bun install
    echo "Bun environment configured. Projects installed via Bun."
fi

if [ ! -d ~/.aws ]; then
    mkdir -p ~/.aws
    echo "AWS CLI installed. Run 'aws configure' to set up credentials."
fi

if ls *.tf 1> /dev/null 2>&1; then
    echo "Initializing Terraform..."
    terraform init
fi


echo "Development environment ready!"
echo "Installed tools:"
echo "  - Bun: $(bun --version)"
echo "  - AWS CLI: $(aws --version)"
echo "  - Terraform: $(terraform version -json | jq -r .terraform_version)"
echo "  - GitHub CLI: $(command -v gh &> /dev/null && gh --version | head -n 1 || echo 'Not installed')"