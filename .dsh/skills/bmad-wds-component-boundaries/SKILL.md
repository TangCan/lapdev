---
name: bmad-wds-component-boundaries
description: BMAD WDS Component Boundaries — guidelines for determining what constitutes a component. Covers decision framework, composition patterns, and red flags.
whenToUse: When deciding whether something is one component or multiple, evaluating component reuse, or splitting components
---

# BMAD WDS — Component Boundaries

**Original source:** `_bmad/wds/data/design-system/component-boundaries.md`

## The Core Question

**"Is this one component or multiple components?"**

This is the most common design system challenge.

## Guiding Principles

### Principle 1: Single Responsibility
A component should do one thing well.

### Principle 2: Reusability
A component should be reusable across contexts.

### Principle 3: Independence
A component should work independently.

## Decision Framework

### Step 1: Ask These Questions
1. **Can it exist independently?**
   - Yes → Probably separate component
   - No → Probably part of parent

2. **Does it have its own states/behaviors?**
   - Yes → Probably separate component
   - No → Probably part of parent

3. **Is it reused in different contexts?**
   - Yes → Definitely separate component
   - No → Could be part of parent

4. **Does it have a clear single purpose?**
   - Yes → Good component candidate
   - No → Might need to split further

### Step 2: Consider Complexity
- **Low Complexity:** Keep together (icon in button, label with input, simple list items)
- **High Complexity:** Split apart (complex nested structures, independent behaviors, different lifecycle)

### Step 3: Think About Maintenance
- **Together:** Easier to keep consistent, but component becomes complex
- **Apart:** Simpler components, but more to manage

## Composition Patterns

### Pattern 1: Container + Content
Container provides structure, content is flexible.
```yaml
Card Component: (container)
  - Can contain: text, images, buttons, etc.
  - Provides: padding, border, shadow
```

### Pattern 2: Compound Component
Multiple parts that work together.
```yaml
Accordion Component:
  - Accordion Container
  - Accordion Item
  - Accordion Header
  - Accordion Content
```

### Pattern 3: Atomic Component
Single, indivisible unit.
```yaml
Button Component:
  - Cannot be broken down further
  - Self-contained
```

## Red Flags

### Too Many Variants
Component has 10+ variants → Probably multiple components disguised as variants.

### Conditional Complexity
Component has many "if this, then that" rules → Component doing too many things.

### Context-Specific Behavior
Component behaves differently in different contexts → Not truly reusable.

## Common Boundary Questions

### Q1: Icon in Button
- **Part of Button (Variant):** When icon is always the same type (e.g., always arrow)
- **Separate Components:** When icons vary widely, button can exist without icon
- **Recommendation:** Start with variant, split if complexity grows.

### Q2: Label with Input
Usually part of Input Field component — these always appear together, form a semantic unit.

### Q3: Card with Button
Usually separate: Card is a container, button is an action. Different purposes.

### Q4: Navigation Bar Items
- **Simple:** Navigation Bar Component includes all nav items as configuration
- **Complex:** Split into Navigation Bar + Navigation Item if items have complex individual behavior

## When in Doubt
1. Create as single component
2. Add variants as needed
3. Split when complexity becomes painful

**It's easier to split later than merge later.**
