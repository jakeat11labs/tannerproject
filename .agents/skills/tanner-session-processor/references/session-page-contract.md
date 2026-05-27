# Session Page Contract

The session page is a learning artifact, not a raw archive.

## Public Page Content

Prefer sections like:

- What we made
- What we practiced
- Mental models
- Tools and commands
- Artifacts
- Open loops
- Next session

Keep the copy concise. The best page should let Jake quickly remember what to teach and let Tanner quickly remember what happened.

## Privacy And Safety

- Do not paste raw transcript blocks.
- Do not paste raw Claude Code logs.
- Do not include secrets, voice IDs, private customer/interview details, or private file paths unless the path itself is necessary and safe.
- Escape source-derived text before inserting into HTML.
- Keep raw material folders untracked unless the user explicitly confirms publication.

## Project Page Updates

When adding a session:

1. Add the new session card newest-first in `index.html`.
2. Bump the session number / `data-num` pattern to match nearby cards.
3. Move the latest marker/class from the old top session to the new one.
4. Add links for the session page and any related artifacts.
5. Update the learning tracker if the session resolves or adds topics.
6. Update Infographics or Resources if the session created or needs teaching aids.

## Verification

Run:

```bash
git diff --check
git status --short
```

Also run an HTML parse/check for edited pages. If a browser is available, inspect the local file URL or a screenshot for layout issues.
