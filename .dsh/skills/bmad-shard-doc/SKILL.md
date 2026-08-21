---
name: bmad-shard-doc
description: Splits large markdown documents into smaller, organized files based on level 2 (default) sections. Creates an index.md that links to all shards.
whenToUse: When the user says "perform shard document" or "split this document" or wants to break a large markdown file into smaller files
---

# BMAD Shard Document

**Original source:** `_bmad/core/bmad-shard-doc/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Splits large markdown documents into smaller, organized files based on level 2 (default) sections. Creates an index.md that links to all shards.

## How It Works

1. **Read the source document**
2. **Identify section boundaries** (default: `##` headings)
3. **Split into individual files** — one per section
4. **Generate index.md** — links to all shards with summaries
5. **Clean up** — remove original or archive it

## Configuration

### Section Level
- **Default:** `##` (Level 2 headings)
- **Configurable:** Any heading level (`#`, `##`, `###`, etc.)

### Output Structure
```
shards/
├── index.md                    # Table of contents
├── 01-section-one.md          # First section
├── 02-section-two.md          # Second section
└── ...
```

### File Naming
- Sequential numbering (`01-`, `02-`, etc.)
- Kebab-case section titles
- Original document name as prefix (optional)

## Options

- **Section level:** Which heading level to split on (default: `##`)
- **Include frontmatter:** Whether to preserve YAML frontmatter from the original
- **Include original headings:** Whether to keep the heading line in each shard
- **Output directory:** Where to place shard files (default: `shards/`)
- **Archive original:** Whether to move the original to an archive (optional)

## Output Format

### Shard file:
```markdown
# [Section Title]

[Section content]
```

### index.md:
```markdown
# Index: [Original Document Name]

_Shared from: [original path]_

## Sections

1. [Section 1](01-section-one.md) — [Summary]
2. [Section 2](02-section-two.md) — [Summary]
3. [Section 3](03-section-three.md) — [Summary]
```

## Response Pattern

1. Ask: "Which document would you like to shard?"
2. Ask: "Which heading level to split on?" (default: `##`)
3. Ask: "Where to output?" (default: `shards/`)
4. Read and split the document
5. Generate all shard files and index.md
6. Confirm the result
