# Eleven v3 Audio Tag Reference

Drop these `[bracketed]` tags into transcript lines to direct delivery. The model is `eleven_v3` (default in this project). Source: ElevenLabs official v3 prompting guide.

## How tags work

- Place a tag **immediately before** the segment it modifies, or right after for a reaction (`This is hard. [sighs]`).
- Tags are **voice-dependent**. A meditative voice won't `[shout]` convincingly; a hyped voice won't `[whisper]` well. Pick voices whose training samples cover the emotional range you want.
- Combine tags freely (`[whispers] [conspiratorial]`). Experiment.
- Tags are **non-exhaustive** — descriptive states like `[thoughtful]`, `[appalled]`, `[mockingly]` often work even if not on the official list.

## The official tag list

### Voice / emotion direction

```
[laughs]   [laughs harder]   [starts laughing]   [wheezing]
[whispers]
[sighs]    [exhales]   [exhales sharply]   [inhales deeply]
[clears throat]
[sarcastic]   [curious]   [excited]   [crying]   [snorts]   [mischievously]
[happy]   [sad]   [angry]   [annoyed]   [appalled]   [thoughtful]   [surprised]
[chuckles]   [giggling]
[pause]   [short pause]   [long pause]
```

### Sound effects

```
[gunshot]   [applause]   [clapping]   [explosion]
[swallows]   [gulps]
```

### Experimental / special

```
[strong French accent]   [strong British accent]   [strong X accent]   ← replace X
[sings]   [woo]   [fart]
```

These are less consistent. Test before relying on them.

## Non-tag levers (just as important)

These are NOT in brackets — they're plain text formatting that v3 reacts to:

- **CAPITALIZATION** for emphasis: `It was a VERY long day.`
- **Ellipses (…)** for hesitation / weight: `It… well, it might work.`
- **Em dashes (— or --)** for short pauses / interrupts.
- **Question marks / exclamation points** strongly shape intonation.
- **Natural narrative phrasing** (`she asked, voice trembling`) works as soft direction.

v3 does **NOT** support `<break time="x.xs" />` SSML tags. Use ellipses, dashes, or `[short pause]` / `[long pause]` instead.

## Voice settings (stability)

Stability controls how closely the output sticks to the reference voice. In v3:

- **Creative** — most expressive, responds best to tags, prone to occasional hallucinations.
- **Natural** — balanced (recommended starting point for interviews).
- **Robust** — most stable, but **less responsive to tags**. Avoid for expressive work.

In `voices.config.json`, the per-speaker `voiceSettings.stability` slider maps roughly:
- `0.3` ≈ Creative
- `0.5` ≈ Natural
- `0.75+` ≈ Robust

`style` (0–1) increases stylistic exaggeration. For tags-heavy interviews, `style: 0.3–0.5` is a reasonable starting point.

## Tag combo cheatsheet for interviews

| Vibe | Tag combo |
| --- | --- |
| Casual rapport | `[laughs]`, `[chuckles]`, `[curious]` |
| Reflective / serious | `[thoughtful]`, `[sighs]`, ellipses, `[short pause]` |
| Excited reveal | `[excited]`, CAPS on key word, `[laughs]` |
| Skeptical pushback | `[sarcastic]`, `[scoffs]`, `[annoyed]` |
| Vulnerable moment | `[whispers]`, `[crying]`, ellipses |
| Building to a point | `[thoughtful]` → CAPS phrase → `[happy gasp]` |

## Quick example

```
[00:00:00] Speaker A: [excited] Welcome back to the show! Today's guest is someone I have wanted to talk to for YEARS.
[00:00:06] Speaker B: [chuckles] Thanks for having me. [thoughtful] It's a topic I could talk about for hours.
[00:00:12] Speaker A: Let's start with the basics. [curious] How would you explain text-to-speech to someone who's never heard of it?
[00:00:19] Speaker B: At its core... [short pause] it's just a model that turns characters into sound.
The interesting part — [emphatic] making that sound expressive enough to feel HUMAN.
```

## Don't

- Don't use tags for things that aren't auditory: `[grinning]`, `[standing]`, `[pacing]`, `[music]` — v3 won't render them.
- Don't stack 4+ tags on one line — instability rises sharply.
- Don't expect a `[whispers]` tag to override a voice that was cloned shouting.

## Source

- [ElevenLabs v3 prompting guide](https://elevenlabs.io/docs/best-practices/prompting/eleven-v3)
- [How do audio tags work with Eleven v3?](https://help.elevenlabs.io/hc/en-us/articles/35869142561297-How-do-audio-tags-work-with-Eleven-v3)
