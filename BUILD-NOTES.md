# Interview Training Clips - Build Notes

**For:** Jake  
**Date:** May 10, 2026  
**Project:** Using the interview-audio generator to create interviewer training content  
**Full Session Summary:** [CONVERSATION-interview-training-clips.md](CONVERSATION-interview-training-clips.md)

---

Hey Jake,

Thanks so much for building this project and walking me through it during our 1:1s. I had a blast getting this set up and generating real training content from it. Below is a summary of what I built, the decisions I made along the way, and areas where I'm still figuring things out.

---

## What I Built

Generated **3 interview training clips** (2-5 minutes each) from sanitized real interview transcripts, showcasing different interviewing techniques:

1. **"Unique Impact vs Riding the Wave"** (3.5 min) - Challenging reframe + follow-up for specifics
2. **"AI Agents in Daily Use"** (3 min) - Follow-up questions to broaden scope  
3. **"Why ElevenLabs?"** (3 min) - Constraining answers to get past surface level

Each clip demonstrates a specific interviewing technique with audio generated using two distinct ElevenLabs voices (monotone/direct interviewer, enthusiastic interviewee).

**Deliverable:** Simple web showcase page at `/interview-training.html` with audio players and technique breakdowns.

---

## Setup Process

### 1. Project Installation
Followed the quick-start from the README:
```bash
cd projects/interview-audio
npm install
cp voices.config.example.json voices.config.json
echo 'ELEVENLABS_API_KEY=sk_...' > .env
```

**✅ This worked perfectly.** The README was clear and I had no issues.

### 2. Voice Selection

Used the manual browse approach via the ElevenLabs voice library. I didn't have the MCP tool installed, so I browsed voices directly on the website.

**Choices made:**
- **Tanner** (interviewer): `atf1ppeJGCYFBlCLZ26e` - monotone/direct voice
- **Jake** (interviewee): `j8ug8hId0zlBITTMvRNg` - enthusiastic/upbeat voice

I picked voices with contrasting energy levels to make the interviewer/interviewee dynamic clear in the audio.

### 3. Voice Config Format

I used the full object format with voice settings for both speakers:
```json
{
  "Tanner": {
    "voiceId": "atf1ppeJGCYFBlCLZ26e",
    "voiceSettings": {
      "stability": 0.4,
      "similarityBoost": 0.75,
      "style": 0.4,
      "useSpeakerBoost": true
    }
  },
  "Jake": { ... }
}
```

The docs mentioned these settings are "mostly silently ignored" for v4, but I included them anyway in case I wanted to experiment later.

---

## Transcript Workflow

### Source Material
I had 5 sanitized interview transcripts from my `hiring-interview-sanitize` skill (separate Claude Code skill I built for removing PII from recruiting interviews). These were in **ElevenLabs Studio format**:

```
INTERVIEWER: Hey, how are you doing?

CANDIDATE: I'm good, thanks!
```

**The Problem:** Your project expects **timestamp format**:
```
[00:00:00] Tanner: Hey, how are you doing?
[00:00:03] Jake: I'm good, thanks!
```

### Conversion Approach

**What I did:** Manually converted each transcript by:
1. Replacing `INTERVIEWER:` → `Tanner:`
2. Replacing `CANDIDATE:` → `Jake:`
3. Adding timestamps every 5-10 seconds based on text length
4. Breaking up long segments (over 1500 chars) to avoid API limits

This conversion step was repetitive but straightforward. I used Claude Code to help with the find-and-replace and timestamp insertion.

---

## Clip Selection Strategy

### Criteria I Used
For each clip, I looked for:
- **2-5 minute length** (long enough to show technique, short enough to stay focused)
- **One clear interviewing technique** per clip (not multiple techniques mixed together)
- **Distinct techniques** across clips (no overlap between clips 1, 2, 3)

**Clips I extracted:**

| Clip | Technique | Why I Picked It |
|------|-----------|-----------------|
| #1: Unique Impact | Challenging reframe + follow-up | Shows how to avoid accepting generic "I hit my numbers" answers |
| #2: AI Agents | Follow-up to broaden scope | Demonstrates not settling for first answer - asking "what else?" |
| #3: Why ElevenLabs | Constraining answers | Pre-empts obvious answer to force deeper thinking |

I optimized for **teaching one thing well** per clip rather than showing a full interview arc.

