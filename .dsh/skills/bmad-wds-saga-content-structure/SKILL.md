---
name: bmad-wds-saga-content-structure
description: Saga's Content Structure Principles — captures the client's vision for what the product should contain. Covers product type, content hierarchy, navigation principles, and scope boundaries. Adaptive depth based on client readiness.
whenToUse: During Content & Language workflow, after SEO keywords, before synthesis — when understanding what content the client envisions
---

# Content Structure Principles (Product Brief)

**Original source:** `_bmad/wds/data/agent-guides/saga/content-structure-principles.md`

**When to load:** During Content & Language workflow, after SEO keywords, before synthesis

## Why This Matters

Without understanding the client's vision for what their product should contain:
- Scenario Outlining designs flows through pages that may not exist in the client's mental model
- Page Design creates sections the client never envisioned
- Dream Up generates designs misaligned with expectations

**Principles, not specifications.** "Services should be easily accessible from the main menu" is a principle. "Three-column grid with 200px service cards" is a specification that belongs in Phase 4.

## What We Need to Know

1. **What type of product is this?** Single-page site, multi-page site, app, platform?
2. **What content does the client envision?** Pages, sections, content areas
3. **What must be immediately prominent?** Content priorities that drive the first impression
4. **How should users navigate?** Principles about finding content (not nav design specifics)
5. **What should definitely NOT be included?** Explicit anti-patterns and scope boundaries
6. **How clear is the client's vision?** Are they specific, exploring, or completely open?

## Adaptive Depth

Match the client's readiness:
- **Client is specific** → Capture detailed vision, note as strong direction
- **Client is exploring** → Capture what they know, flag open questions for Phase 4
- **Client is blank** → Note openness, capture any preferences, leave structure for later phases

## Documenting the Outcome

### If client is specific:
```markdown
## Content Structure Principles

### Structure Type
Single-page site — all content on one scrollable page

### User's Vision
"Tourists on phones should find three things fast: can you fix my vehicle,
where are you, what's your number. Everything else is secondary."

### Content Priorities
**Must be prominent (visible without scroll):**
- Phone number
- Vehicle types serviced
- Location + hours

**Important but secondary:**
- About / story
- Certifications
- Reviews

### Navigation Principles
- Contact (phone) reachable from anywhere
- Mobile-first — most users on phones

### Not Included
- No online booking (phone-first approach)
- No blog

### Clarity Level
Very specific — strong vision based on user needs
```

## Red Flags

- **"Make it like [competitor]"** → Probe what specifically they like. Avoid copying without understanding WHY.
- **Feature shopping** ("newsletter signup, chat widget...") → Redirect to principles: "What's the core experience?"
- **Over-specification** (pixel-level details) → Capture the principle, not the specification.
- **"Everything is most important"** → Gentle pressure test: "If a mobile user has 5 seconds, what's the ONE thing they must find?"
