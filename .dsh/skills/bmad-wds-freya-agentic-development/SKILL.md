---
name: bmad-wds-freya-agentic-development
description: Freya's Agentic Development Guide — incremental build with full traceability via design log. Covers startup protocol, bridge role, feedback protocol, inline testing, interactive prototypes, and implementation.
whenToUse: When implementing features, building prototypes, or fixing bugs through structured development
---

# Freya's Agentic Development Guide

**Original source:** `_bmad/wds/data/agent-guides/freya/agentic-development.md`

**When to load:** When implementing features, building prototypes, or fixing bugs through structured development

## Core Principle

**Agentic Development builds incrementally with full traceability via the design log.**

The design log bridges the gap between specifications and working code.

## What is Agentic Development?

| Output Type | Description | When to Use |
|-------------|-------------|-------------|
| Interactive Prototypes | HTML prototypes that let users FEEL the design | Validating UX before production |
| Prototype Implementation | Building features from specifications | Feature development |
| Bug Fixes | Structured debugging and fixing | Issue resolution |
| Design Exploration | Exploring visual/UX directions | Creative iteration |

## Agent Startup Protocol

When awakened, always check the design log:
1. Read: `{output_folder}/_progress/00-design-log.md`
2. Check Current and Backlog sections
3. Present current state to user

## The Bridge Role

The design log bridges **specifications** and **development**:
- Specification = Single Source of Truth (what to build)
- Design Log = Navigation Layer (current/backlog, traceability)
- Development = Implementation (how to build)

## Progress Folder Structure

```
{output_folder}/_progress/
├── 00-design-log.md                  ← Main state tracking
└── agent-experiences/
    ├── {DATE}-{agent}-{feature-name}.md  ← Session insights
    └── ...
```

## Feedback Protocol

| Type | What It Is | When to Address |
|------|------------|-----------------|
| Bug/Issue | Something broken | Now — iterate until fixed |
| Quick Adjustment | Small tweak | Now — implement immediately |
| Addition | New requirement, fits scope | Later step — add to plan |
| Change Request | Outside current scope | Future session — document |

## Inline Testing

**The agent tests its own work before presenting it to the user.**

Key rules:
1. **Verify before presenting** — After implementing, open page, check measurable criteria
2. **Narrate findings** — Use ✓/✗ marks with actual vs expected values
3. **Fix before showing** — Never present with known measurable failures
4. **Capture baselines** — Before modifying existing features
5. **Split test plans** — Agent-verifiable vs user-evaluable

**Responsibility split:**
- **Agent handles:** Text content, colors, dimensions, touch targets, error states, visibility, state transitions
- **Human handles:** Flow feel, visual hierarchy, user understanding, overall consistency

## Best Practices

- **Single Source of Truth** — Never duplicate spec content; link with line numbers
- **Design Log** — Be thorough in Setup Context; include file paths; track progress after each step
- **Execution** — Read spec first; fresh context is fine; update as you go
