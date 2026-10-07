# Changelog

All notable changes to `@ardimedia/angular-portal-azure` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.3.29] - 2026-10-07

### Changed

- **`apa-blade-detail` enforces the projected form's validators on save.** It now derives
  `blade.lifecycle.isFormValid` from the projected `NgForm` (unless the consumer supplies one) and marks invalid
  controls as touched. Previously no blade wired `isFormValid`, so `executeSaveItem` saved data that violated
  `required` / `min` / `max` / `pattern`. Consumers that relied on saving an invalid form must make the form valid or
  set their own `isFormValid`.
- **`executeSaveItem` says why it refuses.** An invalid form now shows the new `PortalLabels.formInvalid` message in
  the status bar instead of returning silently. **BREAKING** for custom label sets: `PortalLabels` has the new
  required member `formInvalid` (all built-in sets provide it).

### Fixed

- **Double-click guard.** `executeSaveItem` and `executeDeleteItem` ignore a second call for the same blade while one
  is running, and the command bar ignores clicks on a command whose async action is still running (shown as
  disabled meanwhile). A double click on Save, Order or Create used to send the request twice.
