# ClipVault

**ClipVault** is a fast, offline clipboard manager for text and images.  
Built with Electron + React + Vite + SQLite (better-sqlite3).  
Opens with a global shortcut, supports search, pinning, tags, themes, and keyboard-first navigation.

**Author:** Ing Muyleang  
**License:** MIT

## Quick Install (macOS via Homebrew)

```bash
brew tap muyleanging/quantum-clipboard
brew install --cask quantum-clipboard
```

**⚠️ First launch note**: Unsigned app — run once:  
```bash
xattr -dr com.apple.quarantine "/Applications/Quantum Clipboard.app"
```

See [Homebrew Installation](#homebrew-installation-macos) for full details.

For other platforms or building from source, see below.

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

3. Rebuild native modules

```bash
npm run postinstall
```

4. Start dev mode

```bash
npm run dev
```

## Usage

**Open popup**  
`CommandOrControl + Shift + V`

**Keyboard shortcuts**  
- ↑ / ↓          Navigate  
- Enter          Copy selected item  
- Esc            Close  
- Cmd/Ctrl + K   Focus search

**Copying items**  
1. Copy text/image normally  
2. Open popup  
3. Select → Enter / click Copy

## Data Storage

Local SQLite database.

**Locations**  
- macOS: `~/Library/Application Support/clipvault/clipvault.sqlite`  
- Windows: `%APPDATA%\clipvault\clipvault.sqlite`  
- Linux: `~/.config/clipvault/clipvault.sqlite`

**Reset database** (close app first)

macOS:
```bash
rm -f ~/Library/Application\ Support/clipvault/clipvault.sqlite*
```

Linux:
```bash
rm -f ~/.config/clipvault/clipvault.sqlite*
```

Windows (PowerShell):
```powershell
Remove-Item "$env:APPDATA\clipvault\clipvault.sqlite*" -ErrorAction SilentlyContinue
```

## Production Build

```bash
npm run dist
```

Outputs go to `dist/` (installers + unpacked apps). See detailed [Production Build](#production-build) section below.

## Production Build (detailed)

ClipVault uses **electron-builder**.

After `npm run dist`:

**Output location**: `dist/` (customizable in `package.json` → `"directories": {"output": "releases"}`)

**macOS** (`"target": ["dmg"]`):
- `ClipVault-0.1.0.dmg`
- `mac-arm64/ClipVault.app` (or universal)

**Windows** (`"target": ["nsis"]`):
- `ClipVault Setup 0.1.0.exe`
- `win-unpacked/ClipVault.exe`

**Linux** (`"target": ["AppImage", "deb"]`):
- `ClipVault-0.1.0.AppImage`
- `clipvault_0.1.0_amd64.deb`

Test tips, platform-specific builds, and customization → see earlier detailed notes.

**package.json targets**:

```json
"mac": { "target": ["dmg"], "icon": "build/icon.icns" },
"win": { "target": ["nsis"] },
"linux": { "target": ["AppImage", "deb"] }
```

## Icons

Create `build/icon.png` (1024×1024), convert to `.icns` (macOS), etc. (see your original steps).

## Contributing

Branch → `npm run dev` → PR with description + screenshots.

## macOS Security / Gatekeeper

Unsigned app — on first launch:

- Right-click → Open → confirm  
OR  
```bash
xattr -dr com.apple.quarantine "/Applications/Quantum Clipboard.app"
```

## Homebrew Installation (macOS)

**Quantum Clipboard** is available via custom tap.

1. Add tap & install

```bash
brew tap muyleanging/quantum-clipboard
brew install --cask quantum-clipboard
```

2. Bypass Gatekeeper (once)

```bash
xattr -dr com.apple.quarantine "/Applications/Quantum Clipboard.app"
```

3. Launch

Double-click in Applications or:
```bash
open -a "Quantum Clipboard"
```

**Uninstall**:
```bash
brew uninstall --cask quantum-clipboard
brew untap muyleanging/quantum-clipboard
```

**Why xattr?** No paid Apple Developer ID for notarization — common for open-source Electron apps.

## License

MIT © Ing Muyleang

