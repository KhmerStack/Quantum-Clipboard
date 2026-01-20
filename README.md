


# ClipVault

**ClipVault** is a fast, offline clipboard manager for text and images.  
Built with Electron + React + Vite + SQLite (better-sqlite3).  
Opens with a global shortcut, supports search, pinning, tags, themes, and keyboard-first navigation.

**Author:** Ing Muyleang  
**License:** MIT

## Why ClipVault?

- Lightweight popup-style clipboard history  
- 100% local (no cloud, no tracking)  
- Stores both **text** and **images**  
- Secure Electron architecture with contextBridge IPC  
- Cross-platform: macOS (Intel & Apple Silicon), Windows, Linux

## Features

- Clipboard history (text + images)  
- Global shortcut popup (default: `⌘⇧V` / `Ctrl+Shift+V`)  
- Search (text content or `image` to filter images)  
- Pin important items  
- Add tags  
- Delete / Clear all  
- Tray / menu bar access (Open, Quit, version)  
- Custom themes (accent color, background)  
- Fully keyboard navigable

## Project Structure

```
src/
├─ main/        Electron main process (tray, shortcuts, sqlite, clipboard)
├─ preload/     Secure IPC bridge (contextBridge)
└─ renderer/    React UI (Vite)

dist/
├─ main/        Compiled main & preload
└─ renderer/    Production UI build

build/
├─ icon.png            App icon (1024×1024 source)
├─ icon.icns           macOS app icon
└─ trayTemplate.png    macOS tray icon (22×22 monochrome)
```

## Requirements

- Node.js **18+** (LTS recommended)  
- npm  
- No Python or other runtimes required

> **Native modules**  
> Uses `better-sqlite3`. Electron rebuilds it automatically via `postinstall`.

## Development Setup

1. Clone & enter directory

```bash
git clone https://github.com/YOUR_USERNAME/clipvault.git
cd clipvault
```

2. Install dependencies

```bash
npm install
```

3. Rebuild native modules (critical for better-sqlite3)

```bash
npm run postinstall
```

4. Start dev mode (hot-reloading UI + Electron)

```bash
npm run dev
```

## Usage

**Open popup**  
`CommandOrControl + Shift + V`

**Keyboard shortcuts**  
- ↑ / ↓          Navigate  
- Enter          Copy selected item to clipboard  
- Esc            Close popup  
- Cmd/Ctrl + K   Focus search

**Copying items**  
1. Copy text or image normally (⌘C / Ctrl+C, screenshot, etc.)  
2. Open ClipVault popup  
3. Select item → Enter or click Copy

## Data Storage

All data saved locally in SQLite.

**Default locations**  
- macOS: `~/Library/Application Support/clipvault/clipvault.sqlite`  
- Windows: `%APPDATA%\clipvault\clipvault.sqlite`  
- Linux: `~/.config/clipvault/clipvault.sqlite`

**Reset / clear database** (close app first)

macOS
```bash
rm -f ~/Library/Application\ Support/clipvault/clipvault.sqlite*
```

Linux
```bash
rm -f ~/.config/clipvault/clipvault.sqlite*
```

Windows (PowerShell)
```powershell
Remove-Item "$env:APPDATA\clipvault\clipvault.sqlite*" -ErrorAction SilentlyContinue
```


## Production Build

ClipVault uses **electron-builder** to create ready-to-distribute installers (and unpacked versions for testing).

Run this command from your project root:

```bash
npm run dist
```

### What happens after the build finishes?

All output files are automatically saved in the **`dist/`** folder (right next to your `package.json`).

- This is the **default output directory** — you can change it in `package.json` if needed (see "Customize output folder" below).

### Files you'll find in `dist/` (examples by platform)

**macOS** (when `"target": ["dmg"]`):
- `ClipVault-0.1.0.dmg`               ← Installer disk image (what users download and install)
- `ClipVault-0.1.0-arm64.dmg`         ← If building for Apple Silicon separately
- `mac/` or `mac-universal/`          ← Unpacked app folder
  └─ `ClipVault.app/`                 ← The full runnable macOS application (great for testing)

**Windows** (when `"target": ["nsis"]`):
- `ClipVault Setup 0.1.0.exe`         ← Installer executable (NSIS wizard style)
- `win-unpacked/`                     ← Unpacked / portable version
  └─ `ClipVault.exe`                  ← Run directly without installing

**Linux** (when `"target": ["AppImage", "deb"]`):
- `ClipVault-0.1.0.AppImage`          ← Portable single-file executable (chmod +x and run)
- `clipvault_0.1.0_amd64.deb`         ← Debian/Ubuntu package
- `linux-unpacked/`                   ← Unpacked version for testing

You may also see:
- `latest.yml` / `latest-mac.yml` etc. → Metadata files (used if you add auto-updates later)
- Blockmap files (`.blockmap`)        → For differential updates

### Quick tips after building

- **Test immediately**:  
  - macOS → Double-click the `.app` in `dist/mac/` or mount the `.dmg`  
  - Windows → Run the `.exe` installer or double-click `ClipVault.exe` in `win-unpacked/`  
  - Linux → `chmod +x ClipVault-*.AppImage` then `./ClipVault-*.AppImage`

- **Clean old builds**: Delete the `dist/` folder before running `npm run dist` again.

- **Build only for one platform** (useful on CI or when cross-building):
  ```bash
  npm run dist -- --mac       # macOS only
  npm run dist -- --win       # Windows only
  npm run dist -- --linux     # Linux only
  npm run dist -- --mac --win # Multiple platforms
  ```

### Customize output folder (optional)

If you don't like `dist/`, add this to the `"build"` section in `package.json`:

```json
"build": {
  "directories": {
    "output": "releases"              // or "builds", "out", "dist-${version}", etc.
  },
  // ... your mac/win/linux targets ...
}
```

After this, files will appear in `releases/` instead.

> **Note**: The exact filenames depend on your `package.json` → `"version"`, `"productName"`, platform, architecture, and `artifactName` config (if set).  
> Default pattern is usually something like `${productName} Setup ${version}.${ext}` or `${productName}-${version}-${os}-${arch}.${ext}`.




### macOS packaging (in package.json)

```json
"build": {
  "mac": {
    "target": ["dmg"],
    "category": "public.app-category.productivity",
    "icon": "build/icon.icns"
  }
}
```

### Windows

```json
"win": {
  "target": ["nsis"]
}
```

### Linux

```json
"linux": {
  "target": ["AppImage", "deb"]
}
```

**Linux arm64 note**: Build on arm64 machine for native modules.

## Icons

**App icon**  
Place 1024×1024 PNG at `build/icon.png`, then run:

```bash
cd build
mkdir -p icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
# ... (all sizes as before) ...
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset
```

**Tray icon (macOS only)**  
`build/trayTemplate.png` — 22×22 monochrome (optional `@2x`)

## Contributing

```bash
git checkout -b feature/your-feature
npm install
npm run dev
```

PRs welcome! Please include:  
- Clear description  
- Screenshots (UI changes)  
- Tested platforms

## License

MIT © Ing Muyleang
