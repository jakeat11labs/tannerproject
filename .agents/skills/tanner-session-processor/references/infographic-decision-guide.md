# Infographic Decision Guide

Use an infographic when the session produced a reusable mental model that Tanner will need to recall later.

## Strong Candidates

- A workflow with clear stages: local edit -> branch -> commit -> PR -> merge -> deploy.
- A system boundary: local machine vs GitHub vs Vercel vs database.
- A security distinction: what belongs in `.env`, hosting environment variables, GitHub, or public client code.
- A decision tree: solo workflow vs team workflow, prototype vs production, local-only vs hosted.
- A repeated confusion point from the transcript.
- A concept Jake explicitly wants to teach in future sessions.

## Weak Candidates

- One-off implementation details that will not be reused.
- A list of commands with no visual relationship.
- Private/customer/interview material that would require heavy redaction.
- Anything better handled as a checklist, short note, or code comment.

## If Creating One

Use `/Users/jakerains/.agents/skills/canvas-design/SKILL.md`.

Keep the result:

- visual-first,
- low text,
- designed for teaching during a live session,
- consistent enough with existing Tannerproject infographics to feel like part of the same resource library.

Put outputs in:

- `assets/infographics/<slug>.png`
- `assets/infographics/<slug>.md` for the design philosophy or notes.

Then update `index.html` so the resource is discoverable from the Infographics section or resource index.
