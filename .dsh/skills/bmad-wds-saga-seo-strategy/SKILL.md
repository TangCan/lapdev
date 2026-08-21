---
name: bmad-wds-saga-seo-strategy
description: Saga's SEO Strategy Guide — keyword strategy, URL structure, heading hierarchy, internal linking, and structured data planning during Content & Language phase.
whenToUse: During Content & Language phase (step-05) for any public website project, or when planning SEO for a new site
---

# Saga's SEO Strategy Guide

**Original source:** `_bmad/wds/data/agent-guides/saga/seo-strategy-guide.md`

**When to load:** During Content & Language phase (step-05) for any public website project

## Core Principle

**SEO is content strategy, not an afterthought.** Keywords, URL structure, and page-level optimization should be planned during the project brief.

## 1. Keyword Strategy

### Keyword Categories by Intent

| Category | Intent | Example |
|----------|--------|---------|
| **Service** | Looking for specific service | "bilservice Öland" |
| **Location** | Near-me searches | "bilverkstad norra Öland" |
| **Problem** | Has a specific issue | "AC reparation bil" |
| **Brand** | Looking for the business | "Källa Fordonservice" |
| **Informational** | Seeking knowledge | "när byta bromsklossar" |

### Keyword Localization
Keywords don't translate word-for-word. For each language:
- What would a native speaker actually search?
- What local terminology is used?
- What misspellings are common?
- What long-tail phrases exist?

### Page-Keyword Map

```markdown
| Page | URL Slug | Primary Keyword (SE) | Primary Keyword (EN) |
|------|----------|---------------------|---------------------|
| Hem | / | bilverkstad Öland | car repair Öland |
| Service | /service | bilservice | car service |
```

## 2. URL Structure

**Best Practices:**
- Short and descriptive: `/tjanster/ac-service` not `/page?id=42`
- Lowercase, hyphens: `/dack-service` not `/Däck_Service`
- Keyword-rich: Include primary keyword in slug
- Consistent pattern across the site
- ASCII equivalents (å→a, ä→a, ö→o)

**Recommended: Subdirectory structure**
```
example.com/          → Primary language
example.com/en/       → English
example.com/de/       → German
```

## 3. Heading Hierarchy

- **One H1 per page** — Contains primary keyword
- **Logical H2→H3 flow** — No skipping levels
- **Keywords in headings** — Natural, not stuffed
- **H1 ≠ Page Title tag** — H1 visible on page, title tag in search results

## 4. Internal Linking Strategy

- Every page should link to at least 2 other pages
- Use descriptive anchor text — not "Click here"
- Link from high-value pages to lower-value pages

## 5. Structured Data (Schema.org)

- LocalBusiness (in footer/header of all pages)
- Service (on service pages)
- Article (on articles)

## Keyword Usage Guidelines

- Page titles: Primary keyword + brand name
- H1: Primary keyword (can differ from title tag)
- Meta descriptions: Primary keyword + benefit + CTA
- Body: Natural keyword density, no stuffing
- Images: Descriptive alt text with keyword where relevant