### Long Segment Handling

**Issue I hit:** One segment in the transcript was 2268 characters, but the API limit is 1500. Got this error:
```
"message": "Request text length (2268) exceeds the maximum text length of 1500 characters."
```

**What I did:** Manually split the segment into 3 continuation lines (no timestamps on lines 2-3, so they auto-attach).

---

## Showcase Page Design

Built a simple HTML page at `/interview-training.html` with:
- Audio players for each clip
- Technique name and duration
- Key quote demonstrating the technique
- Breakdown of "What Tanner Does Well"

**Design Choices:**
1. **Minimalist styling** - gray palette, clean typography, no heavy visual elements
2. **No JavaScript** - pure HTML/CSS, audio players use native `<audio>` controls
3. **Self-contained** - doesn't depend on external CSS frameworks

I had Claude Code write the HTML/CSS for me since I don't have much experience building UIs from scratch.

---

## Where I Diverged from Your Guidance

### 1. Skipped the "walk through setup" flow
The `interview-audio` skill (`.claude/skills/interview-audio/SKILL.md`) has a full onboarding script for first-time users. I skipped straight to generation since I was already familiar with the project structure from our earlier sessions.

### 2. Used pre-sanitized transcripts
Your workflow seems optimized for someone starting with raw transcripts. I already had sanitized transcripts from another skill, so I skipped the PII removal step.

### 3. Created custom clips vs using full interviews
The samples in `/samples` are full interviews (A: dialogue+v3, B: segment+v3, C: segment+v4). I created custom 2-5 minute clips instead.

---

## What I Loved About This Project

1. **It just worked.** Setup was smooth, generation was fast, output quality was excellent.
2. **The caching is magical.** Re-running with different clips was nearly instant because of the cache hits.
3. **The default settings are great.** I didn't need to tweak anything - segment mode + v4 sounded natural out of the box.
4. **The documentation is thorough.** README, TAGS.md, skill references - everything I needed was there.

---

## What I'm Still Confused About

Here are areas where I'm still trying to fully understand what's happening under the hood:

### 1. File Format Conversion & How Scripts Read Data

**The confusion:** My `hiring-interview-sanitize` skill (in Claude Cowork) outputs files in ElevenLabs Studio format. The interview-audio project expects timestamp format. I manually converted between them, but I don't fully understand:

- Why these two formats exist and when to use each
- Whether the interview-audio parser could be modified to accept Studio format directly
- What the script is actually reading from the transcript files vs what it's ignoring
- How continuation lines (no timestamp) are detected and attached to previous segments

I got it working, but I'm not confident I could explain to someone else *why* the format matters or what the parser is doing with the input.

### 2. Model Version & Voice Settings

**The confusion:** The project uses `eleven_v4` by default. I saw references to `eleven_v3` and `eleven_v4_hq` in the docs. I don't understand:

- Why v4 vs v3 vs v4_hq - what's the actual difference in output?
- The docs say voice settings are "mostly silently ignored" for v4 - does that mean stability/style don't do anything? Should I have just used the simple string format for voice config?
- Whether I should have experimented with different model versions for different clips, or if the default is always the right choice

### 3. Hard-Coded Speaker Names

**The confusion:** I hard-coded "Tanner" and "Jake" as speaker names during conversion. This felt brittle:

- Every transcript I convert needs to use these exact names
- If I wanted to generate audio with different speaker names (e.g., "Alice" and "Bob"), I'd need to either re-convert the transcript or create a new voice config
- I don't know if there's a better pattern for handling speaker name mapping that doesn't require manual find-and-replace every time

### 4. Voice ID Selection & Variability

**The confusion:** I picked two voice IDs that felt right based on browsing the library. But I don't know:

- Whether there's a "science" to picking voices that work well together, or if it's purely subjective
- If I should have tested multiple voice combinations and compared the output
- Whether the voice IDs I chose are actually good for this use case, or just acceptable
- How much variability matters - would different voices significantly change how people absorb the training content?

I made a decision, but it was mostly a guess.

### 5. Creating Custom UIs & Sharing Them

**The confusion:** I asked Claude Code to build the showcase page, and it wrote the HTML/CSS for me. I have no idea:

