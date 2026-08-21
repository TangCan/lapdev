---
name: bmad-customize
description: Authors and updates customization overrides for installed BMad skills. Covers skill override creation, agent behavior changes, workflow customization, and the customization management workflow.
whenToUse: When the user says 'customize bmad', 'override a skill', 'change agent behavior', or 'customize a workflow'
---

# BMAD Customize

**Original source:** `_bmad/core/bmad-customize/SKILL.md` (missing from installation — reconstructed from `_bmad/_config/skill-manifest.csv`)

## Purpose

Author and update customization overrides for installed BMad skills. Allow users to change agent behavior, modify workflows, and customize skill parameters without editing original files.

## How Customization Works

BMAD supports a layered configuration approach:

```
_original/           # Original BMAD files (never edit)
_custom/            # Custom overrides (your changes live here)
```

Custom files override original files by the same relative path. The BMAD system loads custom first, then falls back to original.

## What Can Be Customized

### 1. Agent Personas
- Modify agent names, roles, descriptions
- Change agent communication style
- Adjust agent capabilities and boundaries

### 2. Workflow Parameters
- Modify workflow step behavior
- Change output templates
- Adjust quality gates and validation rules

### 3. Skill Configuration
- Override skill prompts and instructions
- Change skill triggers and matching rules
- Adjust skill output formats

## Customization Workflow

1. **Identify the skill** to customize (from the skill catalog)
2. **Find the original file path** (listed in the skill metadata)
3. **Create the override file** in `_bmad/custom/` at the same relative path
4. **Edit the override** with your changes
5. **Verify** the override loads correctly

## Finding Customizable Skills

Use the script at `_bmad/core/bmad-customize/scripts/list_customizable_skills.py` to enumerate all customizable skills:

```bash
python _bmad/core/bmad-customize/scripts/list_customizable_skills.py
```

## Response Pattern

1. Ask what the user wants to customize
2. Identify the relevant skill and original file
3. Show the current behavior (from original)
4. Create the override in `_bmad/custom/`
5. Verify the change works
