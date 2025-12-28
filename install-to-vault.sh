#!/bin/bash

# VaultSite Installer for Dev-test vault
# This script installs VaultSite plugin to your Obsidian vault

set -e

echo "🚀 VaultSite Installer"
echo "======================"
echo ""

# Define paths
PLUGIN_DIR="/Users/ianfong/Desktop/vscode/obsidian-plugins/vaultsite"
VAULT_PATH="/Users/ianfong/Library/Mobile Documents/iCloud~md~obsidian/Documents/Dev-test"
PLUGIN_INSTALL_DIR="$VAULT_PATH/.obsidian/plugins/vaultsite"

# Check if vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Error: Vault not found at $VAULT_PATH"
    exit 1
fi

echo "📦 Building plugin..."
cd "$PLUGIN_DIR"
npm install
npm run build

echo ""
echo "📁 Creating plugin directory..."
mkdir -p "$PLUGIN_INSTALL_DIR"

echo "📋 Copying plugin files..."
cp main.js manifest.json styles.css "$PLUGIN_INSTALL_DIR/"
cp -r dist/template-next "$PLUGIN_INSTALL_DIR/"

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Open Obsidian"
echo "2. Go to Settings → Community Plugins"
echo "3. Turn off 'Safe mode' if needed"
echo "4. Enable 'VaultSite'"
echo "5. Run command: VaultSite: Setup Wizard"
echo ""
echo "The plugin is installed at:"
echo "$PLUGIN_INSTALL_DIR"
