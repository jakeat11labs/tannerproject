# Tanner's Project

A small home for the things Jake and Tanner build together during their 1:1 sessions — half learning, half real engineering. Each session typically produces a working tool plus the artifacts to learn from (the dev session transcript, a tutor-mode skill, a teaching CLAUDE.md). Things accumulate here over time.

**For the polished landing page with audio samples, visit https://jakeat11labs.github.io/tannerproject/.**

---

## 📚 Projects

### 🎙️ [`interview-audio`](./projects/interview-audio/) — Two-Voice Interview Generator

> Turns timestamped two-speaker transcripts into a single MP3 that sounds like the conversation actually happened. Distinct ElevenLabs v4 voice per speaker, expressive `[bracketed]` audio tags rendered properly.

Where it lives: [`projects/interview-audio/`](./projects/interview-audio/)
Status: **shipped, default config dialed in**
Docs: [project README](./projects/interview-audio/README.md) · [tag reference](./projects/interview-audio/TAGS.md) · [build narrative](./projects/interview-audio/CONVERSATION.md) · [verbatim session](./projects/interview-audio/CONVERSATION-RAW.md)

Quick run (after cloning):
```bash
cd projects/interview-audio
npm install
cp voices.config.example.json voices.config.json   # then fill in two ElevenLabs voice IDs
echo 'ELEVENLABS_API_KEY=sk_...' > .env
node src/index.js transcripts/sample.txt
open out/sample.mp3
```

Or just open the project in Claude Code, ask Claude to walk you through it, and it'll pick up the `interview-audio` skill (lives in `.claude/skills/`) which knows the setup flow.

---

## 🧭 How this repo is organized

```
tannerproject/
├── index.html              ← Pages directory (chronological session list)
├── sessions/               ← one HTML page per session, dated
│   ├── 2026-05-05.html     ← session 01 · two-voice interview generator
│   ├── 2026-05-10.html     ← session 02 · interview training clips
│   ├── 2026-05-11.html     ← session 02 · build notes & feedback
│   ├── 2026-05-20.html     ← session 03 · referral agent (paused at plan-mode)
│   └── 2026-05-20/         ← session 03 source materials (transcripts, visuals)
├── README.md               ← this file
├── AGENTS.md               ← Codex/agent guidance
├── CLAUDE.md               ← umbrella guidance for Claude Code
├── assets/                 ← shared brand stuff (banner, future logos)
├── .agents/skills/         ← project-local agent skills
│   └── tanner-session-processor/
├── .claude/skills/         ← Claude Code skills (work from anywhere in the repo)
│   ├── interview-audio/    ← operational walkthrough for the audio project
│   └── tutor-mode/         ← teach-me-Claude-Code mode + the case study of how this was built
└── projects/
    └── interview-audio/    ← self-contained project (its own deps, configs, samples)
```

Each project under `projects/` is fully self-contained: its own `package.json` (or `pyproject.toml` etc., depending on stack), its own `.env` and configs (gitignored), its own `README.md`, its own `CLAUDE.md`. You can `cd` into a project and treat it as a standalone repo.

The two skills at `.claude/skills/` are loaded by Claude Code based on what you ask:

- **`interview-audio`** — anything operational about the audio project (set up, generate, debug). Triggered by phrases like "set me up," "generate audio," "this isn't working."
- **`tutor-mode`** — anything about how to use Claude Code, dev patterns, why Jake did X this way, the case study of how this whole thing was built. Triggered by "how does X work?", "explain Y," "teach me Z."

Both skills auto-load on relevant questions or you can invoke them manually with `/interview-audio` or `/tutor-mode`.

The project-local skill at `.agents/skills/tanner-session-processor/` handles the recurring session-ingestion workflow: point it at raw human transcripts, Claude Code/Cursor logs, screenshots, or a docs folder, and it turns the source material into a public session page, project-page update, tracker/resource updates, and optional infographic recommendations.

---

## 🔧 Required tools (one-time setup)

| Tool | Check it works | Install if missing |
| --- | --- | --- |
| **Node.js 20+** | `node --version` | `brew install node` |
| **ffmpeg** | `ffmpeg -version` | `brew install ffmpeg` |
| **Claude Code** | `claude --version` | https://docs.claude.com/en/docs/claude-code |
| **GitHub CLI** _(optional)_ | `gh --version` | `brew install gh` |
| **ElevenLabs skills bundle** _(optional but recommended)_ | inside Claude Code, type `/text-to-speech` to confirm | `npx skills add https://github.com/elevenlabs/skills` |

For the ElevenLabs skills install, when the wizard asks: select **all** skills, coding agent **Claude Code**, scope **Global**, method **Symlink**.

---

## 📜 License

MIT.

## 💛 Credits

Built collaboratively by Jake and Tanner in Claude Code. Each project has its own session log under `projects/<name>/CONVERSATION.md` (narrative) and `CONVERSATION-RAW.md` (verbatim), so you can replay exactly how it came together.

For Tanner. You got this. 🎉
