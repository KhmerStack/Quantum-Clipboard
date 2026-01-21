# 🗺️ Product Roadmap

**Project:** ClipVault (Platform Foundation)
**Current Version:** v0.1.3
**Status:** 🟢 Active Development

---

## 🟢 Phase 1: Local Stability & Foundations
*Focus: User Experience, Bug Fixes, and Data Safety (No Cloud yet).*

### v0.1.3 — UX Polish (Current Focus)
- [ ] **Theme Picker:** Fix "auto-close" issue while dragging.
- [ ] **Input Handling:** Stabilize Keyboard + Escape key behaviors.
- [ ] **Settings:** Improve panel stability and layout.
- [ ] **Reliability:** General bug fixes.

### v0.1.4 — Sync Foundations
*Goal: Prepare data architecture for cloud without breaking local users.*
- [ ] **Data Schema:** Add `schemaVersion` to local storage structure.
- [ ] **Timestamps:** Add `updatedAt` to all clip entries (Critical for sync).
- [ ] **Backup:** Implement "Export JSON backup" to prevent data loss.
- [ ] **Restore:** Implement "Import JSON" functionality.
- [ ] **UI:** Add "Sync (Coming Soon)" placeholder.

---

## 🔵 Phase 2: The Cloud Era (Firebase Integration)
*Focus: Identity, Sync, and Multi-Device support.*

### v0.2.0 — Identity & Auth (Beta)
*Goal: Secure Login system. Sync is DISABLED in this version.*
- [ ] **Auth:** Integrate Firebase Authentication (Google + GitHub).
- [ ] **Database:** Initialize Firestore User Profile (`users/{uid}`).
- [ ] **UI:** Create Login/Logout screens.
- [ ] **Settings:** Display account status.

### v0.2.1 — Text Sync (Safe Mode)
*Goal: Sync text clips safely using "Last-Write-Wins".*
- [ ] **Sync:** Push/Pull settings and text clips to Firestore.
- [ ] **Conflict Logic:** Use `updatedAt` timestamps to resolve conflicts.
- [ ] **Efficiency:** Text-only sync first to reduce complexity.

### v0.2.2 — Media Sync
- [ ] **Storage:** Firebase Storage integration for images.
- [ ] **Optimization:** "Lazy Fetch" images (download only when needed).
- [ ] **Caching:** Cache images locally to save bandwidth.

### v0.2.3 — Multi-Device Robustness
- [ ] **Identity:** Unique `deviceId` tracking.
- [ ] **Conflicts:** "Conflict Copy" creation (keep both versions if unsure).
- [ ] **Status:** UI indicators for Sync Status, Errors, and Pending Uploads.

---

## 🟣 Phase 3: Platform Expansion
*Focus: Expanding from a tool to the QEdu/QuSpace ecosystem.*

### v0.3.0 — Platform Launch
- [ ] **Web:** Public landing page (Download / Docs / Changelog).
- [ ] **Architecture:** Unified Firebase account for multiple tools.
- [ ] **Namespace:** Structure data as `users/{uid}/apps/clipvault/`.

### v0.3.1 — Monetization Ready (Optional)
- [ ] **Limits:** Storage size limits or history length flags.
- [ ] **Backend:** Preparation for Stripe hooks.
