
#!/bin/bash
set -e

# Project Directories
PROJECT_DIR="$(pwd)"
DEPLOY_DIR="$HOME/LinuxEverything"
DESKTOP_FILE="$HOME/.local/share/applications/linux-everything.desktop"

echo "🚀 Starting Build & Deploy Process..."

# 1. Verification of Environment
if [ ! -d "$PROJECT_DIR/libs" ]; then
    echo "❌ Error: 'libs' directory not found. Please run the setup commands in walkthrough.md first."
    exit 1
fi

# 2. Build Release Binary
echo "📦 Building Release Binary (this may take a few minutes)..."
export PKG_CONFIG_PATH="$PROJECT_DIR/pkgconfig:$PKG_CONFIG_PATH"
export LIBRARY_PATH="$PROJECT_DIR/libs:$LIBRARY_PATH"

npm run tauri build

# 3. Create Deployment Directory
echo "TB Creating deployment directory at $DEPLOY_DIR..."
mkdir -p "$DEPLOY_DIR/bin"
mkdir -p "$DEPLOY_DIR/libs"
mkdir -p "$DEPLOY_DIR/icons"

# 4. Copy Files
echo "📂 Copying files..."
cp src-tauri/target/release/linux-everything "$DEPLOY_DIR/bin/"
cp -r libs/* "$DEPLOY_DIR/libs/" # Copy our symlinked libs
cp app-icon.png "$DEPLOY_DIR/icons/le-icon-v2.png"

# 5. Create Launch Script (Shim)
echo "📝 Creating launch script..."
cat <<EOF > "$DEPLOY_DIR/launch.sh"
#!/bin/bash
export LD_LIBRARY_PATH="$DEPLOY_DIR/libs:\$LD_LIBRARY_PATH"
"$DEPLOY_DIR/bin/linux-everything"
EOF
chmod +x "$DEPLOY_DIR/launch.sh"

# 6. Install Icon to System Path (Fixes Gnome caching issues)
echo "🎨 Installing icon..."
# Clean up old icons to avoid confusion
rm -f "$HOME/.local/share/icons/hicolor/128x128/apps/linux-everything.png"
rm -f "$HOME/.local/share/icons/hicolor/128x128/apps/icon.png"

mkdir -p "$HOME/.local/share/icons/hicolor/128x128/apps"
cp "$DEPLOY_DIR/icons/le-icon-v2.png" "$HOME/.local/share/icons/hicolor/128x128/apps/le-icon-v2.png"

# 7. Create Desktop Shortcut
echo "🖥️  Creating Desktop Shortcut..."
# Clean up old desktop files
rm -f "$HOME/.local/share/applications/system-cartographer.desktop"
rm -f "$DESKTOP_FILE"

mkdir -p $(dirname "$DESKTOP_FILE")
cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Type=Application
Name=Linux Everything
Comment=Explore and learn about your Linux system
Exec="$DEPLOY_DIR/launch.sh"
Icon=$HOME/.local/share/icons/hicolor/128x128/apps/le-icon-v2.png
Terminal=false
Categories=Education;Utility;
StartupWMClass=linux-everything
EOF

# 8. Refresh Icon Cache
echo "🔄 Refreshing desktop database..."
update-desktop-database "$HOME/.local/share/applications" || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor/" || true

# 7. Trust the desktop file (Ubuntu specific)
chmod +x "$DESKTOP_FILE"

echo "✅ Build & Deploy Complete!"
echo "🎉 You can now find 'Linux System Cartographer' in your applications menu."
echo "   Or run it directly from: $DEPLOY_DIR/launch.sh"
