# Build Notes Feedback — 5/11

**From:** Jake
**To:** Tanner
**In response to:** [BUILD-NOTES.md](BUILD-NOTES.md) (5/10/2026)

---

Tanner — these are great notes. The fact that you can name exactly what you don't understand is honestly the hardest part of learning this stuff, so the fact that your "confusion" section is this detailed is a really good sign. Going through each one below.

---

## Before diving in

A lot of what's below explains *how things work* under the hood — voice config formats, parser behavior, which files are gitignored. It's useful to understand so you have a mental model, but **none of it is stuff you should be doing by hand**. Your job is to know what you want and tell Claude. Claude handles the typing, the format decisions, the boilerplate. If you ever find yourself manually editing config files, splitting transcripts, or running find-and-replace, that's a signal we need a better workflow.

Keep that in mind as you read — the answers below are for your *mental model*, not your to-do list.

---

## 1. File format conversion & how scripts read data

The bigger problem here isn't really the format — it's that you're working across **three different environments** (Claude Desktop → local filesystem → Cursor/Claude Code) and manually moving files between them. That's the part that should go away.

The `hiring-interview-sanitize` skill in Claude Cowork is dumping output to a hardcoded folder somewhere. We need to look at it together and figure out:

- **Is the skill global or project-scoped?** If it's global, we should crack it open and pull the hardcoded path out — either let it save wherever you're currently working, or have it *ask* where to put the output.
- **Better yet, can we collapse the whole thing into one workflow?** Right now you go: Claude Desktop (sanitize) → drag files around → Cursor (generate audio). Ideally Claude Code handles the whole pipeline: hand it a raw transcript, it sanitizes PII, converts format, and generates audio in one step. No file shuffling.

So: next session, we look at your sanitize skill, decide whether to fix it in place or absorb it into the interview-audio workflow.

**The actual answer on formats:** there's really just *one* format this project knows — `[hh:mm:ss] Speaker: text`. The "Studio format" you were converting from is from a different ElevenLabs product (ElevenLabs Studio); it has nothing to do with this project. The two formats exist because they serve different tools.

What the parser uses: speaker name (case-sensitive — must match `voices.config.json` keys exactly) and the text body. Lines without a timestamp fold into the previous segment automatically.

What it *ignores*: the actual timestamp values. The `[00:00:00]` is just a structural marker the regex needs — output timing uses fixed gap rules (250ms same-speaker, 500ms speaker switch), not the timestamps you put in. So you can stop worrying about timestamp accuracy.

---

## 2. Model version & voice settings

Quick model rundown:

- **v3** — our expressive model. Good emotional range but can feel less natural in long form.
- **v4** — newest model (not publicly released yet). Same underlying architecture as v3, but retrained to sound more natural. This is why your output sounded so good — you were on the unreleased model.
- **v4_hq** — same as v4 but higher-quality output. Bigger files, more processing, marginal quality gain. Worth it for finished deliverables, not for iteration.

I put a comparison page on the site that runs the **same interview through all the models** so you can hear the difference directly — that's the best way to internalize it instead of me describing it.

On voice settings being "silently ignored" — yeah, for v4 those knobs largely don't do anything. You can simplify your `voices.config.json` to the short string format if you want. No harm leaving them in either.

And to your meta-question: **yes, you should have experimented.** Always experiment. That's the answer to a lot of these.

**On the simple-string vs object format for your voice config:** Either works. Think of it like ordering coffee.

Short form — just the voice ID — is "I'll have a coffee." Default everything:
```json
"Tanner": "atf1ppeJGCYFBlCLZ26e"
```

Long form — voice ID plus dials — is "medium roast, oat milk, two sugars":
```json
"Tanner": {
  "voiceId": "atf1ppeJGCYFBlCLZ26e",
  "voiceSettings": { "stability": 0.4, "style": 0.4 }
}
```

The catch: on v4, those dials mostly don't do anything — the model decides for itself. On v3 they matter more, which is why the long form exists. For v4 work, the short form is cleaner.

And really — you shouldn't be hand-editing this file at all. Tell Claude "I'm using v4, set up the voice config with these IDs" and it picks the right form for you.

---

## 3. Hard-coded speaker names

You shouldn't be doing **any** of this find-and-replace by hand. That's exactly the kind of thing Claude should swap on the fly.

This belongs in the workflow we discussed in #1. When we build (or rebuild) the skill, it can:

- Ask you upfront: "What names should the speakers be in the audio?"
- Or auto-detect from the transcript and confirm with you
- Or read names from a config — your choice

If the script has speaker names hardcoded anywhere, that's a bug we just fix. Manual conversion is never the answer when Claude can do it deterministically.

---

## 4. Voice ID selection & variability

There isn't really a science to it. It's mostly:

- Some voices are optimized for expressiveness, some aren't — depends on how the voice was created
- Some voices pair better with older models, some with newer (also just training/optimization)
- The voice library has descriptions like "works better than X for Y" — worth reading those

Trial and error is the move. Your two voices worked — the contrast between monotone interviewer and enthusiastic interviewee was a smart choice and it comes through clearly in the audio. If you want to level up, A/B a couple of alternates next time and pick the one that lands better.

---

## 5. Custom UIs & sharing them

The page Claude built you is fine — it got the job done. But "good enough" and "polished" are different bars, and next session I'll show you how to make polished pages pretty easily.

One important reframe though: **GitHub isn't really a hosting platform.** It's a great place to store your code and an okay intermediary, but for actually hosting and showing off your work, we use **Vercel**. That's the production move. GitHub Pages works for a basic landing page like our `index.html`, but it's not where polished projects live.

