---
name: AI provider fallback
description: Why the study companion keeps a local reply path when Gemini access is unavailable
---

T-Assist should keep the chat usable when live Gemini access is unavailable. The provider is valuable for richer multimodal replies, but a friendly local fallback prevents provider limits or configuration gaps from turning the core learning flow into a dead end.

**Why:** Replit AI access was not available on the current plan, so the app uses the student's own Gemini secret while preserving a working experience if the provider request fails.

**How to apply:** Keep provider calls server-side, never expose the key, and preserve the fallback path when changing companion behavior.