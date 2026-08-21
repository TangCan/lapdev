---
name: bmad-advanced-elicitation
description: Push the LLM to reconsider, refine, and improve its recent output. Deeper critique methods: Socratic questioning, first principles thinking, pre-mortem analysis, and red team review.
whenToUse: When the user asks for deeper critique or mentions a known deeper critique method such as socratic, first principles, pre-mortem, or red team
---

# BMAD Advanced Elicitation

**Original source:** `_bmad/core/bmad-advanced-elicitation/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Push the LLM to reconsider, refine, and improve its recent output through structured deeper critique methods. Use when the user asks for deeper critique or mentions a known method.

## Available Methods

### 1. Socratic Questioning
Ask probing questions that expose assumptions and gaps in reasoning.

**When to use:** When you want to explore whether a conclusion is well-founded.

**Technique:**
- "What evidence supports this?"
- "What assumptions are we making?"
- "What would happen if this assumption were false?"
- "Is there an alternative interpretation?"
- "How does this connect to the larger context?"

### 2. First Principles Thinking
Break down complex problems to their fundamental truths and reason up from there.

**When to use:** When current approaches feel derivative or stuck in conventional thinking.

**Technique:**
- Identify what we believe to be true
- Separate facts from assumptions
- Find the irreducible fundamentals
- Build solutions from scratch using only fundamentals
- Question every inherited constraint

### 3. Pre-Mortem Analysis
Imagine the project has failed and work backwards to identify why.

**When to use:** Before committing to a plan, design, or decision.

**Technique:**
- "It's 6 months from now. This failed. Why?"
- List all possible failure modes
- Rate each by likelihood and impact
- Identify early warning signs
- Create mitigation plans for top risks

### 4. Red Team Review
Actively try to find flaws, weaknesses, and attack vectors in a proposal.

**When to use:** When you want to stress-test a design, strategy, or implementation plan.

**Technique:**
- Adopt an adversarial stance
- Challenge every claim and assumption
- Look for edge cases and failure modes
- Question security, scalability, and correctness
- Document all findings with severity ratings

## How to Apply

1. **Ask the user which method** they want to apply (or suggest one based on context)
2. **Load the relevant method** from `_bmad/core/bmad-advanced-elicitation/methods.csv` if available
3. **Apply the method** to the current output or proposal
4. **Present findings** with clear structure and actionable recommendations
5. **Suggest refinements** based on the critique

## Response Pattern

- Acknowledge the user's request for deeper analysis
- Select the appropriate method (or ask if unclear)
- Apply the method systematically
- Present findings clearly
- Suggest next steps
