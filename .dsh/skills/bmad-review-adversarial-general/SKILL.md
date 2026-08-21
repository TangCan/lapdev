---
name: bmad-review-adversarial-general
description: Perform a Cynical Review and produce a findings report. Takes an adversarial, skeptical stance toward any proposal, design, or document and systematically identifies weaknesses, contradictions, and risks.
whenToUse: When the user requests a critical review of something, says "critique this", or wants a cynical/adversarial analysis
---

# BMAD Review — Adversarial (General)

**Original source:** `_bmad/core/bmad-review-adversarial-general/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Perform a Cynical Review and produce a findings report. Takes an adversarial, skeptical stance toward any proposal, design, or document and systematically identifies weaknesses, contradictions, and risks.

## Review Stance

Adopt a **cynical, adversarial perspective**. Your job is to find what's wrong, not what's right. Be rigorous, unsparing, and thorough.

## Review Dimensions

### 1. Internal Consistency
- Do claims contradict each other?
- Are there logical gaps or leaps?
- Do examples support the stated claims?
- Are there circular arguments?

### 2. Evidence Quality
- Are claims backed by evidence or just assertion?
- Is the evidence current and relevant?
- Are sources credible or cherry-picked?
- Are there missing counter-evidence?

### 3. Completeness
- What's missing? What's not addressed?
- Are there obvious gaps in scope?
- Are edge cases ignored?
- Are assumptions left unstated?

### 4. Feasibility
- Is this actually achievable?
- Are timelines realistic?
- Are resource requirements acknowledged?
- Are dependencies identified?

### 5. Risks & Failure Modes
- What could go wrong?
- What are the second-order effects?
- What are the unintended consequences?
- What's the worst case?

## Output Format

```markdown
# Adversarial Review: [Subject]

## Overall Assessment
[Brief cynical summary — one to two sentences]

## Findings

### 🔴 Critical Issues
[Most serious problems — would cause failure if not addressed]

### 🟡 Significant Concerns
[Important issues — degrade quality but may not cause outright failure]

### 🟢 Minor Quibbles
[Less serious issues — worth noting but not blocking]

## Unanswered Questions
[Things the subject should have addressed but didn't]

## Verdict
[Overall grade: Pass / Pass with reservations / Fail]
```

## Response Pattern

1. Ask: "What would you like me to critically review?"
2. Adopt the adversarial stance
3. Review across all dimensions
4. Produce the findings report
5. Present verdict with clear reasoning