So: next session we'll talk about Vercel and the general "how do I make a real site" flow. The accessibility/performance/best-practices questions you had — we'll cover those too once we're working in a real hosting setup.

---

## 6. Where files actually live (the big one)

This is the biggest gap, and it's not a "you" problem — it's that your computer doesn't have a workflow or organization system in place yet. Files are landing wherever they land, projects don't have a consistent home, and you're copying things around because there's no clear pattern.

I want to make this the centerpiece of our next session. Plan:

- **Consolidate** what you have on your machine into a sane structure
- **Set good habits** for spinning up new projects so this doesn't sprawl again
- **Deep-dive on infrastructure** — local filesystem vs GitHub vs hosting (Vercel). Where does each layer live, what's it for, when does each one come into play
- **Clear up the mental model** — what's "in git," what isn't, what gets deployed, what stays local, how all the pieces actually connect

You'll leave that session with a clean setup and a model in your head you can apply every time you start something new. The fact that you can articulate the confusion this clearly tells me you're already 80% there — you just need the framework hung on it.

**One concrete answer while we're here:** the `out/` folder is gitignored *generally* — every MP3 you generate stays out of git by default. But `.gitignore` has explicit exceptions for your three training clips so GitHub Pages can serve them. New training clips would need the same `!` exception added to keep them committed (Claude handles that — you'd just say "add this new clip to the gitignore exception list"). Everything else stays local.

---

## 7. Model selection & input format requirements

The reason Claude Code didn't ask you about the model is that **I hardcoded v4 into the script**. Not a Claude thing — a me thing. You can always ask Claude to swap it, or change it yourself.

Important detail buried in your notes: the **1,500 character limit** you hit is a dialogue-mode constraint, not a project-wide one. Dialogue mode sends the whole thing in one API call. **Segment mode generates each speaker's lines as separate MP3s and stitches them together** — which means no character limit. In my testing segment mode actually sounds better too. v4 + segment mode is a strong default.

So: you were in dialogue mode by accident, which is why you had to manually split that 2,268-char block. Segment mode would've absorbed it without you noticing.

On your three output files from the sanitize skill (`annotated-reference`, `elevenlabs-upload`, `synopsis`) — using the `-elevenlabs-upload.txt` was correct for what you were doing. But we need to look at that skill together and understand the full picture before I can give you a clean rule. Parking-lotted for next session.

Pulling on the thread from the framing note: you don't need to memorize that v4 is hardcoded into the script, or what the dialogue-mode character limit is, or which file from the sanitize skill maps to what. You need to know what you *want* — clean audio of two speakers, this long, in this voice — and tell Claude. If you hit a limit, Claude swaps modes. If a default is wrong, Claude changes it. Your job is to know what good output looks like. Claude's job is to wire up the path that gets there.

---

## 8. Speaker name consistency across interviews

You're spotting a real future problem. Three different real candidates all sounding like the same "Jake" voice is fine for three clips, less fine when there are thirty.

**Yes — use different voice IDs per candidate.** That's the cleanest fix. My suggestion:

- Pick **2–3 good male voices** and **2–3 good female voices** you like
- Rotate them across candidates so each interview has a distinct sound
- Generic names like "Interviewer"/"Candidate" are fine too, but voice differentiation matters more than name differentiation for audio listeners

Practically, this means Claude will need to create a different voice config per interview (or one config that knows how to map a candidate ID → voice ID). That's part of building this thing — when scale changes, the structure has to change with it. **That's the fun part**, honestly. You can do basically anything you can imagine here; it's just a question of designing the system for the size you want it to handle.

---

## Things still open / one I didn't fully answer

Flagging this so we don't lose it:

- **Relationship between your three sanitize-skill output files** (`annotated-reference`, `elevenlabs-upload`, `synopsis`) — this one I genuinely can't answer without looking at the skill together. The other three open items from this draft are answered above now.

---

## Parking lot — next touchpoint

### For Tanner to prep / bring
- [ ] Path to your `hiring-interview-sanitize` skill so we can look at the source together
- [ ] An example of a **raw** (un-sanitized) transcript so we can see the full input
- [ ] A list of any other "I'm copying files between tools" workflows you have — let's audit all of them, not just this one
- [ ] Any voices you've bookmarked or liked in the library — bring a few candidates for the male/female rotation pool

### For Jake to prep
- [ ] Decide whether the sanitize skill gets fixed in place or absorbed into the interview-audio workflow
- [ ] Pull together a "starting a new project" checklist / template — folder structure, git setup, README/CLAUDE.md scaffolding
- [ ] Vercel walkthrough plan — how to take an HTML page and deploy it properly, with a real example
- [ ] Sketch the "where files live" mental model (local vs GitHub vs Vercel) so we have a visual to anchor the deep-dive
- [ ] Look at making the dialogue/segment mode choice explicit in the script — right now it just defaults and you didn't know you were in dialogue mode

### Session agenda (draft)
1. **Infrastructure deep-dive** — local vs GitHub vs hosting (Vercel). Clean up the mental model.
2. **Computer organization reset** — consolidate projects, set habits for the next one.
3. **Sanitize skill review** — read it together, decide fix-in-place vs absorb-into-workflow.
4. **Unified workflow design** — raw transcript → audio in one step.
5. **Vercel intro** — deploy something polished, end the session with a real URL.

---

You crushed this, Tanner. Looking forward to the next one.

— Jake
