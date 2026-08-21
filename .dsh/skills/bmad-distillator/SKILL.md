---
name: bmad-distillator
description: Lossless LLM-optimized compression of source documents. Compresses documents into a "distillate" format optimized for LLM consumption while preserving all information.
whenToUse: When the user requests to 'distill documents' or 'create a distillate' or wants to compress documents for LLM use
---

# BMAD Distillator

**Original source:** `_bmad/core/bmad-distillator/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv` and `_bmad/_config/files-manifest.csv`)

## Purpose

Lossless LLM-optimized compression of source documents. Creates "distillates" that are optimized for LLM consumption while preserving all information from the source.

## Architecture

The Distillator uses two specialized agents:

### Distillate Compressor
- Reads source documents
- Identifies redundant, low-value, or high-token-cost content
- Applies compression rules to create optimized output
- Preserves all semantically important information

### Round-Trip Reconstructor
- Takes a distillate and verifies information preservation
- Detects compression errors or information loss
- Ensures lossless round-trip fidelity

## Key Resources

- **Compression Rules:** `_bmad/core/bmad-distillator/resources/compression-rules.md`
- **Distillate Format Reference:** `_bmad/core/bmad-distillator/resources/distillate-format-reference.md`
- **Splitting Strategy:** `_bmad/core/bmad-distillator/resources/splitting-strategy.md`
- **Agent Definitions:** `_bmad/core/bmad-distillator/agents/distillate-compressor.md`, `round-trip-reconstructor.md`
- **Source Analysis Script:** `_bmad/core/bmad-distillator/scripts/analyze_sources.py`

## Distillate Format

A distillate is a compressed document that:
- Preserves all factual information from the source
- Removes formatting overhead and redundancy
- Uses LLM-optimized structure and phrasing
- Is significantly shorter than the source
- Can be perfectly reconstructed back to the original

## Workflow

1. **Select source documents** to distill
2. **Analyze sources** using `analyze_sources.py` to understand structure
3. **Apply compression rules** to create distillate
4. **Verify round-trip fidelity** using the reconstructor
5. **Output the distillate** in the standard format

## Response Pattern

1. Ask: "Which documents would you like to distill?"
2. Confirm the output format and compression level
3. Apply compression rules systematically
4. Verify round-trip fidelity
5. Deliver the distillate with metadata about compression ratio
