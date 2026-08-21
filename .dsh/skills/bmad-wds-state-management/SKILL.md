---
name: bmad-wds-state-management
description: BMAD WDS Component State Management — standard states for interactive, form, and feedback components. Covers state naming, transitions, and visual indicators.
whenToUse: When defining component states, mapping state transitions, or documenting component behaviors
---

# BMAD WDS — Component State Management

**Original source:** `_bmad/wds/data/design-system/state-management.md`

## Standard States

### Interactive Components (Buttons, Links)

**Required:**
- `default` — Normal, ready for interaction
- `hover` — Mouse over component
- `active` — Being clicked/pressed
- `disabled` — Cannot interact

**Optional:**
- `loading` — Processing action
- `focus` — Keyboard focus

### Form Components (Inputs, Selects)

**Required:**
- `default` — Empty, ready for input
- `focus` — Active input
- `filled` — Has content
- `disabled` — Cannot edit

**Optional:**
- `error` — Validation failed
- `success` — Validation passed
- `loading` — Fetching data

### Feedback Components (Alerts, Toasts)

**Required:**
- `default` — Neutral information
- `success` — Positive feedback
- `error` — Error feedback
- `warning` — Caution feedback

## State Naming

Use standard names:
- ✅ `hover` not `mouseover`
- ✅ `disabled` not `inactive`
- ✅ `loading` not `processing`

Be consistent across components.

## State Transitions

Define how states change:
```yaml
Button States: default → hover (mouse enters)
  hover → active (mouse down)
  active → hover (mouse up)
  hover → default (mouse leaves)
  any → disabled (programmatically)
  any → loading (action triggered)
```

## Visual Indicators

Each state should be visually distinct:
```yaml
Button:
  default: blue background
  hover: darker blue + scale 1.02
  active: darkest blue + scale 0.98
  disabled: gray + opacity 0.6
  loading: disabled + spinner
```
