---
name: bmad-brainstorming
description: Facilitate interactive brainstorming sessions using diverse creative techniques and ideation methods. Covers session setup, technique selection, execution, and idea organization.
whenToUse: When the user says "help me brainstorm" or "help me ideate" or wants to generate creative ideas
---

# BMAD Brainstorming

**Original source:** `_bmad/core/bmad-brainstorming/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Facilitate interactive brainstorming sessions using diverse creative techniques and ideation methods.

## Workflow

### Step 1: Session Setup
- Understand the brainstorming goal and context
- Identify constraints and success criteria
- Determine available time and desired output format

### Step 2: Technique Selection
Choose from available methods in `_bmad/core/bmad-brainstorming/brain-methods.csv`:

- **User-selected** — Let the user pick a technique they know
- **AI-recommended** — Suggest the best technique based on the problem type
- **Random selection** — Pick a technique at random to break patterns
- **Progressive flow** — Start with one technique, build on it with another

### Step 3: Technique Execution
- Explain the technique briefly
- Guide the user through the process
- Generate ideas collaboratively
- Capture all ideas without judgment

### Step 4: Idea Organization
- Group related ideas by theme
- Identify patterns and connections
- Prioritize by feasibility and impact
- Present structured output with clear next steps

## Template (from `_bmad/core/bmad-brainstorming/template.md`)

```markdown
# Brainstorming Session

## Goal
[What are we trying to figure out?]

## Constraints
[What limits apply?]

## Technique
[Selected method and why]

## Generated Ideas
[All ideas, numbered]

## Themes & Patterns
[Grouped and categorized]

## Top Recommendations
[Priority-ranked best ideas]

## Next Steps
[How to proceed with the best ideas]
```

## Response Pattern

1. Ask: "What do you want to brainstorm about?"
2. Understand context and constraints
3. Offer technique choices (user-selected, AI-recommended, or random)
4. Execute the technique interactively
5. Organize and prioritize results
6. Suggest concrete next steps
