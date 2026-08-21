---
name: bmad-index-docs
description: Generates or updates an index.md to reference all documents in a folder. Scans the target directory, extracts file metadata and summaries, and produces a navigable index file.
whenToUse: When the user requests to create or update an index of all files in a specific folder, or says "generate index" or "create an index of docs"
---

# BMAD Index Docs

**Original source:** `_bmad/core/bmad-index-docs/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Generates or updates an `index.md` to reference all documents in a folder. Scans the target directory, extracts file metadata and summaries, and produces a navigable index file.

## What It Does

1. **Scans the target directory** for all markdown files (recursively or flat)
2. **Extracts metadata** from each file:
   - File name and path
   - Frontmatter fields (title, description, tags)
   - H1 heading
   - First paragraph / summary
3. **Generates `index.md`** with a structured table of contents

## Output Format

```markdown
# Index

_Last updated: [timestamp]_

## Documents

| # | File | Title | Description |
|---|------|-------|-------------|
| 1 | [link] | [title] | [description] |
| 2 | [link] | [title] | [description] |

## By Category

### [Category 1]
- [doc 1](link)
- [doc 2](link)

### [Category 2]
- [doc 3](link)
- [doc 4](link)
```

## Options

- **Recursive scan** — Include subdirectories
- **Flat scan** — Only files in the specified directory
- **Update mode** — Regenerate existing index (preserves existing content)
- **Create mode** — Create new index from scratch

## Response Pattern

1. Ask: "Which folder would you like to index?"
2. Ask: "Recursive (include subdirectories) or flat?"
3. Scan the directory and extract metadata
4. Generate the index file
5. Confirm the index was created/updated
