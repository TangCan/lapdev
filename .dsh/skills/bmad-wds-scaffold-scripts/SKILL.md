---
name: bmad-wds-scaffold-scripts
description: WDS Scaffold Scripts — Node.js scripts that enforce deterministic output from AI agents. Covers wds-init-scenario, wds-init-page, wds-nav, wds-add-object, wds-add-spacing, and wds-validate.
whenToUse: When setting up WDS scenario/page structure, adding objects or spacing to page specs, or validating page specs
---

# WDS Scaffold Scripts

**Original source:** `_bmad/wds/scripts/README.md`

Node.js scripts that enforce deterministic output from AI agents. Agents provide content via CLI flags; scripts produce structure.

All scripts use only Node.js stdlib (no external dependencies). Run from the project root.

## Scripts

### `wds-init-scenario.js` — Initialize a scenario
Creates the scenario folder and a README index file.
```bash
node src/scripts/wds-init-scenario.js \
  --scenario "01 New User Onboarding" \
  --description "New user first visit to account creation"
```
Output: `C-UX-Scenarios/01-new-user-onboarding/README.md`

### `wds-init-page.js` — Initialize a page spec
Creates a new page spec file with all required sections pre-filled with placeholders.
```bash
node src/scripts/wds-init-page.js \
  --page "01 Start" \
  --scenario "01 New User Onboarding" \
  --platform "Mobile web" \
  --visibility "Public"
```

### `wds-nav.js` — Update navigation links
Scans pages in a scenario and writes correct prev/next navigation rows.
```bash
node src/scripts/wds-nav.js --scenario "01 New User Onboarding"
node src/scripts/wds-nav.js --all
```

### `wds-add-object.js` — Append an object spec
```bash
node src/scripts/wds-add-object.js \
  --page "C-UX-Scenarios/01-new-user-onboarding/01-start/01-start.md" \
  --section "Hero" \
  --object "Primary Headline" \
  --component "H1 heading" \
  --se "Välkommen" \
  --en "Welcome" \
  --behavior "Static display"
```
Object ID is auto-derived: `start-hero-primary-headline`

### `wds-add-spacing.js` — Append a spacing object
```bash
node src/scripts/wds-add-spacing.js \
  --page "C-UX-Scenarios/01-new-user-onboarding/01-start/01-start.md" \
  --direction v \
  --type space \
  --size xl \
  --reason "major section boundary"
```
Valid: directions `v`/`h`, types `space`/`separator`/`line`, sizes `zero`/`sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`flex`

### `wds-validate.js` — Validate page specs
```bash
node src/scripts/wds-validate.js \
  --page "C-UX-Scenarios/01-new-user-onboarding/01-start/01-start.md"
node src/scripts/wds-validate.js --scenario "01 New User Onboarding"
node src/scripts/wds-validate.js --all
```

## How Agents Use These Scripts

1. `wds-init-scenario.js` — create scenario
2. `wds-init-page.js` — for each page
3. `wds-nav.js` — wire navigation after all pages exist
4. `wds-add-object.js` — for each UI object (SE + EN)
5. `wds-add-spacing.js` — for each spacing decision
6. `wds-validate.js` — confirm structural correctness

**The agent never writes raw markdown — it only supplies content as flag values.**

## File Location Convention
```
C-UX-Scenarios/
  {scenario-slug}/
    README.md
    {page-slug}/
      {page-slug}.md
      sketches/
        {page-slug}-concept.jpg
```
