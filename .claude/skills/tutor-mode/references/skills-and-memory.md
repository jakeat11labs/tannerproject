# Skills, memory, and CLAUDE.md — what's what

These are three different mechanisms for "things Claude knows." Understanding the differences will save you hours of confusion.

---

## The three categories

| Mechanism | Lives at | Loaded into context | What it's for |
| --- | --- | --- | --- |
| **CLAUDE.md** | Project root (`./CLAUDE.md`) | **Always**, when you're in that project | Always-relevant facts: architecture, locked decisions, safety rules |
| **Skill** | `~/.claude/skills/<name>/` (user-global) or `.claude/skills/<name>/` (project-local) | **Only when triggered** by description match or `/skill-name` invocation | Operational playbooks: workflows, troubleshooting, reference docs that load on demand |
| **MEMORY.md** | `~/.claude/projects/<project-path>/memory/MEMORY.md` (auto-managed) | **Always**, scoped to the user + project | User preferences, project context, feedback that should persist across sessions |

Three different lifetimes, three different scopes, three different purposes.

---

## CLAUDE.md — the always-loaded project bible

Every project should have one. When you `cd` into the project and run Claude Code, it reads `CLAUDE.md` automatically. Anything in it is in context for every interaction.

What belongs here:
- What the project IS (1-2 sentences)
- Architecture facts (which files do what)
- Locked design decisions (the things you wouldn't want re-debated every session)
- Safety rules (don't commit `.env`, don't echo secrets, etc.)
- Pointers to skills and references for everything else

What does NOT belong here:
- Long playbooks (move them to skills)
- Step-by-step walkthroughs (move them to skills)
- Tutorial content (move them to skills)
- Anything that's only relevant in some sessions but not others

The Tannerproject's CLAUDE.md was 200+ lines at one point — got refactored to ~50 lines once we pulled operational guidance into the `tannerproject` and `tutor-mode` skills.

You can have nested CLAUDE.md files (e.g., a different one in `frontend/` and `backend/`) and Claude reads them based on which directory it's working in.

---

## Skills — load on demand

A skill is a directory with a `SKILL.md` (and optional reference files). The `SKILL.md` has YAML frontmatter:

```yaml
---
name: my-skill
description: |
  When to trigger, what it does. Be specific. Include phrases users actually
  say. Be a little pushy about triggering.
---
```

When you ask Claude something, it scans the descriptions of available skills and picks the one whose description matches your task. Then it loads the full `SKILL.md` (and any reference files mentioned) into context.

**The description is the trigger.** A weak description means the skill won't get used when it should. A specific, "pushy" description means it triggers reliably.

### Where skills live

1. **Plugin skills** — installed via plugins. System-wide. Examples: `firecrawl`, `vercel:bootstrap`, `slack:slack-search`, `figma:figma-use`.
2. **User-global skills** — at `~/.claude/skills/<name>/`. Available across all your projects. Install via `npx skills add <repo-url>`.
3. **Project-local skills** — at `.claude/skills/<name>/` in a repo. Only available when you're working in that repo. Travel with the repo.

The Tannerproject ships two project-local skills:
- `tannerproject` — operational walkthrough (this skill loads when you want to use the project)
- `tutor-mode` — what you're in right now (loads when you want to learn)

### Why skills instead of fat CLAUDE.md

- **Context budget.** A skill loads only when triggered. CLAUDE.md is in every interaction.
- **Focus.** Each skill covers one concern. Fat CLAUDE.md mixes everything.
- **Reusability.** A well-written skill can be packaged and reused across projects (`npx skills add ./path-to-skill`).
- **Better triggering.** Skills get loaded based on task match. CLAUDE.md is a blunt "always on."

### Creating a skill

Use the built-in skill creator: `/skill-creator`. It walks you through it. Or if you know what you want, just write the files yourself — that's how the Tannerproject's two skills got created (the structure is dead simple).

Skill structure:
```
my-skill/
├── SKILL.md                ← YAML frontmatter + body (always loaded when skill triggers)
└── references/             ← optional, loaded on demand from within SKILL.md
    ├── topic1.md
    └── topic2.md
```

Inside `SKILL.md`, point at references like "load `references/topic1.md` when the user asks about X." That way the skill stays under ~500 lines and details are pulled in only when relevant.

### Invoking a skill manually

Type `/skill-name` (e.g., `/tutor-mode`, `/skill-creator`). It loads the skill into context and you can use it.

---

## MEMORY.md — auto-managed user memory

MEMORY.md is different from the others — **you don't write it directly, Claude writes it for you**.

Located at `~/.claude/projects/<project-path>/memory/MEMORY.md`. Loaded into every session for that project.

Contains:
- **User memories** — your role, preferences, knowledge level
- **Feedback memories** — corrections you've given Claude, things you don't want repeated
- **Project memories** — current initiatives, deadlines, who's working on what
- **Reference memories** — pointers to external systems ("bugs are tracked in Linear project XYZ")

Each memory is its own file with YAML frontmatter (similar to skills). MEMORY.md is just an index that points at the actual memory files.

When does Claude write to MEMORY.md? When it learns something durable about you or the project that should persist across sessions:
- "I'm a senior backend engineer, mostly Go" → user memory
- "Don't mock the database in tests, we got burned by that last quarter" → feedback memory
- "We're ripping out the old auth middleware before March 5 due to compliance" → project memory

Claude is **selective** about what gets written. Code patterns and architecture aren't memorized (that's what reading the code is for). Recent commits aren't memorized (that's what `git log` is for). Only things that are genuinely durable and not derivable from the codebase.

