---
name: bmad-gds-technical-research-steps
description: GDS Technical Research step-by-step workflow — 6-step process covering scope confirmation, technology stack, integration patterns, architectural patterns, implementation, and synthesis.
whenToUse: When conducting game technical research step-by-step — covers all 6 research phases from scope confirmation to final document synthesis
---

# GDS Technical Research — Step-by-Step Workflow

**Original source:** `_bmad/gds/workflows/1-preproduction/research/technical-steps/`

A 6-step game technical research workflow. Each step requires web search verification and user confirmation before proceeding.

## Mandatory Rules

- NEVER generate content without web search verification
- ALWAYS read the complete step file before taking any action
- Present [C] continue option after content generation
- Update frontmatter `stepsCompleted` before loading next step
- FORBIDDEN to load next step until C is selected

## Step 1: Technical Research Scope Confirmation

**Role:** Game Technical Research Planner
**Focus:** Scope confirmation only — no web research yet

Confirm scope covering:
- **Engine and Framework Analysis** — game engine selection, rendering architecture, tooling
- **Implementation Approaches** — game loop, ECS, coding patterns, development workflow
- **Technology Stack** — languages, engines, middleware, tools, platforms
- **Integration Patterns** — online services, platform APIs, analytics, interoperability
- **Performance Considerations** — frame rate, optimization, platform-specific constraints

**Output:** Append scope confirmation to research document with research topic, goals, scope areas, and methodology.

## Step 2: Game Technology Stack Analysis

**Role:** Game Technology Stack Analyst
**Focus:** Game engines, languages, middleware, tools, platforms

**Research areas:**
- Game engines and rendering frameworks (Unreal, Unity, Godot, proprietary)
- Programming languages and scripting (C++, C#, GDScript, Lua, Blueprint)
- Middleware and specialized game tech (physics, audio, animation, networking)
- Game development tools and pipelines (IDEs, profilers, asset pipelines)
- Platform SDKs and deployment infrastructure

**Web searches:** engine comparisons, dev tools middleware, audio physics networking, platform SDK deployment.

## Step 3: Game Integration Patterns

**Role:** Game Integration Analyst
**Focus:** Online services, platform APIs, analytics, system interoperability

**Research areas:**
- Online multiplayer and backend services (PlayFab, Nakama, Heroic Labs)
- Platform API integration (Steam, PSN, Xbox Live, GameCenter)
- Game analytics and telemetry (Unity Analytics, GameAnalytics, Amplitude)
- Live service operations infrastructure (CDN, live events, remote config)
- Anti-cheat and security integration (EAC, BattlEye)
- Game economy and monetization integration (IAP, virtual currency, battle pass)

## Step 4: Game Architectural Patterns

**Role:** Game Systems Architect
**Focus:** Engine architecture, ECS patterns, rendering pipelines, system design

**Research areas:**
- Game engine architecture patterns (ECS, OOP, data-oriented design)
- Game loop and update pipeline patterns (fixed vs variable timestep)
- Rendering architecture (forward vs deferred, PBR, LOD, post-processing)
- Game world and level architecture (scene graph, streaming, spatial partitioning)
- Multiplayer and network architecture (client-server, P2P, state sync, lag compensation)
- Game data and save architecture, performance and scalability

## Step 5: Game Implementation Research

**Role:** Game Implementation Engineer
**Focus:** Practical game development approaches and technology adoption

**Research areas:**
- Game development workflow and iteration (agile, playtesting, alpha/beta)
- Game testing and QA (automated testing, platform certification)
- Game deployment and release management (CI/CD, platform submission)
- Live game operations and post-launch (content updates, support, monitoring)
- Team organization, cost optimization, risk assessment

## Step 6: Technical Synthesis and Completion

**Role:** Game Technical Research Strategist
**Focus:** Comprehensive synthesis producing final document

**Produces:**
- Compelling narrative introduction with research significance
- Executive summary with key findings and strategic implications
- Detailed TOC (12 sections)
- 12 comprehensive sections covering all research areas
- Strategic recommendations and development roadmap
- Risk assessment and future technology outlook
- Source documentation and quality assurance

**Document structure:**
1. Game Technical Research Introduction and Methodology
2. Game Technology Landscape and Engine Analysis
3. Game Architecture and Design Patterns
4. Game Implementation Approaches and Best Practices
5. Game Integration Patterns and Online Services
6. Game Performance and Platform Optimization
7. Game Security and Compliance Considerations
8. Strategic Game Technical Recommendations
9. Game Development Roadmap and Risk Assessment
10. Future Game Technology Outlook and Innovation Opportunities
11. Game Technical Research Methodology and Source Documentation
12. Game Technical Appendices and Reference Materials
