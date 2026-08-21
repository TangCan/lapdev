---
name: bmad-wds-freya-specification-quality
description: Freya's Specification Quality Guide — Area Label hierarchy, purpose-based naming, section-first workflow, multi-language support, accessibility, SEO, and the Developer Trust Test.
whenToUse: Before creating any page spec, component definition, or scenario documentation
---

# Freya's Specification Quality Guide

**Original source:** `_bmad/wds/data/agent-guides/freya/specification-quality.md`

**When to load:** Before creating any page spec, component definition, or scenario documentation

## Core Principle

**If I can't explain it logically, it's not ready to specify.**

Gaps in logic become bugs in code. Clear specifications = confident implementation.

## The Logical Explanation Test

Before writing any specification: "Can I explain WHY this exists and HOW it works without hand-waving?"

- ✅ "This button triggers signup flow, serving users who want to feel prepared (driving force)"
- ❌ "There's a button here... because users need it?"

## Area Label Structure & Hierarchy

### Structural Area Labels (Containers)
- `{page-name}-page` — Top-level page wrapper
- `{page-name}-header` — Header section container
- `{page-name}-main` — Main content area
- `{page-name}-form` — Form element wrapper
- `{page-name}-{section}-section` — Section containers

### Interactive Area Labels (Components)
- `{page-name}-{section}-{element}` — Standard pattern
- `{page-name}-input-{field}` — Form inputs
- `{page-name}-button-{action}` — Buttons
- `{page-name}-error-{field}` — Error messages

Area Labels become both `id` and `aria-label` attributes in HTML.

## Purpose-Based Naming

**Name components by FUNCTION, not CONTENT**

✅ Good: `hero-headline`, `primary-cta`, `feature-benefit-section`
❌ Bad: `welcome-message`, `blue-button`, `first-paragraph`

## Section-First Workflow (Top-Down)

1. Define structural containers
2. Assign structural Area Labels
3. Identify page sections
4. Define section purposes
5. Confirm flow logic
6. Detail each section
7. Specify components
8. Assign interactive Area Labels

## Multi-Language from the Start

**Never design in one language only.** Group translations by component.

## Specification Quality Checklist

### Core Quality
- [ ] Logical Explanation — Can I explain WHY and HOW?
- [ ] Purpose-Based Names — Named by function, not content?
- [ ] Clear Purpose — Every component has a job description?
- [ ] Section-First — Whole page flows logically?
- [ ] Multi-Language — All product languages included?
- [ ] No Hand-Waving

### Accessibility
- [ ] ARIA Labels on all interactive elements
- [ ] Alt Text on all images
- [ ] Form Labels on all inputs
- [ ] Keyboard Navigation documented
- [ ] Screen Reader Support
- [ ] Color Contrast (WCAG AA 4.5:1)
- [ ] Heading Hierarchy (H1-H6)

### SEO (Public Pages)
- [ ] H1 Present — exactly one, contains primary keyword
- [ ] Heading Hierarchy — logical, no skipped levels
- [ ] URL Slug — keyword-rich
- [ ] Meta Title — ≤60 chars, includes keyword + brand
- [ ] Meta Description — 150-160 chars, includes keyword + CTA

## Red Flags

🚩 Vague language, Content-based names, Missing purpose, Illogical flow, English-only, Missing accessibility, No alt text, Unlabeled inputs, No SEO section

## The Developer Trust Test

**Could a developer who has never seen your sketches, doesn't know the business context, speaks a different language, lives in a different timezone — build this confidently?**

- ✅ Yes → Good spec
- ❌ No → More work needed
