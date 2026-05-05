# Claude Code basics — the mechanics you'll use most

This is the short list. Not every feature, just the ones you'll actually reach for in the first month.

---

## Modes — Shift+Tab to switch

Claude Code runs in different "modes" that control how aggressively it can take actions:

- **Default mode** — Claude can read, edit, run commands. Asks permission for risky things.
- **Plan mode** — Claude can read and explore, but **cannot edit any files** except a single plan file. Forces a "think first, code second" rhythm. Use this for big tasks.
- **Accept-edits mode** — Auto-approves edits without asking. Faster but less safe. Useful for repetitive tasks.

**Switch modes with Shift+Tab.** It cycles between them.

When to use plan mode:
- Starting a new feature with unclear requirements
- Refactoring something that touches multiple files
- Anytime you'd rather see the plan than watch Claude jump to code

After Claude drafts the plan, you approve it (or push back), then it kicks into execution.

---

## Esc Esc — undo what Claude just did

Hit **Escape twice** in the chat. A list of your previous messages appears. Click any earlier message and Claude reverts all changes back to that point — files, edits, everything.

This is a lifesaver. Whenever Claude takes a wrong turn, Esc Esc, click two messages back, redirect.

You don't need to memorize complicated git tricks for "undo." Esc Esc handles it.

---

## Slash commands — type `/`

Slash commands are shortcuts that invoke a specific behavior. Type `/` in the chat and you'll see a list. The most useful:

- **`/init`** — Sets up a `CLAUDE.md` file for the current project (this is how the Tannerproject's CLAUDE.md was created).
- **`/help`** — Shows all commands.
- **`/clear`** — Clears the conversation history. Use this when you're switching tasks and the prior context is no longer useful (saves context window).
- **`/skill-creator`** — Opens the skill creator (this is what we used to create `tannerproject` and `tutor-mode`).
- **`/loop`** — Run a prompt on a recurring interval. Useful for "check the deploy every 5 minutes" type tasks.
- **`/security-review`** — Reviews pending changes for security issues.

Slash commands are pluggable — you can install more via `npx skills add ...`.

---

## `@` references — point at files

In chat, type `@` and a file picker appears. Pick a file. Claude includes that file's content in the message.

Use this to be specific:
> "Look at @src/index.js — why is line 47 doing the thing in this weird way?"

vs. the worse alternative:
> "There's a file in this project called index.js or maybe main.js, and it has a function that..."

`@`-references save context and reduce ambiguity.

---

## Skills — installable behavior

Skills are pre-written instructions Claude loads when it matches the task you described. They live in a few places:

- **Plugin skills** — installed system-wide (e.g., `firecrawl`, `vercel:bootstrap`, `slack:slack-search`).
- **User-global skills** — at `~/.claude/skills/<name>/`. You install via `npx skills add <repo-url>`.
- **Project-local skills** — at `.claude/skills/<name>/` inside a repo. Travel with the repo. The Tannerproject has two of these (`tannerproject` and `tutor-mode`).

How they work: each skill has a `SKILL.md` with a YAML header (name + description). When you ask Claude something, it looks at the descriptions of available skills and picks the relevant one. Then it loads that skill's full SKILL.md into context and follows its instructions.

You can also invoke a skill manually: type `/skill-name` (e.g., `/skill-creator`).

To install ElevenLabs skills (which the Tannerproject uses):
```bash
npx skills add https://github.com/elevenlabs/skills
```
The wizard asks: select all → Claude Code → Global → Symlink.

For the deeper "what is a skill, what's MEMORY.md, what's CLAUDE.md" walkthrough, load `references/skills-and-memory.md`.

---

## CLAUDE.md — project instructions

Every project should have a `CLAUDE.md` at its root. When you open the project in Claude Code, Claude reads it automatically. It contains:
- What the project is
- Architectural facts (which files do what, locked design decisions)
- Safety rules (don't commit secrets, etc.)
- Pointers to skills, references, or anything else the agent should know

Don't dump everything into CLAUDE.md. If a section is "load this when the user is doing X," that's a skill, not CLAUDE.md content.

You can have nested CLAUDE.md files (e.g., a different one in `frontend/` and `backend/`) and Claude reads them based on which directory it's working in.

---

## Hooks — automation in `settings.json`

Hooks are shell commands that run at specific moments (before a tool call, after a stop, etc.). They live in `~/.claude/settings.json` (user-global) or `.claude/settings.json` (project-local).

Examples of useful hooks:
- "Run prettier after every file edit"
- "Notify me on macOS when Claude finishes a long task"
- "Block edits to `.env` always"

Hooks are how you make Claude Code feel customized to your workflow. The `/update-config` slash command helps you set them up.

---

## Memory — what Claude remembers across sessions

Two kinds:

1. **`MEMORY.md`** at `~/.claude/projects/<project-path>/memory/MEMORY.md` (auto-managed by Claude). Stores user preferences, project context, feedback. Loaded into every session for that project.
2. **`CLAUDE.md`** in the project root. Loaded into every session. You write this manually (or via `/init`).

Memory is for things that should persist across sessions. Conversation context is for things that only matter during the current session.

For the deeper dive, load `references/skills-and-memory.md`.

---

## Permissions — auto-allow safe commands

If you find yourself constantly approving the same permission ("can I run `npm install`?", "can I read this file?"), add it to `settings.json` so Claude auto-approves it.

The `/fewer-permission-prompts` slash command scans your recent conversations and suggests an allowlist for the most common things you've been approving.

---

## Things that aren't basics but you'll wonder about

- **Subagents** — Claude can spawn another Claude to handle a sub-task in parallel. Useful for "research these 5 things at once" or "test all variants in parallel." Triggered by the `Agent` tool.
- **Background tasks** — Long-running commands can run in the background. Use `run_in_background=true` on the Bash tool.
- **MCP (Model Context Protocol)** — A way for Claude to talk to external services through pluggable tools. The `mcp__ElevenLabs__*` tools we used in this project are MCP-driven.
- **Plugins** — Bundles of skills + tools + hooks shipped together (e.g., the Vercel plugin, the Slack plugin). Installable.

You don't need to learn these on day one. They'll come up when they come up.

---

## What to try first

If you've read this far and want to play:

1. Open any project (or create an empty folder).
2. Type `claude` to start a session.
3. Ask: "Walk me through what's in this folder."
4. Then: "Hit Shift+Tab and tell me what mode you're in now."
5. Try: type `/help` and skim the slash commands.
6. Make Claude do something small (rename a variable, write a single function), and use Esc Esc to undo it. Get comfortable with undo.

After that, plan-mode + Shift+Tab + Esc Esc + `@`-references + `/clear` will cover 90% of your day-to-day.
