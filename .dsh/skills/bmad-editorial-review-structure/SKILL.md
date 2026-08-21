---
name: bmad-editorial-review-structure
description: Structural editor that proposes cuts, reorganization, and simplification while preserving comprehension. Reviews document structure, section flow, and information hierarchy.
whenToUse: When the user requests structural review, editorial review of structure, or wants to improve the organization of a document
---

# BMAD Editorial Review — Structure

**Original source:** `_bmad/core/bmad-editorial-review-structure/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Structural editor that proposes cuts, reorganization, and simplification while preserving comprehension. Reviews document structure, section flow, and information hierarchy.

## Review Categories

### 1. Section Hierarchy
- Is the heading hierarchy logical and consistent?
- Are sections grouped in the most intuitive way?
- Are there sections that should be combined or split?
- Is the information architecture clear?

### 2. Content Placement
- Is each piece of information in the right section?
- Are there sections that are out of order?
- Is important information buried or given insufficient prominence?
- Is there repetition across sections?

### 3. Length & Pacing
- Are some sections too long and should be split?
- Are some sections too short and should be combined?
- Is the document's pacing appropriate for its purpose?
- Are there sections that can be cut entirely?

### 4. Redundancy & Duplication
- Is the same information repeated in different sections?
- Can multiple sections be consolidated?
- Are there boilerplate sections that add no value?
- Can examples be trimmed or made more concise?

### 5. Audience Fit
- Is the structure appropriate for the target audience?
- Would a reader find what they need quickly?
- Is the entry point clear?
- Does the structure support the document's primary purpose?

## Review Output Format

```markdown
# Structural Review: [Document Name]

## Summary
[Overall assessment of document structure]

## Structural Findings

### [Finding Category]
**[Severity]** [Section/Location] — [Issue description]
→ **Recommendation:** [Proposed change]

## Proposed Structure

[Numbered outline of proposed new structure]

## Severity Legend
- 🔴 **Critical** — Prevents navigation or understanding
- 🟡 **Moderate** — Degrades efficiency of information access
- 🟢 **Minor** — Style preference or optional improvement
```

## Response Pattern

1. Ask: "What document would you like me to review for structure?"
2. Analyze the document structure holistically
3. Identify structural issues by category
4. Propose a reorganized structure
5. Offer to apply the structural changes
