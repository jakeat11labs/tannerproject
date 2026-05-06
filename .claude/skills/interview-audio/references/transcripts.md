# Transcript format and parser gotchas

## Canonical format

The parser at `src/parse.js` expects this exact shape:

```
[hh:mm:ss] Speaker Name: text on this line.
Continuation lines without a timestamp fold into the previous segment.
[hh:mm:ss] Other Speaker: next turn here.
```

Regex: `/^\s*\[(\d{1,2}):(\d{2}):(\d{2})\]\s*([^:]+?):\s*(.*)$/`

Key rules:
- Timestamp comes first, in `[hh:mm:ss]` square brackets
- Speaker name is between the `]` and the first `:`. Can contain spaces (`[00:01:00] John Smith: hello`)
- Multiple speakers are fine — the validator ensures every distinct speaker has a voice mapped
- Lines without a leading timestamp attach to the previous segment's text (continuation)
- Empty lines are skipped
- The first non-empty line MUST start with a `[hh:mm:ss]` — otherwise the parser throws

## Tags inside the text

Audio tags like `[laughs]`, `[whispers]`, `[curious]` go inside the segment text — they're not parsed specially, just passed through to the model. Place them immediately before the line they affect, or right after for reactions:

```
[00:00:00] Tanner: [excited] You won't BELIEVE what happened today!
[00:00:05] Guest: It was just… insane. [sighs]
```

CAPS for emphasis, ellipses for hesitation, em dashes for short pauses — all work as plain text formatting that v3/v4 honors.

## Common variants the parser doesn't handle (yet)

If the user pastes a transcript and the parser throws, identify the line that broke and recognize the pattern. **Paste the offending line back to the user**, identify what's different, then ask which fix they prefer before writing changes.

| Variant | Fix |
| --- | --- |
| `Speaker A: [00:00:00] text…` | Speaker first, timestamp inside. Offer to: (a) reformat the file with `sed`, or (b) extend the regex in `parse.js`. |
| `00:00:00 Speaker A: text…` | Timestamp without brackets. Same fix options. |
| `[00:00] Speaker A: text…` | `mm:ss` not `hh:mm:ss`. Pad with `00:` prefix or relax the regex to make hours optional. |
| `Speaker A (00:00:00): text…` | Parens around time, after speaker. Bigger reformat — write a one-liner Python or sed script. |
| SRT / WebVTT | Multi-line format with separate timestamp lines. Suggest converting first; offer to write a converter script. |
| `>>> Speaker:` (no timestamps) | No timestamps at all. Parser will error on first line. Fix: insert `[00:00:00]` placeholders programmatically before the first line of each speaker turn (the timestamps are informational only — the project uses natural pacing, not absolute starts). |

## Quick conversion recipes

**SRT → plain timestamped:**

```bash
# rough recipe — adjust for your specific SRT structure
awk '/-->/{ts=$1; gsub(",", ".", ts); next} /^[0-9]+$/{next} NF{ printf "[%s] %s\n", ts, $0 }' input.srt > output.txt
```

**Add timestamp placeholders to untimed transcript:**

If the user has just `Speaker: text` lines, walk through with them and either:
1. Add `[00:00:00]` to every line — the project will honor speaker order but won't have real timing (which is fine, since natural pacing is the default)
2. Estimate timestamps based on segment length (200 chars ≈ 12 seconds at normal speech)

The transcript timestamps don't really matter for output — they're informational only. The project paces audio with fixed gaps between segments, not by honoring source timestamps.

## Parser sanity check

Before generating, run a dry parse to count segments and validate format:

```bash
node -e "
import('./src/parse.js').then(async ({ parseTranscript }) => {
  const fs = await import('node:fs/promises');
  const text = await fs.readFile(process.argv[1], 'utf8');
  const segs = parseTranscript(text);
  const speakers = [...new Set(segs.map(s => s.speaker))];
  console.log('segments:', segs.length, 'speakers:', speakers.join(', '));
});
" transcripts/<file>.txt
```

If this throws, the parser failed before any API calls — cheap iteration.

## Don't strip tags before parsing

The `[laughs]` and similar audio tags are **part of the segment text**, not metadata. The parser preserves them. Don't write code to strip them out unless the user explicitly wants to fall back to a model that doesn't support tags (e.g., `eleven_multilingual_v2`) — in that case suggest stripping in a separate pre-processing step rather than modifying the parser.
