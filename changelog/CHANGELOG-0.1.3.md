# Changelog – v0.1.3

## Release Date
2026-01-20

## Overview
UX and interaction stability release, focused on color picker behavior.

## Fixed
- Fixed Hex color picker closing immediately when clicking or dragging
- Prevented Escape key from closing the app while a color picker is open
- Fixed interaction conflicts with Electron draggable regions

## Improved
- Stable color selection experience
- Predictable focus handling for popovers
- Cleaner theme editing workflow

## Added
- Additional theme controls:
  - Item text color
  - Item muted text color
  - Control text color

## Internal
- Refactored color picker open/close logic
- Improved event propagation handling
- Safer outside-click detection

## Notes
- No breaking changes
- Prepares UI for future sync features
