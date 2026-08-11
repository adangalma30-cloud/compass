---
name: Compass release branches
description: Branching and release-safety preference for Compass Android work.
---

Versioned Compass releases must be developed and pushed on their requested release branch, starting from the previous version and carrying forward required baseline files without modifying `main`.

**Why:** The user explicitly wants `main` protected while each APK version is assembled as a complete, independently buildable branch.

**How to apply:** Before changes, verify the active branch and remote base; after changes, push only the requested release branch and confirm the remote `main` commit is unchanged.