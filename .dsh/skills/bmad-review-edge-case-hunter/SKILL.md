---
name: bmad-review-edge-case-hunter
description: Walk every branching path and boundary condition in content, reporting only unhandled edge cases. Method-driven analysis orthogonal to adversarial review. Covers code, specs, and diffs.
whenToUse: When the user needs exhaustive edge-case analysis of code, specs, or diffs, or asks for boundary condition review
---

# BMAD Review — Edge Case Hunter

**Original source:** `_bmad/core/bmad-review-edge-case-hunter/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Walk every branching path and boundary condition in content, reporting only unhandled edge cases. This is method-driven, not attitude-driven — orthogonal to adversarial review.

## Methodology

Systematically explore every path, condition, and boundary in the subject:

### 1. Path Enumeration
- Map every decision point and branch
- Identify all possible execution paths
- Find paths that are never exercised or tested

### 2. Boundary Analysis
- Test minimum and maximum values
- Check empty/null/undefined cases
- Verify overflow and underflow conditions
- Examine state transitions at boundaries

### 3. State Space Exploration
- Identify all possible states
- Map state transitions
- Find unreachable or dead-end states
- Check state corruption scenarios

### 4. Interaction Analysis
- Test all pairwise interactions between components
- Identify race conditions and timing dependencies
- Check resource contention scenarios
- Verify concurrency safety

## Review Categories

### For Code
- Null/undefined/empty inputs
- Boundary values (min, max, negative, zero)
- Exception handling paths
- Concurrency and race conditions
- Resource exhaustion
- Error recovery paths

### For Specs
- Missing requirements
- Ambiguous requirements
- Conflicting requirements
- Unspecified behavior
- Missing acceptance criteria
- Undocumented assumptions

### For Diffs
- Changed behavior at boundaries
- New code paths without tests
- Deleted code paths that were needed
- Inconsistent changes across related areas
- Missing cleanup or migration

## Output Format

```markdown
# Edge Case Analysis: [Subject]

## Summary
[Number of paths explored, number of edge cases found]

## Edge Cases Found

### [Category]
**🔴 Critical** [Location] — [Edge case description]
→ **Impact:** [What happens]
→ **Suggested fix:** [How to handle]

**🟡 Moderate** [Location] — [Edge case description]
→ **Impact:** [What happens]
→ **Suggested fix:** [How to handle]

## Coverage Summary
- [X] paths explored
- [Y] edge cases found
- [Z] already handled (false positives)
- [N] recommended fixes

## Verdict
[All clear / Minor gaps / Significant gaps / Critical gaps]
```

## Response Pattern

1. Ask: "What would you like me to analyze for edge cases?"
2. Enumerate all paths and boundaries
3. Systematically check each one
4. Report only unhandled edge cases
5. Classify by severity and impact
