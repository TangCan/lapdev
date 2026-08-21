---
name: bmad-wds-naming-conventions
description: BMAD WDS Naming Conventions — consistent naming across components, tokens, variants, states, files, and folders.
whenToUse: When creating new components, design tokens, or any design system artifact
---

# BMAD WDS — Naming Conventions

**Original source:** `_bmad/wds/data/design-system/naming-conventions.md`

## Component IDs

**Format:** `[type-prefix]-[number]`

**Prefixes:**
- btn = Button, inp = Input Field, chk = Checkbox, rad = Radio, tgl = Toggle
- drp = Dropdown, mdl = Modal, crd = Card, alt = Alert, bdg = Badge
- tab = Tab, acc = Accordion

**Rules:** Always lowercase, hyphenated, zero-padded (001), sequential within type.

## Component Names

**Format:** `[Type] [Descriptor]` or just `[Type]`

Title case, descriptive but concise. Avoid redundancy.

## Variant Names

**Format:** Lowercase, hyphenated.

- Purpose-Based: `primary`, `secondary`, `destructive`, `success`, `warning`, `navigation`
- Visual-Based: `outlined`, `ghost`, `solid`
- Size-Based: `small`, `medium`, `large`

Semantic over visual when possible.

## State Names

Standard: `default`, `hover`, `active`, `focus`, `disabled`, `loading`, `error`, `success`, `warning`

Lowercase, single word preferred.

## Design Token Names

**Format:** `--{category}-{property}-{variant}`

```
--color-primary-500
--color-gray-900
--color-success-600
--text-xs
--text-base
--text-4xl
--spacing-1
--spacing-4
--spacing-8
--button-padding-x
--input-border-color
--card-shadow
```

## File Names

Lowercase, hyphenated, match component name.

## Folder Names

Lowercase, hyphenated, plural for collections.

```
components/
design-tokens/
operations/
assessment/
templates/
```
