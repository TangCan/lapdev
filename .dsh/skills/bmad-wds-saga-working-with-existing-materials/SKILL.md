---
name: bmad-wds-saga-working-with-existing-materials
description: Guide for naturally incorporating existing materials (previous briefs, websites, brand guidelines, research) into conversational PB workflow. Covers reference-don't-reask, validate-currency, fill-gaps, and document-refinement patterns.
whenToUse: When existing materials (previous brief, website, brand guidelines, research) are available and you need to incorporate them into the Product Brief workflow
---

# Working with Existing Materials

**Original source:** `_bmad/wds/data/agent-guides/saga/working-with-existing-materials.md`

## Core Principles

1. **Reference, don't re-ask** — Build on documented work
2. **Validate currency** — "Is this still accurate?"
3. **Focus on gaps** — What's missing or needs refinement?
4. **Document refinement** — Capture UPDATE conversation, not just creation
5. **Stay casual** — No judgment about what exists or doesn't

## Checking for Materials

**Phase 0 asks:** "Do you have existing materials?" (website, brief, guidelines, research)

**Stored in outline:**
```yaml
existing_materials:
  has_materials: true/false
  website: "[URL]"
  previous_brief: "[path]"
  brand_guidelines: "[path]"
  research: "[path]"
  context_notes: "[brief notes]"
```

## Adaptation Pattern

**Without materials:**
> "Let's start with vision. What are you envisioning?"

**With materials:**
> "I see you mentioned [reference from materials]. Let's build on that — tell me more."

### Follow-Up Patterns
- **Validate:** "You wrote X — is that still accurate?"
- **Fill gaps:** "Your brief mentions Y, but I'm curious about Z..."
- **Refine:** "When you said X, did you mean [interpretation]?"
- **Update:** "Has your thinking evolved since you wrote this?"

## Dialog Documentation Template

```markdown
**Existing context:** [What was documented]

**Opening:** "I see [reference]. [Question]"

**User response:** [Confirmed/refined/changed]

**Key exchanges:**
- [Exploration]
- [Gaps filled]
- [Evolution]

**Reflection checkpoint:**
"Building on your earlier work: [synthesis].
Keeps [solid parts], adds [new], refines [changed].
Does that capture it?"

**User confirmation:** [Confirmed / Corrected]

**Final:** [Updated artifact]
```

## Common Scenarios

- **Previous brief exists** → Read thoroughly, identify solid vs gaps, open with strong points, explore gaps conversationally
- **Existing website** → Review site, note positioning/tone/UX, reference observations, use as baseline
- **Brand guidelines exist** → Read guidelines (voice, values, identity), reference tone, focus on how brand translates
- **Research exists** → Review findings, reference insights, validate currency

## What NOT to Do

❌ Ignore existing materials, Make users repeat documented work, Assume everything is current, Judge quality of existing work, Create separate "refinement workflow"

## Quick Reference

**Check:** `existing_materials.has_materials` in outline

**If true:** Read materials → Adapt openings to reference → Validate currency → Fill gaps → Document: old + new + why

**Dialog pattern:** Existing → Validate → Refine → Synthesize → Confirm
