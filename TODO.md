# Oi — TODO

## Core (Done)
- [x] PiP with live rear camera feed
- [x] Camera persists when switching apps (VoIP background mode)
- [x] Onboarding flow (3 screens)
- [x] Settings screen (auto-timeout, about, privacy)
- [x] Start/Stop controls with haptic feedback
- [x] Dark theme UI
- [x] Battery & thermal monitoring
- [x] Auto-timeout wired to settings
- [x] Siri Shortcuts — "Hey Siri, start Oi"
- [x] PiP black bar fix (portrait layer dimensions)
- [x] Standalone release build (no Metro/WiFi needed)

## Features (Shelved)
- [ ] **Lock Screen widget** — works visually but deep link causes Pegasus errors on re-open. Widget target exists in `targets/widget/`, needs URL handling fix before shipping.

## App Store Prep
- [ ] App icon (1024x1024)
- [ ] Screenshots showing PiP over real apps (texting, scrolling, maps)
- [ ] Privacy policy page (host somewhere)
- [ ] App Review notes — safety narrative, demo video, pedestrian stats
- [ ] Test without audio background mode to see if VoIP alone is sufficient
- [ ] Bundle ID finalization

## Known Issues
- [ ] Onboarding redirect flickers briefly on first completion
