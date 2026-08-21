---
name: bmad-wds-token-architecture
description: BMAD WDS Design Token Architecture — separates semantic structure from visual style. Three-level token hierarchy (raw, semantic, component).
whenToUse: When defining design tokens, mapping semantic HTML to visual styles, or setting up a design system
---

# BMAD WDS — Design Token Architecture

**Original source:** `_bmad/wds/data/design-system/token-architecture.md`

## Core Principle

**Separate semantic structure from visual style.**

```
HTML/Structure = Meaning (what it is)
Design Tokens = Appearance (how it looks)

They should be independent!
```

## Token Hierarchy

### Level 1: Raw Values
```css
--spacing-4: 1rem;
--color-blue-600: #2563eb;
--font-size-4xl: 2.25rem;
```

### Level 2: Semantic Tokens
```css
--text-heading-large: var(--font-size-4xl);
--color-primary: var(--color-blue-600);
--spacing-section: var(--spacing-4);
```

### Level 3: Component Tokens
```css
--button-padding-x: var(--spacing-section);
--button-color-primary: var(--color-primary);
--heading-size-section: var(--text-heading-large);
```

**Use Level 2 or 3 in components, never Level 1 directly.**

## Token Naming Conventions

### Colors
```
--color-{category}-{shade}
--color-primary-600
--color-gray-900
--color-success-500
```

### Typography
```
--text-{size}
--text-base
--text-lg
--text-4xl
```

### Spacing
```
--spacing-{scale}
--spacing-2
--spacing-4
--spacing-8
```

### Component-Specific
```
--{component}-{property}-{variant}
--button-padding-primary
--input-border-error
--card-shadow-elevated
```

## Application to WDS

### In Page Specifications
- Specify semantic HTML elements (h1, h2, button, input)
- Map to design tokens
- Do NOT specify exact colors, sizes, or spacing

### In Design System
- Define design tokens
- Define component styling
- Define visual properties

## Common Mistakes

### Mistake 1: Mixing Structure and Style
❌ Bad: `"Large blue heading" (h2)`
✅ Good: `Section heading (h2 → heading-section token)`

### Mistake 2: Hardcoding Visual Values
❌ Bad: `background: #2563eb; padding: 16px`
✅ Good: `background: primary-600; padding: spacing-4`

### Mistake 3: Using Visual Names for Semantic Elements
❌ Bad: `<h2 class="big-blue-text">`
✅ Good: `<h2 class="section-heading">`

## Company Customization

Companies can fork WDS and customize tokens:
```
Company Fork:
├── data/design-system/
│   ├── token-architecture.md (keep principles)
│   ├── company-tokens.md (company-specific values)
│   └── token-mappings.md (h2 → company-heading-large)
```
