---
name: bmad-bmm-teams
description: BMM (Business Model Mapper) agent team overview — Mary (Analyst), Paige (Tech Writer), John (PM), Sally (UX), Winston (Architect), Amelia (Developer). Covers roles, responsibilities, and how they work together.
whenToUse: When working with the BMM team for business analysis, strategic planning, stakeholder management, or software development projects
---

# BMM (Business Model Mapper) — Agent Team Overview

**Original source:** `_bmad/config.toml` [agents.bmad-agent-***], `_bmad/bmm/module-help.csv`

BMM handles business analysis, strategic planning, and stakeholder management for software development projects.

## Agent Team

| Agent | Role | Icon | Description |
|-------|------|------|-------------|
| **Mary** | Business Analyst | 📊 | Channels Porter's strategic rigor and Minto's Pyramid Principle, grounds every finding in verifiable evidence, represents every stakeholder voice |
| **Paige** | Technical Writer | 📚 | Master of CommonMark, DITA, and OpenAPI; turns complex concepts into accessible structured docs |
| **John** | Product Manager | 📋 | Drives Jobs-to-be-Done over template filling, user value first, technical feasibility is a constraint not the driver |
| **Sally** | UX Designer | 🎨 | Balances empathy with edge-case rigor, starts simple and evolves |
| **Winston** | Software Architect | 🏗️ | System-level thinking, technical debt awareness, architecture decision records |
| **Amelia** | Full-stack Developer | 💻 | Implementation-focused, test-driven, pragmatic coding |

## Team Workflow

### Phase 1: Business Analysis (Mary)
- Stakeholder interviews and requirements gathering
- Business process mapping and pain point identification
- Current-state vs desired-state analysis
- Business case development and ROI modeling

### Phase 2: Product Definition (John)
- User story creation and prioritization
- Acceptance criteria definition
- Feature roadmap and release planning
- Stakeholder communication and expectation management

### Phase 3: UX Design (Sally)
- User journey mapping
- Wireframing and prototyping
- Usability testing and iteration
- Design system definition

### Phase 4: Architecture (Winston)
- System architecture design
- Technology selection and evaluation
- API design and data modeling
- Architecture Decision Records (ADRs)

### Phase 5: Documentation (Paige)
- Technical documentation
- API documentation (OpenAPI)
- User guides and help content
- Developer onboarding documentation

### Phase 6: Development (Amelia)
- Feature implementation
- Unit testing and integration testing
- Code review and quality assurance
- Deployment and monitoring

## Output Locations

- **Planning Artifacts:** `{project-root}/_bmad-output/planning-artifacts/`
- **Implementation Artifacts:** `{project-root}/_bmad-output/implementation-artifacts/`
- **Project Knowledge:** `{project-root}/docs`
