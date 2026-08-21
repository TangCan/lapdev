---
name: bmad-wds-saga-dream-up
description: Saga's Dream Up Approach Guide — 5-layer architecture for artifact generation with Suggest/Dream modes. Covers mode selection, learning WDS form, project context accumulation, domain research, generation, and self-review.
whenToUse: When user requests artifact generation (Trigger Map, Product Brief companions) or when selecting engagement mode (Workshop/Suggest/Dream)
---

# Saga's Dream Up Approach Guide

**Original source:** `_bmad/wds/data/agent-guides/saga/dream-up-approach.md`

**When to load:** When user requests artifact generation (Trigger Map, Product Brief companions)

**Agent:** Saga the Analyst
**Purpose:** Execute Dream Up modes (Suggest/Dream) for Phase 1-2 artifact generation

## Core Architecture: 5 Layers

```
Layer 1: Learn WDS Form (Static - loaded once)
         How to structure, what makes quality
         ↓
Layer 2: Project Context (Cumulative - grows with each step)
         Product Brief → +Business Goals → +Target Groups → +Driving Forces
         ↓
Layer 3: Domain Research (Ongoing - per step as needed)
         Industry insights, competitor analysis, user behavior
         ↓
Layer 4: Generate Next Artifact
         Apply Form + Use All Prior Context + Enhanced by Research
         ↓
Layer 5: Self-Review Against Standards
         Check quality, identify gaps, refine
         ↓
    Add artifact to Layer 2 → Repeat for next step
```

**Key Principle:** Each step builds on all previous artifacts. Layer 2 grows as progress is made.

## Mode Selection Dialog

Present this choice at workflow start:

```
**Which engagement mode would you like?**

**Workshop Mode** (Agent facilitates workshop, 60-90 min)
- I'll facilitate a workshop to draw out your best ideas
- Man-in-the-loop: You're actively involved, I guide the discovery
- Best for: Discovery, strategic decisions, first time, want to go deep

**Suggest Mode** (Driven by agent, 30-45 min)
- I'll generate based on WDS methodology + your Product Brief + domain research
- You review each step and guide refinements
- Best for: Product Brief exists, want to see my thinking

**Dream Mode** (Fully autonomous, 15-20 min)
- I'll generate autonomously with visible self-dialog
- You can observe and interrupt anytime, or just review the result
- Best for: Trust the methodology, established patterns, time-efficient

Choose: [W] Workshop | [S] Suggest | [D] Dream
```

## When to Offer

✅ User requests artifact generation, Product Brief exists, quality rubric exists, task is structured generation
❌ Pure discovery conversation, No Product Brief, User explicitly wants dialog, No quality rubric

## Suggest Mode Self-Review

After each generated artifact:
1. **Form Check** — Does it follow WDS structure?
2. **Context Check** — Is it consistent with prior artifacts?
3. **Quality Check** — Against rubric: good ✅ / bad ❌ / between ⚠️
4. **Actionability Test** — Can designer create from this?

## Quality Standards

- **Actionability Test** — Can designer create feature from this driving force?
- **Context is King** — "Want to save time" = ❌ Generic; "Want to find phone within 3 seconds because stressed on vacation" = ✅ Contextual
- **Psychology Over Demographics** — "Sarah, 35, consultant" = ❌; "Sophie struggles with imposter syndrome when presenting" = ✅
