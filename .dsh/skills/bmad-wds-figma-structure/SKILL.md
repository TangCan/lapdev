---
name: bmad-wds-figma-structure
description: BMAD WDS Figma Component Structure — guidelines for organizing Figma components to mirror WDS structure, including naming, variants, tokens, and sync workflow.
whenToUse: When working with Figma components, setting up Figma for WDS integration, or configuring Figma MCP
---

# BMAD WDS — Figma Component Structure

**Original source:** `_bmad/wds/data/design-system/figma-component-structure.md`

## Core Principle

Figma components should mirror WDS component structure:
```
Figma Component → WDS Component Specification → React Implementation
```

## Component Organization in Figma

```
Design System File (Figma)
├── 📄 Cover (project info)
├── 🎨 Foundation
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Effects
├── ⚛️ Components
│   ├── Buttons
│   ├── Inputs
│   ├── Cards
│   └── [other component types]
└── 📱 Examples
    └── Component usage examples
```

## Component Naming Convention

**Format:** `[ComponentType]/[ComponentName]`

Examples: `Button/Primary`, `Input/Text`, `Card/Profile`

Rules: Forward slash for hierarchy, Title case, match WDS component names.

## Variant Structure

Use Figma's variant properties:
- **Type** (primary, secondary, ghost, outline)
- **Size** (small, medium, large)
- **State** (default, hover, active, disabled, loading)
- **Icon** (none, left, right, only)

**Variant Naming:** `Property=Value` format.

## Design Tokens in Figma

Map Figma variables to WDS tokens:
- Colors: `primary/500` → `color-primary-500`
- Typography: `Text/Display` → `text-display`
- Spacing: `spacing/2` → `spacing-2`
- Effects: `shadow/sm` → `shadow-sm`

## Component Description Template

```
[Component Name] [component-id]

**Purpose:** [Brief description]
**When to use:** [Use cases]
**When not to use:** [Anti-patterns]
**WDS Component:** [ComponentType].[variant] [component-id]
**Variants:** [List]
**States:** [List]
**Size:** [Available sizes]
**Accessibility:** [ARIA, keyboard, screen reader]
```

## Sync Workflow

### Figma → WDS
1. Designer creates/updates component
2. Designer adds WDS component ID to description
3. MCP reads component via Figma API
4. MCP extracts structure, variants, states, properties, tokens
5. MCP generates/updates WDS specification
6. Designer reviews and confirms

### WDS → Figma
1. Specification updated in WDS
2. Designer notified of changes
3. Designer updates Figma component
4. Designer confirms sync
5. Node ID verified/updated

## Common Mistakes

- ❌ Hardcoded values instead of variables
- ❌ Detached instances instead of component instances
- ❌ Inconsistent naming (btn-primary, ButtonSecondary, button_ghost)
- ❌ Missing states (only default, no hover/active/disabled)
- ❌ No WDS component ID

## Quality Checklist

- [ ] Component name follows convention
- [ ] WDS component ID in description
- [ ] All variants defined
- [ ] All states documented
- [ ] Auto layout properly configured
- [ ] Design tokens used (not hardcoded values)
- [ ] Accessibility notes included
- [ ] Usage guidelines documented
