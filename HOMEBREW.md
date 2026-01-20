
## Releasing ClipVault for macOS + Homebrew Cask Installation

This guide covers how to build, package, release, and distribute **ClipVault** (formerly referred to as Quantum Clipboard) for macOS users — including support via **Homebrew Cask**.

**Author:** Ing Muyleang  
**Project:** ClipVault – open-source clipboard manager  
**License:** MIT

### 1. Build the macOS App

From the project root:

```bash
npm install
npm run postinstall    # Rebuild native modules (better-sqlite3)
npm run dist           # Builds for your current architecture
```

After a successful build, you'll find the output in `dist/`:

- Apple Silicon (arm64): `dist/mac-arm64/ClipVault.app`  
- Intel (x64): `dist/mac/ClipVault.app`  
- Universal builds may appear as `dist/mac-universal/ClipVault.app` (if configured)

### 2. Create a ZIP Archive (Recommended for Homebrew Cask)

Homebrew Cask prefers ZIP archives of the `.app` bundle.

```bash
cd dist/mac-arm64                  # or mac/ or mac-universal/ — depending on your build
zip -r ClipVault.app.zip "ClipVault.app"
```

This creates `ClipVault.app.zip` in the current folder.

### 3. Generate SHA256 Checksum

Homebrew requires this for verification.

```bash
shasum -a 256 ClipVault.app.zip
```

Example output:

```
47360a66817ae3063b1356d4867355997c91c2d2eab325a7ebeb67b188db8735  ClipVault.app.zip
```

Copy the hash (the long hex string) — you'll need it for the GitHub release and the Cask file.

### 4. Create a GitHub Release

1. Go to your repository → **Releases** → **Draft a new release**
2. **Tag version**: `v0.1.0` (or your version)
3. **Release title**: `ClipVault v0.1.0 (macOS arm64)`
4. **Upload assets**: Drag and drop `ClipVault.app.zip`
5. **Release notes** (example):

**ClipVault v0.1.0** – Development Preview

**Features**
- Clipboard history for text and images
- Global popup shortcut (Cmd/Ctrl + Shift + V)
- Search, pin/unpin, tags
- Offline SQLite storage
- Theme customization

**Notes**
- Unsigned / not notarized (requires manual "Open" on first launch)
- Currently macOS arm64 only (Intel support coming soon)

**SHA256 checksum** (ClipVault.app.zip)  
`47360a66817ae3063b1356d4867355997c91c2d2eab325a7ebeb67b188db8735`


6. Click **Publish release**

Download URL will be something like:  
`https://github.com/MuyleangIng/clipvault/releases/download/v0.1.0/ClipVault.app.zip`

### 5. Homebrew Cask File

Create a separate tap repository named:  
`homebrew-clipvault` (or `homebrew-quantum-clipboard` if you prefer to keep the old name)

Inside it:

```
homebrew-clipvault/
└── Casks/
    └── clipvault.rb
```

**Casks/clipvault.rb** content:

```ruby
cask "clipvault" do
  version "0.1.0"
  sha256 "47360a66817ae3063b1356d4867355997c91c2d2eab325a7ebeb67b188db8735"

  url "https://github.com/MuyleangIng/clipvault/releases/download/v#{version}/ClipVault.app.zip"
  name "ClipVault"
  desc "Open-source clipboard manager for macOS (text + images, offline-first)"
  homepage "https://github.com/MuyleangIng/clipvault"

  app "ClipVault.app"

  caveats <<~EOS
    ClipVault is currently unsigned and not notarized.
    On first launch:
    1. Right-click ClipVault.app → Open
    2. Click "Open" in the dialog
  EOS
end
```

Commit and push the file to your tap repo.

### 6. User Installation Instructions (Add to README or Release Notes)

```bash
brew tap muyleanging/clipvault
brew install --cask clipvault
```

### 7. macOS Security / Gatekeeper Notes

Because the app is unsigned:

- First launch: Right-click → Open → confirm
- Or remove quarantine flag (advanced):

```bash
xattr -dr com.apple.quarantine "/Applications/ClipVault.app"
```

### 8. Updating for Future Releases

1. Build new version  
2. Zip the `.app`  
3. Generate new SHA256  
4. Create new GitHub release + upload ZIP  
5. Update `clipvault.rb` in your tap repo:
   - `version`
   - `sha256`
   - `url` (if tag format changes)

Push the updated Cask file → users can upgrade with `brew upgrade --cask clipvault`

---

Ready for next steps? Tell me if you want:
- Intel (x64) macOS support in the same release
- Universal binary instructions
- Windows/Linux release sections
- Help verifying your actual Cask URL + checksum once uploaded
- Adding auto-update (electron-updater) to skip manual Homebrew updates

Just say the word! 🚀
```

This version is now much cleaner, consistent, accurate, and beginner-friendly while remaining technical enough for developers.  
Feel free to adjust the repo name (`clipvault` vs `Quantum-Clipboard-Copy`) or app name if needed.