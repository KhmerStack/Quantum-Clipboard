
## Install via Homebrew (macOS)

**Quantum Clipboard** is available through Homebrew Cask for quick installation on macOS.

**⚠️ Important Security Note**  
Quantum Clipboard is an open-source app and is **not signed or notarized** by Apple.  
macOS Gatekeeper will prevent it from opening on first launch — this is normal for unsigned software.

### 1. Install

```bash
# Add the tap (one-time step)
brew tap muyleanging/quantum-clipboard

# Install the app
brew install --cask quantum-clipboard
```

This installs `Quantum Clipboard.app` into `/Applications/`.

### 2. Allow the App to Run (Required Once)

You may see this message:  
“Quantum Clipboard is damaged and can’t be opened. You should move it to the Trash.”

To bypass Gatekeeper, run this command **one time**:

```bash
xattr -dr com.apple.quarantine "/Applications/Quantum Clipboard.app"
```

After that:
- Double-click the app in `/Applications`
- Or search for it in Spotlight (`Cmd + Space` → "Quantum Clipboard")

### 3. Launch from Terminal (Optional)

```bash
open -a "Quantum Clipboard"
```

### Why This Extra Step?

Apple requires a paid Developer ID and notarization for seamless Gatekeeper approval.  
As a free, open-source project, Quantum Clipboard skips this — a common choice for indie macOS tools.  
The app is safe: Homebrew pulls it directly from your official GitHub release.

### Uninstall

```bash
# Remove the app
brew uninstall --cask quantum-clipboard

# (Optional) Remove the tap
brew untap muyleanging/quantum-clipboard
```

### Troubleshooting

**Still blocked after xattr?**
- Re-run the xattr command (check path/spelling: `/Applications/Quantum Clipboard.app`)
- Restart Finder: `killall Finder`
- Ensure you're using the correct build (arm64 for Apple Silicon, x64 for Intel)

**Current support**  
- ✅ macOS (Apple Silicon & Intel)  
- 🚧 Windows and Linux versions planned  

For development setup, building from source, or full features list, see the sections above.

---

This matches Homebrew's user-friendly style while setting clear expectations.  
If your repo/tap is actually named differently (e.g., `clipvault` instead of `quantum-clipboard`), just search-replace the names.
