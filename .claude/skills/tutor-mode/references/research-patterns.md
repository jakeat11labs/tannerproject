# How to research things with Claude

A lot of dev work is research. "How does ElevenLabs v3 work?" "What does Vercel charge?" "How do other projects solve this?" The Tannerproject hit several research moments and used different tools each time. Here's the playbook.

---

## The research escalation ladder

When you need to know something, try these in order. Move down only if the previous step didn't get you what you need.

### 1. Check what you already know
What's in the conversation context already? Did Claude already see this file/page/API response? If yes, you don't need to fetch it again — just refer to it.

### 2. Read the source
If it's a source file (in this repo or another project), use the **Read** tool. Faster than searching the web for "how does X work" when X is in front of you.

### 3. Hit the API directly
If you're integrating with a service, hit its listing endpoints first:
- `GET /v1/models` (or `/v1/list`, `/v1/capabilities`)
- `GET /v1/voices`, `/v1/projects`, etc.

The Tannerproject discovered `eleven_v4` by `curl`-ing `/v1/models`. Those models weren't in any docs at the time. APIs know about themselves; docs catch up.

```bash
KEY=$(grep -E '^ELEVENLABS_API_KEY=' .env | cut -d= -f2-)
curl -sH "xi-api-key: $KEY" https://api.elevenlabs.io/v1/models | jq
```

### 4. Web search for the right URL
If you need docs and don't know the URL, **WebSearch** finds it. WebSearch is good at finding URLs but doesn't return full page content — pair it with a fetch tool.

### 5. Fetch the docs
- **WebFetch** — the simple option. Works for static pages. Sometimes blocked by bot detection.
- **firecrawl** — uses a real browser, handles JS-rendered SPAs and bot-protected pages. Slower but more reliable.

The Tannerproject's docs research:
1. WebFetch on the v3 prompting URL → 404 (URL had moved)
2. WebSearch → got the new URL
3. WebFetch on the new URL → 403 bot detection
4. **firecrawl** → success, full doc

Total time to escalate: ~2 minutes. Don't bang on a tool that's not working.

### 6. Read open-source competitors
GitHub has the source for almost every major library and lots of products. Don't read marketing docs — read the actual code.

For the Tannerproject's "how do other projects do multi-voice TTS naturally?" question, Claude pulled raw source from `souzatharsis/podcastfy`:

```bash
curl -sL https://raw.githubusercontent.com/souzatharsis/podcastfy/main/podcastfy/text_to_speech.py
```

The conclusion ("they just `combined += segment`, no fancy post-processing") came from reading 30 lines of Python — way faster than skimming 5 blog posts.

GitHub raw URLs follow this pattern:
```
https://raw.githubusercontent.com/<user>/<repo>/<branch>/<path>
```

The repo's tree (file listing) is at:
```
https://api.github.com/repos/<user>/<repo>/git/trees/<branch>?recursive=1
```

### 7. Use MCP-backed tools for authenticated services
If the service requires login (Slack, Linear, Notion, internal tools), there's probably an MCP integration. Examples available in Claude Code:
- `mcp__plugin_slack_*` for Slack search/messaging
- `mcp__plugin_neon_*` for Neon Postgres
- `mcp__plugin_vercel_*` for Vercel deployments
- `mcp__chrome-devtools__*` for browser automation
- `mcp__ElevenLabs__*` for ElevenLabs

These work like API calls but with auth handled automatically. Use them when you need to actually do something inside a service, not just read its public docs.

### 8. Ask in chat
Last resort. If the answer isn't in code, isn't in docs, isn't in an API listing, and isn't on Stack Overflow — sometimes you just have to ask the user (or in our case, Jake) what they know.

---

## Research patterns that came up in this project

### Pattern A: "What's the actual capability of this service?"

**Don't** read the marketing page. **Do** hit the listing endpoint.

Example: "What models does ElevenLabs offer?" — hit `/v1/models`, get a 14-row table. Done.

### Pattern B: "Are other people doing this differently?"

**Don't** read 5 blog posts. **Do** find the most popular open-source competitor and read 100 lines of their source.

Example: "How does Podcastfy combine multi-voice audio?" — read `text_to_speech.py`, see they just append segments. 30 seconds of reading saved an hour of speculation.

### Pattern C: "Is this still accurate?"

Docs go stale. APIs change. Check freshness signals:
- When was the doc page last updated? (often shown in the page footer or header)
- What does the API actually return today? (hit it directly)
- Is there a recent issue/PR/changelog mentioning this? (`gh repo view`, `gh issue list`)

### Pattern D: "How should I think about this trade-off?"

If the trade-off is technical (e.g., "dialogue mode vs segment mode"), don't argue in theory — generate variants and listen/test. The Tannerproject's A/B/C/D test in 3 minutes settled a question that could've been a 1-hour discussion.

### Pattern E: "What's the recommended way?"

For genuinely opinionated questions (e.g., "how should I structure this Next.js app?"), Vercel/Anthropic/Google all have official "best practices" docs. Find them via WebSearch, but **also** check what high-traffic open-source projects actually do. Sometimes the official recommendation lags behind real-world consensus.

---

## What to NOT do when researching

- **Don't read the same doc page 4 times.** If WebFetch gave you the page once, refer back to it; don't re-fetch.
- **Don't go to Twitter/Reddit for technical answers.** Faster to read source.
- **Don't ask Claude to "summarize the docs."** Better to have Claude fetch the docs and quote the relevant sections directly.
- **Don't skip the "ask the API" step.** It's 30 seconds and often answers the question definitively.
- **Don't trust marketing docs over the actual API.** Marketing pages get out of date.

---

## A small library of useful one-liners

```bash
# What models does this account have access to?
curl -sH "xi-api-key: $KEY" https://api.elevenlabs.io/v1/models | jq -r '.[].model_id'

# Get a GitHub repo's file tree
curl -sL "https://api.github.com/repos/<user>/<repo>/git/trees/main?recursive=1" | jq -r '.tree[].path' | grep -i <pattern>

# Pull a specific file from GitHub raw
curl -sL "https://raw.githubusercontent.com/<user>/<repo>/main/<path>" -o local.py

# Check the latest version of an npm package
npm view <package-name> version

# Check the Python package version
pip index versions <package-name>

# Quick view of HTTP response codes for a URL
curl -sI <url> | head -1
```

These are worth memorizing. They're fast and they answer real questions you'll have repeatedly.