You can ask Claude to "remember that I prefer X" and it'll save the appropriate memory.

You can ask Claude to "forget that thing about Y" and it'll remove the relevant memory.

---

## How they fit together

Think of it as three levels of stickiness:

```
[ MEMORY.md ]              <- ~/.claude/projects/.../memory/
[ CLAUDE.md ]              <- this project's root
[ Skills ]                 <- loaded only when needed
[ Conversation context ]   <- only this session
```

When Claude opens a session in a project:
1. Reads MEMORY.md → "ah, this user is Tanner, new to dev, building a TTS pipeline."
2. Reads CLAUDE.md → "ok, here's the project's architecture and safety rules."
3. Sees what tools and skills are available (but doesn't load skill contents until triggered).
4. Starts the conversation.

When you ask "set me up to use this project":
- Claude matches the description of the `tannerproject` skill → loads it.
- Now `tannerproject/SKILL.md` is in context. It has a state-detection routine. Claude runs it.
- The result tells Claude what to do next (ask for API key, ask for voice IDs, etc.)
- Conversation proceeds. Claude doesn't need `tutor-mode` content for this; that skill stays unloaded.

When you later ask "explain plan mode":
- Claude matches the description of the `tutor-mode` skill → loads it.
- Now `tutor-mode/SKILL.md` is in context, plus it pulls in `references/claude-code-basics.md` for the actual answer.
- Claude explains plan mode, citing this project as the example.

---

## Common mistakes to avoid

1. **Putting playbooks in CLAUDE.md.** They balloon. Move them to a skill. CLAUDE.md should be facts the agent always needs.
2. **Putting one-off context in MEMORY.md.** Memory is for things that persist across sessions. "Today we're refactoring auth" goes in conversation context, not memory.
3. **Skipping the skill description.** Without a strong description, your skill never triggers. Treat the description like a tagline — specific, action-oriented, with realistic user phrases.
4. **Skill that's too narrow.** A skill for "how to write a single specific function" is overkill. Skills are best for workflows or domains (e.g., "deploy to Vercel," "debug a Postgres query," "drive the Tannerproject").
5. **Skill that's too broad.** "Skill for software engineering" — meaningless. Skills should match a recognizable task category.

---

## When to use what — quick decision tree

> The user just told me a fact about themselves or their project that I'd want to know in the next session.
**→ MEMORY.md**

> This project always needs Claude to know X (architecture, safety rule, locked decision).
**→ CLAUDE.md**

> This is a workflow / playbook / domain that's only relevant when the user is doing a specific task.
**→ Skill** (project-local if it ships with the repo; user-global or plugin if it's reusable across projects)

> This is just for the current conversation.
**→ Don't write it down. Let context handle it.**
