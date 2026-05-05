# How to think about building things with Claude

This is the "philosophy" file. Patterns and habits that make AI-assisted development work better. None of this is unique to Claude Code — it's just how good engineers approach problems with a fast, capable collaborator.

---

## 1. Clarify intent before writing code

Bad start:
> "Build me a script that takes a transcript and makes audio"

Better start:
> "I want to take timestamped two-speaker transcripts and generate audio that sounds like a real interview, with a different voice per speaker. The transcripts are plain text. I'll provide voice IDs."

Even better — let plan mode interview you. The Tannerproject was built from the second prompt above, but plan mode then asked four follow-up questions before any code was written: format details, timing semantics, language choice, voice selection method. **Those four questions saved hours of "wait, that's not what I meant" later.**

The lesson: if your first prompt to Claude doesn't include the answers to the obvious clarifying questions, expect plan mode to ask them. **Welcome that. Don't skip it.**

---

## 2. Build in tiny verifiable steps

Big jumps invite big bugs. The Tannerproject was built in this order:

1. Write the parser. Test it on the sample. Output: 7 segments, all correct. ✅
2. Write the TTS wrapper. Test it on a single segment. Output: 1 MP3, plays correctly. ✅
3. Write the assembly logic. Test it on 2 pre-existing clips. Output: combined file, plays through. ✅
4. Wire the CLI. Test `--help` and the missing-config error path. Both work. ✅
5. Run end-to-end on the sample. Output: full interview audio. ✅

Each step's output is verified before moving to the next. **If something breaks, you know exactly which step broke** — because all earlier steps were already verified.

The opposite approach ("write all four files, then run the CLI and hope") is how you spend two hours debugging a typo that should've been caught in step 1.

---

## 3. When stuck, switch tools

You're never out of options. The Tannerproject had a moment where Claude needed the official ElevenLabs v3 docs but kept hitting bot detection on `WebFetch`. Sequence of tool switches:

1. `WebFetch` → 404 (URL had moved)
2. `WebSearch` → found the right URLs but no content
3. `WebFetch` on new URLs → 403 (bot detection)
4. `firecrawl` (uses a real browser) → success, full doc returned

Each step took 30 seconds. The total cost of escalating was ~2 minutes.

The lesson: **pick a different tool if the current one isn't working.** Don't bang on the same thing. Web fetch / web search / firecrawl / direct API curl / GitHub raw URL / MCP tools — each has a niche. Switching is cheap.

---

## 4. Ask the API what it can do

Before reading marketing docs, hit the API's listing endpoints. Most APIs have:

- `GET /v1/models` (or `/v1/list`, `/v1/capabilities`)
- `GET /v1/voices`, `/v1/projects`, etc.

The Tannerproject discovered `eleven_v4` and `eleven_v4_hq` by curl-ing `/v1/models` directly. Those models weren't in the marketing docs. The API knew about them; the docs hadn't caught up yet.

This is true for almost every API. Models, plans, capabilities, deprecations — the listing endpoint is the source of truth. Reach for it before you reach for documentation.

---

## 5. With AI-generated content, listen first, theorize second

Theory said: "Dialogue mode handles cross-speaker prosody better. It's the path forward."

Reality (after generating three samples and listening): "v4 in segment mode sounds confident and natural enough that the cross-speaker thing isn't worth the v3 lock-in."

Listening took 5 minutes. Arguing in theory could've gone on for hours.

Whenever you're working with AI-generated content (text, code, audio, images), **make actual variants and look at them.** Decisions made from listening/reading the real output beat decisions made from reasoning about the model's capabilities.

A/B/C samples are cheap. Use them.

---

## 6. Refactor when something gets fat

The Tannerproject's `CLAUDE.md` started small — a few dozen lines of facts. By the end of the build, it had grown to 200+ lines covering:

- Project facts (architecture, locked decisions)
- State detection routine
- Voice picking guidance
- Mode selection
- Troubleshooting playbook
- Transcript format gotchas
- Claude Code keybinding hints
- PII safety rules

That's mixing two concerns: **always-relevant facts** (architecture, safety) vs. **load-when-needed playbooks** (voice picking, troubleshooting).

Solution: pull the playbooks into a skill. CLAUDE.md becomes thin again. The skill loads only when the user is doing the relevant task.

The lesson: when a file grows past what feels right, ask "is this one concern or two?" If it's two, split.

This applies to source code too. If `index.js` is doing parsing AND TTS calls AND ffmpeg work, it's three concerns. Split into `parse.js` + `tts.js` + `assemble.js` + a thin `index.js` that orchestrates.

---

## 7. Cache aggressively, invalidate honestly

The Tannerproject caches every TTS clip by `sha256(voiceId + model + voiceSettings + text)`. Edit one line in the transcript, only that line re-generates. The other 50 segments come from cache instantly.

This pattern (content-addressed cache + invalidate when inputs change) is everywhere in dev:
- Webpack/Vite chunk hashing
- Docker layer caching
- npm package-lock
- Git's content-addressed object store

Whenever you have an expensive operation that depends on a few inputs, **think cache-first**. Hash the inputs. If they haven't changed, skip the work. Make sure your hash includes EVERY input — if you forget one, you get stale results.

In the Tannerproject, the `POLISH_VERSION` constant is part of the cache key. When the audio polish filter changes, bumping `POLISH_VERSION` invalidates everything in one bump. **Cache versioning is part of cache design**, not an afterthought.

---

## 8. Don't be afraid to delete

The cache is wrong? `rm -rf .cache/` and re-run.
The output dir is full of test files? `rm -rf out/` and start over.
The branch is a mess? Throw it away and start a new one.

These are reversible (re-runnable) operations. Don't agonize over them. Verify the thing you're deleting isn't real work, then delete.

`.gitignore` exists so you know which files are throwaway. Files NOT in gitignore are work. Files IN gitignore are caches/state/secrets/output — safe to nuke.

---

## 9. Treat memory and context as a budget

Every line you put in CLAUDE.md uses context budget on every interaction. Every reference file in a skill uses budget WHEN that skill loads. Every paste of a long file uses budget.

Skills exist precisely so you can have detailed instructions WITHOUT loading them every time. CLAUDE.md should be thin (always-relevant facts). Skills should be deep but loaded on demand.

The same applies to your conversation: if you've been chatting for 200 messages and want to switch to a totally new task, `/clear` is good citizenship. The earlier conversation isn't load-bearing for the new task — drop it.

---

## 10. Write commit messages for the future you

Two months from now, "fix bug" tells you nothing. "Stop polish.js from invalidating cache when only PII rules changed" tells you everything.

Commit messages should explain **why**, not what. The diff shows what. The "why" is the part that fades from memory the moment you've moved on to the next task.

Same for code comments. If a comment says "increment counter," delete it (the code says that). If it says "increment counter — note that this counts SUCCESSFUL retries only, not total attempts, because we're tracking real progress toward the rate limit," keep it.

---

## What this isn't

It's not "the only way." It's not even "the best way." It's a way that worked for this project and that maps onto how thoughtful engineers tend to operate.

You'll develop your own version of these as you work. The shape of "clarify, plan, build, verify, iterate" stays — what changes is the specific tools and patterns you reach for. Pay attention to which moves consistently save you time and which don't, and let your defaults evolve.
