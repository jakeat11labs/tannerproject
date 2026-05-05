# Transcript → Two-Voice Interview Audio

Turn a timestamped two-speaker interview transcript into one MP3 that sounds like the two people are actually talking — using ElevenLabs v3 with expressive `[laughs]`, `[whispers]`, `[curious]` audio tags.

You write something like:

```
[00:00:00] Tanner: [excited] Welcome to the show!
[00:00:04] Guest: [chuckles] Thanks for having me.
```

You run one command. You get an MP3 of two distinct voices having that exact conversation, with natural pacing.

---

## Who this is for

Friends new to coding, new to Claude Code, and curious about generative audio. **You don't need to understand any of the code to use this.** Claude Code will walk you through the whole thing — that's literally what `CLAUDE.md` in this repo tells it to do.

If you get stuck, just tell Claude what's happening and it'll help you. It's been pre-briefed.

## See how this was built (recommended reading)

This whole project was built in a single Claude Code session. Two docs let you see exactly how:

- **[CONVERSATION.md](./CONVERSATION.md)** — narrative, teaching-document version. Walks through the decisions, tool switches, and lessons learned. **Start here** if you're new to Claude Code.
- **[CONVERSATION-RAW.md](./CONVERSATION-RAW.md)** — verbatim transcript of every user message, assistant reply, and tool call. **Read this** if you want to see what an AI-driven dev session actually looks like end-to-end.

---

## What you need before you start

