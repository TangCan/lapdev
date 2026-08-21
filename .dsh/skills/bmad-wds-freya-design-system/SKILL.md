---
name: bmad-wds-freya-design-system
description: Freya's Design System Guide — three modes (No Design System, Custom Figma, Component Library). Covers the Design System Router, opportunity/risk assessment, component operations, and atomic design structure.
whenToUse: When Phase 7 (Design System) is enabled and component questions arise, or when deciding design system mode
---

# Freya's Design System Guide

**Original source:** `_bmad/wds/data/agent-guides/freya/design-system.md`

**When to load:** When Phase 7 (Design System) is enabled and component questions arise

## Core Principle

**Design systems grow organically - discover components through actual work, never create speculatively.**

## Three Design System Modes

### Mode A: No Design System
- All components stay page-specific
- No component extraction
- AI/dev team handles consistency
- Faster for simple projects

### Mode B: Custom Figma Design System
- Designer defines components in Figma
- Components extracted as discovered during Phase 4
- Figma MCP endpoints for integration
- Component IDs link spec ↔ Figma

### Mode C: Component Library Design System
- Uses shadcn/Radix/similar library
- Library chosen during setup
- Components mapped to library defaults
- Variants customized as needed

## The Design System Router

**Runs automatically during Phase 4 component specification:**
1. Check: Design system enabled? (Mode B or C)
2. If NO → Create page-specific, continue
3. If YES → Call design-system-router:
   - Is this component new?
   - Is there a similar component?
   - Should we create new or use/extend existing?

## Never Create Components Speculatively

❌ Wrong: "Let me create a full component library upfront..."
✅ Right: "I'm designing the landing page hero... oh, I need a button."

Process:
1. Design the button for this specific page
2. When another page needs a button → Opportunity!
3. Assess: Similar enough to extract?
4. Extract to Design System if makes sense

## Foundation First

### 1. Design Tokens (before any components)
- Colors: Primary, secondary, accent, neutral scale, semantic
- Typography: Font families, scales, weights, line heights
- Spacing: Spacing scale, layout scales
- Effects: Border radius, shadows, transitions

### 2. Atomic Design Structure
```
atoms/     → button, input, label, icon, badge
molecules/ → form-field, card, search-box
organisms/ → header, feature-section, form
```

## Component Operations

1. **Initialize Design System** — First component triggers auto-initialization
2. **Create New Component** — Define spec, assign Component ID, document states/variants
3. **Add Variant** — Extend existing, document trigger, update spec
4. **Update Component** — Modify, increment version, document rationale

## Component Specification Template

```markdown
# [Component Name] [COMP-001]

**Type:** [Atom|Molecule|Organism]
**Library:** [shadcn Button|Custom|N/A]
**Figma:** [Link if Mode B]

## Purpose
[What job does this component do?]

## Variants
- variant-name: [When to use]

## States
- default, hover, active, disabled, loading, error

## Props/Attributes
| Prop | Type | Default | Description |

## Styling
[Design tokens or Figma reference]

## Used In
- [Page name] ([purpose])

## Version History
- v1.0.0 (date): Initial creation
```
