---
name: bmad-bmb-builder
description: BMB (BMAD Builder) workflow builder and validator — creates and validates BMAD workflow step-files. Covers output structure, validation reports, and builder tools.
whenToUse: When creating or validating BMAD workflows, understanding the builder tooling, or reviewing workflow structure
---

# BMB (BMAD Builder) — Workflow Builder Overview

**Original source:** `_bmad/config.toml` [modules.bmb], `_bmad/bmb/module-help.csv`

BMB is the workflow builder and validator for BMAD. It creates and validates workflow step-file structures.

## Configuration

```toml
[modules.bmb]
bmad_builder_output_folder = "{project-root}/skills"
bmad_builder_reports = "{project-root}/skills/reports"
```

## Output Structure

```
{project-root}/skills/
├── <workflow-name>/
│   ├── SKILL.md                    # Canonical entrypoint
│   ├── customize.toml              # Workflow customization
│   ├── workflow-plan.md            # Design reference
│   ├── workflow.yaml               # Installer metadata
│   ├── instructions.md             # Short summary
│   ├── checklist.md                # Validation criteria
│   ├── steps-c/                    # Create mode steps
│   ├── steps-e/                    # Edit mode steps
│   ├── steps-v/                    # Validate mode steps
│   ├── templates/                  # Output templates
│   └── validation-report-*.md      # Validator outputs
└── reports/
    └── <workflow-name>-report.md
```

## Validation

- Each workflow has a latest `validation-report-*.md`
- Validation uses the BMad Builder workflow validator
- Goal: 100% compliance with no warnings

## Workflow Modes

- **Create (steps-c/):** Primary execution flow
- **Edit (steps-e/):** Structured edits
- **Validate (steps-v/):** Checklist validation

## Step Naming Conventions

- `step-01-*.md` — init step (no menus unless required)
- `step-01b-*.md` — continuation/resume step
- `step-0X-*.md` — sequential create-mode steps
- `steps-v/step-01-validate.md` — validate mode entrypoint
- `steps-e/step-01-assess.md` — edit mode entrypoint
