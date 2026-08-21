---
name: bmad-party-mode
description: Orchestrates group discussions between installed BMAD agents, enabling natural multi-agent conversations where each agent is a real subagent with independent thinking. Covers roundtable, debate, and collaborative problem-solving.
whenToUse: When the user requests party mode, wants multiple agent perspectives, group discussion, roundtable, or multi-agent conversation about their project
---

# BMAD Party Mode

**Original source:** `_bmad/core/bmad-party-mode/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Orchestrates group discussions between installed BMAD agents, enabling natural multi-agent conversations where each agent is a real subagent with independent thinking.

## How It Works

1. **Select agents** — Choose which BMAD agents to include in the discussion
2. **Set the topic** — Define the discussion subject or problem
3. **Define roles** — Assign speaking order, facilitation duties, and interaction rules
4. **Orchestrate the conversation** — Each agent contributes independently as a subagent
5. **Synthesize** — Consolidate all perspectives into actionable conclusions

## Available Agents by Module

| Module | Agents |
|--------|--------|
| **WDS** | Saga (Analyst), Freya (UX Designer), Mimir (Builder) |
| **GDS** | Cloud Dragonborn (Architect), Samus Shepard (Designer), Link Freeman (Dev), Indie (Solo Dev) |
| **TEA** | Murat (Master Test Architect) |
| **BMM** | Mary (Analyst), Paige (Tech Writer), John (PM), Sally (UX), Winston (Architect), Amelia (Dev) |
| **CIS** | Sophia (Storyteller), Maya (Design Thinking), Carson (Brainstorming), Dr. Quinn (Problem Solver), Victor (Innovation), Caravaggio (Presentation) |

## Discussion Modes

### Roundtable
- Equal speaking time for each agent
- Turn-based responses to a central question
- Facilitated by the orchestrator

### Debate
- Two or more agents argue opposing positions
- Third agent (if present) acts as moderator
- Produces structured arguments for and against

### Collaborative Problem-Solving
- Agents contribute to solving a problem together
- Each agent brings their specialty to bear
- Orchestrator integrates contributions

## Response Pattern

1. Ask: "What topic would you like the agents to discuss?"
2. Ask: "Which agents should participate?" (offer suggestions based on topic)
3. Ask: "What mode? Roundtable, debate, or collaborative?"
4. Spawn each agent as a subagent with their specific role
5. Collect and synthesize all perspectives
6. Present consolidated findings with attribution
