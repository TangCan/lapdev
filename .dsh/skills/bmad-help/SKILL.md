---
name: bmad-help
description: BMAD Help — analyzes current state and user query to answer BMad questions or recommend the next skill(s) to use. Use when user asks for help, bmad help, what to do next, or what to start with in BMad.
whenToUse: When the user asks for help, says "bmad help", "what to do next", "what to start with", or wants to understand the BMAD framework and available skills
---

# BMAD Help

**Original source:** `_bmad/core/bmad-help/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv` and `_bmad/_config/bmad-help.csv`)

## Purpose

Analyze the current project state and the user's request, then answer BMAD-related questions or recommend the most appropriate next skill(s) to use. This is the central navigation point for the entire BMAD framework.

## How to Use

When the user asks for help or guidance:

1. **Understand the context** — What module, phase, or task are they working on?
2. **Match intent to skill** — Use the skill catalog below to find the best match
3. **Recommend next steps** — Suggest specific skills with clear reasoning
4. **Provide overview** — If the user needs general orientation, summarize the relevant module

## Quick Navigation by Intent

### "I want to start a new project"
- **WDS (Web Design Studio):** `/bmad-wds-saga-activation` → `/bmad-wds-start` → `/bmad-wds-saga-activation`
- **GDS (Game Design Studio):** `/bmad-gds-market-research` or `/bmad-gds-technical-research`
- **BMM (Business Model Mapper):** `/bmad-bmm-teams` → start with Mary (Analyst)

### "I need to do research"
- **Market Research:** `/bmad-gds-market-research` (with steps)
- **Technical Research:** `/bmad-gds-technical-research` (with steps)
- **Domain Research:** `/bmad-bmm-teams`

### "I'm doing web design"
- **Session Start:** `/bmad-wds-start`
- **Session Wrap:** `/bmad-wds-wrap`
- **Agent Handoff:** `/bmad-wds-handoff`
- **Strategy:** `/bmad-wds-saga-activation` + `/bmad-wds-saga-trigger-mapping`
- **UX Design:** `/bmad-wds-freya-activation` + `/bmad-wds-freya-strategic-design`

### "I need a design system"
- **Token Architecture:** `/bmad-wds-token-architecture`
- **Component Boundaries:** `/bmad-wds-component-boundaries`
- **Naming Conventions:** `/bmad-wds-naming-conventions`
- **State Management:** `/bmad-wds-state-management`
- **Figma Structure:** `/bmad-wds-figma-structure`

### "I'm building a game"
- **Market Research:** `/bmad-gds-market-research-steps`
- **Technical Research:** `/bmad-gds-technical-research-steps`

### "I need to test"
- **TEA Overview:** `/bmad-tea-testarch`
- **TEA Team:** `/bmad-tea-teams`

### "I want to understand the framework"
- **Full Overview:** `/bmad-overview`

## Module Overview

| Module | Focus | Key Agents | Primary Skills |
|--------|-------|------------|---------------|
| **WDS** | Web/Digital Product Design | Saga, Freya, Mimir | Start, Wrap, Handoff, Activation, Design Guides |
| **GDS** | Game Design & Development | Cloud Dragonborn, Samus, Link, Indie | Market/Tech Research (with step workflows) |
| **TEA** | Test Architecture & QA | Murat | Step-file workflows, tri-modal architecture |
| **BMM** | Business Analysis & Planning | Mary, Paige, John, Sally, Winston, Amelia | Agent team, product brief, PRD, architecture |
| **CIS** | Creative Intelligence | Sophia, Maya, Carson, Dr. Quinn, Victor, Caravaggio | Design thinking, brainstorming, storytelling |
| **BMB** | Workflow Builder | — | Agent builder, workflow builder, module builder |
| **Core** | Shared utilities | Developer, PM | Quick flow, developer persona, PM persona |

## Response Pattern

When helping, always:
1. **Acknowledge** what the user is trying to do
2. **Match** to the right module/skill
3. **Recommend** a specific skill to load
4. **Explain** why that skill fits their intent
5. **Offer** alternatives if multiple paths exist

## Missing Core Skills

Note: The BMAD installation is missing 13 core skills that are listed in the manifest but not present on disk:
- `bmad-advanced-elicitation` — Deeper critique methods (socratic, first principles, pre-mortem, red team)
- `bmad-brainstorming` — Interactive brainstorming sessions
- `bmad-customize` — Author customization overrides for installed skills
- `bmad-distillator` — Lossless LLM-optimized document compression
- `bmad-editorial-review-prose` — Clinical copy-editing review
- `bmad-editorial-review-structure` — Structural editorial review
- `bmad-help` — (this file)
- `bmad-index-docs` — Generate index.md for document folders
- `bmad-party-mode` — Multi-agent group discussions
- `bmad-review-adversarial-general` — Cynical review and findings report
- `bmad-review-edge-case-hunter` — Exhaustive edge-case analysis
- `bmad-shard-doc` — Split large documents into smaller files

These may be added if needed. The original files can be obtained from the BMAD installation source.