- Whether the HTML it generated follows best practices or if it's just "good enough"
- How to properly share this page - should it be in `/docs` for GitHub Pages? At the root? Somewhere else?
- Whether the audio file paths (`projects/interview-audio/out/*.mp3`) will work when deployed to GitHub Pages, or if I need to restructure things
- What should be committed to the repo vs what should be deployed separately
- If there are accessibility or performance issues I should be aware of

I basically accepted the output blindly because I don't know enough about web development to evaluate it.

### 6. Where Files Actually Live

**The biggest confusion:** I'm still struggling with the fundamental mental model of where information sits across three contexts:

**Claude Cowork (where I run my `hiring-interview-sanitize` skill):**
- Outputs go to `~/dev/interview-training/outputs/*.txt`
- These files live on my machine
- Claude Cowork doesn't see the tannerproject repo - it's a separate workspace

**My local machine (filesystem):**
- The tannerproject repo is at `~/dev/tannerproject/`
- Generated MP3s end up in `projects/interview-audio/out/`
- Transcripts are in `projects/interview-audio/transcripts/`
- The showcase page is at the repo root: `interview-training.html`

**Cursor + Claude Code (what I'm using right now):**
- Claude Code can read/write files in the tannerproject repo
- It can run commands like `node src/index.js transcripts/file.txt`
- The generated audio gets cached in `.cache/` but I don't fully understand what's in there or when it gets invalidated

**My confusion points:**
- When I copy a file from `~/dev/interview-training/outputs/` to `projects/interview-audio/transcripts/`, where does it "live"? Is it duplicated? Is one a reference to the other?
- When `node src/index.js` generates an MP3, where does it actually write the file? To disk? To memory? To a temp folder?
- How does GitHub Pages know to serve the MP3 files if they're gitignored (are they gitignored?)?
- If I wanted to share these clips with someone, what do I send them - the repo link? The MP3 files directly? The HTML page?

I got everything working, but I don't have a clear mental model of the file system, what's local vs remote, what's in git vs outside of git, and how all these pieces connect. It feels like I'm moving files around successfully but don't truly understand the architecture.

### 7. Model Selection & Input Format Requirements

**The confusion:** I don't remember Claude Code ever asking me which model to use (v3 vs v4). Looking back at the process:

- The project defaulted to `eleven_v4` and I just went with it
- I don't know if that was the right choice or if I should have explicitly chosen
- The docs mention v3 for dialogue mode and v4 for segment mode, but I didn't consciously decide on segment mode either - it just happened

Also, my `hiring-interview-sanitize` skill in Claude Cowork outputs **three files** for every transcript:
1. `*-annotated-reference.md` - Full script with training tags
2. `*-elevenlabs-upload.txt` - Clean SSML-converted script
3. `*-synopsis.md` - Analysis of the interview

I used the `*-elevenlabs-upload.txt` files, but I don't know:
- Whether that was the right file to use
- If different models require different input file formats
- Whether the annotated reference or synopsis files would have been more appropriate
- If there's a relationship between the three output files that I'm missing

I made it work, but I'm not confident I could explain to someone else which file format to use for which model.

### 8. Speaker Name Consistency Across Different Interviews

**The confusion:** I used "Tanner" (interviewer) and "Jake" (interviewee) as the speaker names for all three clips. But these are actually from **three different real interviews** with three different candidates:

- Clip 1 is from Interview #2 (one candidate)
- Clip 2 is from Interview #3 (different candidate)  
- Clip 3 is from Interview #1 (yet another candidate)

I can see how this might get confusing down the line:
- All three candidates sound like "Jake" in the audio
- There's no way to distinguish which interview is which just by listening
- If I generate more clips in the future, they'll all use the same two voice IDs

I'm not sure if this is a problem or not. Should I have:
- Used different voice IDs for each candidate to make them distinct?
- Named the speakers generically like "Interviewer" and "Candidate" instead of "Tanner" and "Jake"?
- Created separate voice configs for each interview?
- Added metadata to the audio files to track which real interview they came from?

It works for now, but I can imagine this creating confusion if the training library grows.

---

## Thank You

Jake, this was a ton of fun to build. I loved getting hands-on with the audio generation and seeing how the project handles real-world transcripts. The quality of the output is incredible, and I'm excited to use these clips for actual interviewer training.

Thanks for building this and for walking me through it. Looking forward to our next session where we can dig into some of the areas I'm still wrapping my head around!

— Tanner
