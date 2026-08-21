---
name: bmad-overview
description: BMAD Framework Overview — describes all modules (WDS, TEA, GDS, BMM, BMB, CIS, Automator, Core), their agents, and how they relate.
whenToUse: When needing a high-level understanding of the entire BMAD framework, its modules, agents, and configuration
---

# BMAD Framework — Overview

**Original source:** `_bmad/config.toml`, `_bmad/*/module-help.csv`

## Project Configuration

```toml
project_name = "lapdev"
document_output_language = "Chinese"
output_folder = "{project-root}/_bmad-output"
```

## Modules

### WDS (Web Design Studio)
- **Purpose:** Digital product design from strategy to implementation
- **Agents:** Saga (Analyst), Freya (UX Designer), Mimir (Builder)
- **Methodology:** wds-v6
- **Design System Mode:** none
- **Key flows:** Product Brief → Trigger Mapping → UX Scenarios → UX Design → Agentic Development

### TEA (Test Architect)
- **Purpose:** Risk-based testing strategy, ATDD, API/UI automation, contract testing
- **Agent:** Murat (Master Test Architect)
- **Capabilities:** Playwright, Cypress, pytest, JUnit, Pact, k6
- **Execution:** auto (capability probe)

### GDS (Game Design Studio)
- **Purpose:** Game design from research to implementation
- **Agents:** Cloud Dragonborn (Architect), Samus Shepard (Designer), Link Freeman (Developer), Indie (Solo Dev)
- **Platforms:** Unity, Unreal, Godot
- **Key flows:** Market Research → Technical Research → Game Design → Implementation

### BMM (Business Model Mapper)
- **Purpose:** Business analysis, strategic planning, stakeholder management
- **Agents:** Mary (Analyst), Paige (Tech Writer), John (PM), Sally (UX), Winston (Architect), Amelia (Developer)
- **Teams:** software-development

### BMB (BMAD Builder)
- **Purpose:** Workflow builder and validator
- **Output:** `{project-root}/skills`
- **Reports:** `{project-root}/skills/reports`

### CIS (Creative Intelligence Studio)
- **Purpose:** Creative problem-solving, design thinking, brainstorming, storytelling
- **Agents:** Sophia (Storyteller), Maya (Design Thinking), Carson (Brainstorming), Dr. Quinn (Problem Solver), Victor (Innovation), Caravaggio (Presentation)
- **Visual Tools:** intermediate

### Automator
- **Purpose:** Automation orchestration
- **Config:** `_bmad/automator/config.yaml`

### Core
- **Purpose:** Shared agents and workflows
- **Agents:** Developer, Product Manager
- **Workflows:** Quick Flow

## Output Directories

| Module | Planning Artifacts | Implementation Artifacts |
|--------|-------------------|-------------------------|
| BMM | `_bmad-output/planning-artifacts/` | `_bmad-output/implementation-artifacts/` |
| TEA | — | `_bmad-output/test-artifacts/` |
| GDS | `_bmad-output/planning-artifacts/` | `_bmad-output/implementation-artifacts/` |
| WDS | `_bmad-output/design-artifacts/` | `_bmad-output/design-artifacts/` |
| BMB | `skills/` | `skills/reports/` |

## Agent Teams

| Team | Agents |
|------|--------|
| ux-design | Saga, Freya, Mimir |
| game-dev | Cloud Dragonborn, Samus Shepard, Link Freeman, Indie |
| software-development | Mary, Paige, John, Sally, Winston, Amelia, Murat |
| creative | Sophia, Maya, Carson, Dr. Quinn, Victor, Caravaggio |

## Custom Configuration

- `_bmad/custom/config.toml` — team-level config (committed)
- `_bmad/custom/config.user.toml` — personal config (gitignored)
- `_bmad/config.user.toml` — user overrides (gitignored)
