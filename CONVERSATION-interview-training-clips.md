# Session: Building Interview Training Clips

**Date:** May 10, 2026  
**Goal:** Set up the interview-audio project and generate training clips from real interview transcripts

---

## Summary

Tanner set up the interview-audio project for the first time and successfully generated 3 interview training clips (2-5 minutes each) showcasing different interviewing techniques. The clips were created from sanitized real interview transcripts and rendered with two distinct ElevenLabs voices to demonstrate interviewer/candidate dynamics.

**Key Deliverables:**
1. 3 training audio clips with professional voice acting
2. Simple minimalist web showcase page
3. Comprehensive build notes documenting the process and open questions

---

## Session Flow

### 1. Initial Setup (0:00 - 0:30)
- Reviewed the interview-audio project README
- Installed dependencies via `npm install`
- Configured `.env` with ElevenLabs API key
- Set up `voices.config.json` with two voices:
  - Tanner (interviewer): monotone/direct voice
  - Jake (interviewee): enthusiastic/upbeat voice

**Decision Point:** Tanner manually browsed the ElevenLabs voice library to pick contrasting voices rather than using the MCP voice search tool (which wasn't installed).

### 2. Understanding the Transcript Format (0:30 - 1:00)
- Discovered format mismatch: `hiring-interview-sanitize` skill outputs ElevenLabs Studio format (`INTERVIEWER:` / `CANDIDATE:`)
- interview-audio project expects timestamp format (`[00:00:00] Speaker:`)
- Manually converted transcripts with Claude Code's help

**Challenge:** Long segments (2268 chars) exceeded API limit (1500 chars), required manual splitting into continuation lines.

### 3. Generating First Clips (1:00 - 2:00)
- Generated sample clips to test voice pairing
- Iterated on clip selection to find strong interviewing moments
- Extracted 3 distinct clips from different interviews:
  - Clip 1: "Unique Impact vs Riding the Wave" (challenging reframe technique)
  - Clip 2: "AI Agents in Daily Use" (follow-up questions technique)
  - Clip 3: "Why ElevenLabs?" (constraining answers technique)

**Key Insight:** The caching system made iteration nearly instant - re-running clips reused cached segments.

### 4. Building the Showcase Page (2:00 - 2:30)
- Created minimalist HTML/CSS page with Claude Code's help
- Embedded native audio players for each clip
- Added technique breakdowns and "What Tanner Does Well" sections
- Iterated on design to make it cleaner and less blocky

**Uncertainty:** Tanner had Claude Code write the HTML/CSS blindly since they don't have web development experience. Unsure if it follows best practices.

### 5. Documenting the Build (2:30 - 3:00)
- Wrote comprehensive BUILD-NOTES.md documenting:
  - What was built
  - Decisions made along the way
  - Areas of confusion and open questions
- Identified 8 key areas where understanding is incomplete:
  - File format conversion
  - Model version selection (v3 vs v4)
  - Hard-coded speaker names
  - Voice ID selection methodology
  - UI creation and sharing
  - Where files live (filesystem mental model)
  - Model selection and input format requirements
  - Speaker name consistency across interviews

---

## Technical Decisions

### Voice Selection
**Chosen:** Manual browse of ElevenLabs voice library  
**Alternative considered:** Using MCP voice search tool  
**Rationale:** MCP tool wasn't installed; manual browsing worked fine for 2 voices

### Transcript Format
**Chosen:** Timestamp format with manual conversion  
**Alternative considered:** Modifying the parser to accept Studio format  
**Rationale:** Followed project conventions; conversion was straightforward with Claude's help

### Clip Length
**Chosen:** 2-5 minute focused clips teaching one technique each  
**Alternative considered:** Full interview audio (10-15 min) showing technique progression  
**Rationale:** Optimized for training - easier to digest one concept at a time

### Speaker Names
**Chosen:** "Tanner" and "Jake" for all clips (even though they're from different candidates)  
**Alternative considered:** Different voices per candidate, or generic names like "Interviewer"  
**Rationale:** Consistency and simplicity; potential confusion noted in build notes

### Model Version
**Default used:** `eleven_v4` in segment mode  
**Question:** Was this the right choice? Tanner doesn't recall explicitly choosing the model.

---

## Generated Files

**Transcript clips:**
- `projects/interview-audio/transcripts/unique-impact-clip.txt`
- `projects/interview-audio/transcripts/ai-agents-daily-use-clip.txt`
- `projects/interview-audio/transcripts/why-elevenlabs-deep-dive-clip.txt`

**Generated audio:**
- `projects/interview-audio/out/unique-impact-clip.mp3` (3.5 min)
- `projects/interview-audio/out/ai-agents-daily-use-clip.mp3` (3 min)
- `projects/interview-audio/out/why-elevenlabs-deep-dive-clip.mp3` (3 min)

**Showcase page:**
- `interview-training.html` (minimalist design with embedded audio players)

**Documentation:**
- `BUILD-NOTES.md` (comprehensive build log and open questions for Jake)

---

## Key Learnings

### What Worked Well
1. **Project defaults are excellent** - Didn't need to tweak any settings
2. **Caching is magical** - Re-runs were nearly instant
3. **Documentation is thorough** - Everything needed was in README, TAGS.md, or skill references
4. **Setup was smooth** - No blockers during installation

### What Was Confusing
1. **File format conversion** - Why two formats exist, what the parser reads
2. **Model selection** - Never explicitly chose v3 vs v4, it just defaulted
3. **Voice settings** - Docs say they're "mostly ignored" for v4, but included them anyway
4. **Filesystem mental model** - Where files live between Claude Cowork, local machine, and git
5. **UI best practices** - Accepted Claude's HTML output without knowing if it's good
6. **Speaker name mapping** - Hard-coded names feel brittle for multiple interviews

### Open Questions for Jake
- Should the project support ElevenLabs Studio format directly?
- Is there a better pattern for speaker name mapping?
- Should MP3s be committed to git for GitHub Pages, or hosted elsewhere?
- What's the "right" way to pick voices - is it purely subjective?
- How to share the showcase page properly?

---

## Next Steps

**Immediate:**
- Commit the work to GitHub
- Make showcase page live on GitHub Pages

**Future:**
- Generate more clips from remaining interviews (#4, #5)
- Consider building a format conversion script
- Explore different voice pairings
- Add more interviewing techniques to the library

---

## Reflections

This was Tanner's first hands-on experience with the interview-audio project. The session highlighted the gap between "making it work" and "understanding how it works" - everything functioned correctly, but the mental model of file formats, model selection, and filesystem organization remains incomplete.

The most valuable part of this session was identifying specific confusion points to discuss with Jake in future 1:1s. Rather than pretending to understand, Tanner documented 8 areas of genuine uncertainty that will inform better learning conversations.

---

*This session was documented to capture the learning journey, not just the technical steps. For full verbatim conversation, see the Claude Code session transcript.*
