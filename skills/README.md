# 🏛️ ArkOn Skill Registry

> *"A sovereign architect doesn't repeat themselves — they encode their standards into reusable protocols that any digital employee can load and execute."*

---

## What Is This?

The ArkOn Skill Registry is a structured library of **modular intelligence** — encoded protocols, standards, templates, and checklists that any AI agent in the ArkOn ecosystem can discover, load, and apply.

Each `.skill` file is a self-contained knowledge module that transforms generic AI capabilities into **domain-specific expertise**.

---

## 📁 Registry Structure

```
/skills/
├── SKILLS_MANIFEST.json      # Discovery index for agent lookup
├── README.md                 # This file — the Skill Loading Ritual
├── visual/
│   └── luxury-obsidian.skill # Sovereign UI design system
├── business/
│   └── hormozi-gtm.skill    # High-ticket positioning & copy
└── seo/
    └── agentic-seo.skill    # AI-first SEO & structured data
```

---

## 🔮 The Skill Loading Ritual

### For AI Agents (Automated Discovery)

1. **Read the Manifest**
   ```
   Parse /skills/SKILLS_MANIFEST.json
   ```

2. **Match Task to Skill**
   ```
   Compare current task domain against each skill's:
   - "domain" field
   - "use_when" triggers
   - "tags" array
   ```

3. **Load Relevant Skills**
   ```
   Read the full .skill file contents into working context
   ```

4. **Apply Standards**
   ```
   Follow the checklists, use the templates, respect the anti-patterns
   ```

5. **Cite the Skill**
   ```
   When delivering work, note which skills were loaded:
   "Applied: luxury-obsidian v1.0.0, hormozi-gtm v1.0.0"
   ```

### For Human Operators

1. Browse the manifest to see available skills
2. Copy relevant sections into your AI tool's context
3. Reference specific templates or checklists as needed
4. Contribute new skills following the `.skill` format

---

## 📐 Skill File Format

Every `.skill` file follows this structure:

```yaml
---
name: skill-name
version: X.Y.Z
domain: category
description: One-line purpose statement
author: Creator name
tags: [tag1, tag2, tag3]
---

# Skill Title

## Purpose
Why this skill exists.

## Core Content
Templates, tokens, frameworks, checklists.

## Anti-Patterns
What to never do.

## Integration Notes
How to apply this skill in context.
```

---

## 🏗️ Available Skills

| Skill | Domain | Purpose |
|-------|--------|---------|
| `luxury-obsidian` | Visual Design | Premium dark-mode UI tokens, components, and quality gates |
| `hormozi-gtm` | Business Strategy | Value Ladder, Outcome-First copy, pricing & qualification |
| `agentic-seo` | SEO Automation | JSON-LD templates, machine readability, MedSpa audit workflow |

---

## 🚀 Adding New Skills

1. Create a new `.skill` file in the appropriate subdirectory
2. Follow the YAML frontmatter format above
3. Update `SKILLS_MANIFEST.json` with the new entry
4. Commit with message: `skill: add [skill-name] v[version]`

### Suggested Future Skills
- `content-distribution.skill` — 7 AI-era distribution strategies
- `agent-orchestration.skill` — Multi-agent workflow patterns
- `client-onboarding.skill` — Sovereign onboarding automation
- `financial-modeling.skill` — Revenue projection templates
- `brand-voice.skill` — Tone, vocabulary, and communication standards

---

## 📜 Philosophy

> Skills are the bridge between **prompting** and **orchestrating**.
>
> A prompt is a one-time instruction. A skill is a **permanent capability**.
>
> When you encode your expertise into skills, every AI agent you deploy
> inherits your standards, your taste, and your strategic frameworks —
> without you repeating yourself.
>
> This is how one architect commands a digital workforce.

---

*Registry initialized: 2026-06-13 | Version: 1.0.0 | Maintained by: ArkOn Architect*
