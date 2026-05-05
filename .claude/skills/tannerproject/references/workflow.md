# Where this project fits in the bigger workflow

The user (Tanner) is building an interviewer-training system. This repo is **Step 2** of a two-step pipeline:

```
Real interview MP4 + transcript
        │
        ▼
[Step 1] PII sanitization  ──► (separate Claude skill the user already has)
        │
        ▼
sanitized transcript with timestamps
        │
        ▼
[Step 2] THIS PROJECT  ────► reenacted MP3 with two distinct voices
        │
        ▼
training material: what good vs. bad interviews sound like
```

The training use case is for evergreen interviewer roles (e.g., customer success — 5-6 interviewers each doing ~2 candidate interviews per week). The team wants to teach interviewers what good and bad questioning looks like, similar to how sales teams use Gong recordings to train new reps. But candidate interviews are too sensitive to distribute as raw recordings — hence sanitization + reenactment.

## Why this changes how you should behave

1. **Always assume incoming transcripts are *supposed* to be sanitized already.** If you see what looks like real PII (real names that aren't clearly speaker labels, company names, email addresses, phone numbers), gently confirm:
   > "Heads up — I see what looks like PII in this transcript. Has it gone through your Step 1 sanitization? I don't want to bake real names into the audio."
   
   Don't refuse to run; just confirm before generating. False positives (e.g., a candidate using a generic example name like "Acme Corp") are fine.

2. **The user's eventual goal is generating training snippets, not always full interviews.** Future iterations may want to extract "five best moments" and "five worst moments" rather than reenact a full 30-minute conversation. When you see a long transcript, expect they may want to clip it down before generating. Suggest the "narrow to 2-min snippet" pattern (cut a representative slice, iterate, then run full).

3. **The sensitivity bar is high.** Don't paste transcript content into commit messages, MEMORY.md, or anywhere persistent. Don't echo into terminal output if the user might be screen-sharing. Summarize counts and shapes when describing transcripts ("19 segments, 2 speakers, ~2k chars") rather than dumping the text.

## What this project is NOT trying to be

- **Not a podcast generator.** No script-writing, no auto-banter generation. The transcript is the source of truth.
- **Not a real-time TTS.** It's batch — generate, listen, iterate.
- **Not a clip editor.** It produces a single combined MP3, not an editable timeline. Post-production happens elsewhere.
- **Not multi-language.** The transcripts are English; voices are English. We've validated v4 supports 70+ languages but it's not a tested path.

## What success looks like

The user clones the repo (or already has it), drops a sanitized transcript in `transcripts/`, runs one command, and listens to a believable two-voice reenactment that captures the cadence and emotion of the original — without any real PII making it into audio.

The audio quality should feel like two real people having a conversation, not a TTS reel. Inflection on tags should land. Speaker switches should feel natural. Pacing should match the original interview.
