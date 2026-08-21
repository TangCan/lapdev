---
name: bmad-wds-saga-strategic-documentation
description: Saga's Strategic Documentation Guide — Project Outline and Product Brief creation. Covers YAML project outline structure, 10-step Product Brief workshop, documentation quality checklist.
whenToUse: When creating Product Brief, Project Outline, or any strategic documentation
---

# Saga's Strategic Documentation Guide

**Original source:** `_bmad/wds/data/agent-guides/saga/strategic-documentation.md`

**When to load:** When creating Product Brief, Project Outline, or any strategic documentation

## Core Principle

**Create documentation that coordinates teams and persists context.**

Every project needs a North Star — clear, accessible, living documentation that guides all work.

## The Project Outline

Created during Product Brief (Step 1), updated throughout project.

**Purpose:**
- Single source of truth for project status
- Coordination point for all team members
- Context preservation across sessions
- Onboarding tool for new collaborators

### Structure (YAML)

```yaml
project:
  name: [Project Name]
  type: [digital_product|landing_page|website|other]
  status: [planning|in_progress|complete]

methodology:
  type: [wds-v6|wps2c-v4|custom]
  instructions_file: [if custom]

phases:
  phase_1_product_brief:
    folder: "docs/A-Product-Brief/"
    name: "Product Exploration"
    status: [not_started|in_progress|complete]
    artifacts:
      - product-brief.md

languages:
  specification_language: "en"
  product_languages: ["en", "se"]

design_system:
  enabled: true
  mode: [none|figma|component_library]
```

## The Product Brief — 10-Step Workshop

1. **Vision & Problem Statement** — What are we building and why?
2. **Positioning** — How are we different? ("For [target] who [need], our [product] is [category]...")
3. **Strategic Context** — Extracted from Trigger Map (business goal, persona, driving forces)
4. **Business Model** — How do we make money? (revenue model, pricing, unit economics)
5. **Business Customers** — Who pays? (B2B only: decision makers, budget owners, deal cycle)
6. **Target Users** — Who actually uses it? (segments, demographics, psychographics)
7. **Success Criteria** — How do we measure success? (business metrics, user metrics, technical metrics)
8. **Competitive Landscape** — Who else serves these users? (competitors, gaps, differentiation)
9. **Constraints** — What limits us? (technical, timeline, budget, compliance)
10. **Additional Context** — Anything else relevant

## Documentation Quality Checklist

- [ ] **Clear purpose** — Why does this document exist?
- [ ] **Audience identified** — Who needs to read it?
- [ ] **Self-contained** — Can reader understand without other docs?
- [ ] **Specific names** — No README.md or generic.md?
- [ ] **Absolute paths** — All file references explicit?
- [ ] **Evidence-based** — Claims backed by research/data?
- [ ] **Accessible language** — Readable by all stakeholders?
- [ ] **Structured well** — Scannable, logical hierarchy?
- [ ] **Up to date** — Reflects current reality?
- [ ] **Actionable** — Others can use this to make decisions?
