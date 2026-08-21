---
name: bmad-wds-validation-patterns
description: BMAD WDS Form Validation Patterns — standard patterns for client-side validation, error states, and success states for form components.
whenToUse: When specifying form components, validation rules, error handling, or form UX
---

# BMAD WDS — Form Validation Patterns

**Original source:** `_bmad/wds/data/design-system/validation-patterns.md`

## Validation Types

### Client-Side Validation

**Required Fields:**
```yaml
validation:
  required: true
  message: 'This field is required'
```

**Format Validation:**
```yaml
validation:
  type: email
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  message: 'Please enter a valid email address'
```

**Length Validation:**
```yaml
validation:
  minLength: 8
  maxLength: 100
  message: 'Password must be 8-100 characters'
```

## Error States

**Visual Indicators:**
- Red border
- Error icon
- Error message below field
- Error color for label

**Timing:**
- Show on blur (after user leaves field)
- Show on submit attempt
- Clear on valid input

## Success States

**Visual Indicators:**
- Green border (optional)
- Success icon (optional)
- Success message (optional)

**When to Show:**
- After successful validation
- For critical fields (password strength)
- For async validation (username availability)