1. **A Mac (or Linux box)** — these instructions assume macOS. Windows works but the commands are slightly different.
2. **[Claude Code](https://docs.claude.com/en/docs/claude-code)** installed and working in your terminal.
3. **[Node.js](https://nodejs.org/) 20 or newer.** Check with `node --version`. If you need to install: `brew install node`.
4. **[ffmpeg](https://ffmpeg.org/).** Check with `ffmpeg -version`. Install with `brew install ffmpeg`.
5. **[GitHub CLI](https://cli.github.com/)** if you want to clone with `gh`. Optional — you can use plain git too.
6. **An [ElevenLabs](https://elevenlabs.io) account** with an API key.

If you're missing any of these, tell Claude what you're missing and it'll help you install them.

---

## Getting set up — step by step

### 1. Clone this repo

```bash
gh repo clone <username>/<repo-name>
cd <repo-name>
```

(Or use the green "Code" button on GitHub and download the zip.)

### 2. Install the ElevenLabs Claude Code skills

This is the magic that lets Claude Code talk to ElevenLabs directly — search voices, generate previews, set up your API key, all of it. Highly recommended.

In your terminal, in this project folder, run:

```bash
npx skills add https://github.com/elevenlabs/skills
```

You'll be asked a few questions. **Answer them like this:**

| Question | Answer |
| --- | --- |
| Which skills do you want to install? | **Select ALL of them.** Use the spacebar to check each, then Enter. |
| Which coding agent? | **Claude Code** |
| Install scope? | **Global** (NOT project) |
| Install method? | **Symlink** |

After this finishes, restart Claude Code so it picks up the new skills.

Why these answers?
- **All skills** because this project uses several of them (text-to-speech, voice search, API key setup, etc.) and they're all small.
- **Claude Code** because that's what you're using.
- **Global** so you can use these skills in any project, not just this one.
- **Symlink** so when ElevenLabs updates the skills, you get the updates automatically without re-installing.

### 3. Open the project in Claude Code

```bash
claude
```

Just say something like:

> "Hey, I just cloned this repo. Can you walk me through setting it up?"

Claude will detect what's missing (API key, voice IDs, dependencies) and ask you for each piece in order. You don't need to know any of the commands yourself.

If you'd rather do it manually, the next sections cover the same steps.

---

## Manual setup (if you'd rather not let Claude drive)

### Install dependencies

```bash
npm install
```

### Set your ElevenLabs API key

Create a file called `.env` in the project root with:

```
ELEVENLABS_API_KEY=sk_your_key_here
```

Get your key at: https://elevenlabs.io/app/settings/api-keys

`.env` is gitignored — it will never be committed.

### Pick two voices

Browse https://elevenlabs.io/app/voice-library and pick two voices that contrast nicely (e.g. one warm + one crisp, or one masculine + one feminine). For each voice, click it, then click the **ID** button to copy the voice ID. It'll look like `21m00Tcm4TlvDq8ikWAM`.

### Configure the speaker → voice mapping

Copy the example config:

```bash
cp voices.config.example.json voices.config.json
```

Open `voices.config.json` and replace the placeholders. The keys (`Speaker A`, `Speaker B`) need to match exactly what's in your transcript file. So if your transcript says `[00:00:00] Tanner:` then your config key is `Tanner`.

```json
{
  "Tanner": {
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "voiceSettings": {
      "stability": 0.4,
      "similarityBoost": 0.75,
      "style": 0.4,
      "useSpeakerBoost": true
    }
  },
  "Guest": "AZnzlk1XvdvUeBnXmlld"
}
```

(Either format works — full object with settings, or just a plain string with the voice ID.)

### Drop in a transcript

Put a `.txt` file in `transcripts/` formatted like this:

```
[00:00:00] Tanner: [excited] Welcome to the show!
[00:00:05] Guest: [chuckles] Thanks for having me.
[00:00:09] Tanner: [curious] Let's start with the basics.
```

A working example is already there: `transcripts/sample.txt`.

### Generate the audio

```bash
node src/index.js transcripts/sample.txt
```

Or use the npm script:

```bash
npm run generate -- transcripts/sample.txt
```

You'll see something like:

```
Transcript: /path/to/transcripts/sample.txt
Segments: 7 (Tanner, Guest)
Cache: /path/to/.cache
  [1/7] Tanner: "[excited] Welcome to the show!" (tts)
  [2/7] Guest: "[chuckles] Thanks for having me." (tts)
  ...
Assembling 7 clips → /path/to/out/sample.mp3 (cache hits: 0/7)
Done: /path/to/out/sample.mp3
```

Then:

```bash
open out/sample.mp3
```

---

## Writing better transcripts (the fun part)

The `[bracketed]` tags are how you direct delivery. They're voice-dependent — a calm voice won't shout convincingly — so experiment.

The full reference is in **[TAGS.md](./TAGS.md)**. Quick samples:

| Want… | Use… |
| --- | --- |
| Laughter | `[laughs]`, `[chuckles]`, `[giggling]` |
| Whisper | `[whispers]` |
| Pause | `…` (ellipses), `—` (em dash), or `[short pause]` / `[long pause]` |
| Emphasis | CAPITAL LETTERS in the word: `It was a VERY long day.` |
| Curiosity | `[curious]` |
| Sad / reflective | `[sad]`, `[crying]`, `[sighs]`, `[thoughtful]` |
| Excited | `[excited]` |
| Sarcasm | `[sarcastic]` |
| Accent | `[strong French accent]`, `[strong British accent]`, etc. |

Tags go right before the line they affect:

```
[00:00:00] Tanner: [excited] You won't BELIEVE what happened today!
```

Or right after, for reactions:

```
[00:00:00] Guest: It was just… insane. [sighs]
```

---

## Troubleshooting

**"`ELEVENLABS_API_KEY is not set`"**
Your `.env` file is missing or doesn't have the key in it. Check it exists in the project root with `cat .env`.

**"`voice config not found at …`"**
You haven't created `voices.config.json` yet. Run `cp voices.config.example.json voices.config.json` and edit it.

**"`voice config missing valid voice IDs for: …`"**
You still have `REPLACE_WITH_VOICE_ID` in your config, or the speaker name in your config doesn't match the speaker name in your transcript. They have to match exactly — case-sensitive.

**The output sounds robotic / no expression**
- Make sure `voiceSettings.stability` is around `0.3–0.5`. Higher = more stable but ignores tags. Lower = more expressive but more variable.
- Make sure you're on `eleven_v3` — that's the default. If you've overridden the model to `eleven_multilingual_v2`, the `[brackets]` will be ignored.

**The model spits back the literal `[brackets]` as words**
You're not on `eleven_v3`. If you have alpha access, leave `ELEVEN_MODEL_ID` unset. If you don't, the brackets won't work — request alpha access at https://help.elevenlabs.io/hc/en-us/articles/35869066075921 .

**"`ffmpeg: command not found`"**
Run `brew install ffmpeg` (macOS) or your distro's equivalent.

**Re-running is slow / I changed a voice and want to regenerate**
The cache is keyed by content + voice + settings, so changing the voice already triggers a regen for that speaker. To force a full regen, run with `--no-cache` or just delete the `.cache/` folder.

---

## How it works (under the hood)

If you're curious about what the code is doing — **[CONVERSATION.md](./CONVERSATION.md)** is the narrative of how this whole project was built in a single Claude Code session, and **[CONVERSATION-RAW.md](./CONVERSATION-RAW.md)** is the verbatim transcript. Skim either to see how someone goes from "I have an idea" → "working tool" with an AI agent.

Architecture in 60 seconds:

```
transcripts/sample.txt
        │
        ▼
   src/parse.js  ────►  segments: [{ speaker, text, ts }, …]
        │
        ▼
   src/tts.js  ──────►  one MP3 per segment via ElevenLabs API
        │              (cached by content hash so re-runs are free)
        ▼
   src/assemble.js  ──►  ffmpeg concat with silence padding
        │              (250ms same-speaker, 500ms speaker switch)
        ▼
   out/sample.mp3
```

Four files, ~250 lines total. Read them in that order.

---

## License

MIT. Do whatever you want with it.

## Credits

Built collaboratively in a Claude Code session — see [CONVERSATION.md](./CONVERSATION.md) (narrative) and [CONVERSATION-RAW.md](./CONVERSATION-RAW.md) (verbatim) for the full walkthrough.
