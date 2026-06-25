# ARK VAULT — Technical Specification

> Imperial Obsidian Window | Engine: gbrain (Spine)
> Initialized: 2026-06-14 | Status: ONLINE

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 ARK VAULT (Obsidian)                │
│         C:\Kesarel\MMT_Vault                        │
├─────────────────────────────────────────────────────┤
│  LAYER 1: Human Window (Obsidian UI)               │
│  LAYER 2: gbrain Semantic Spine (PGlite)           │
│  LAYER 3: Intelligence Graph (Linked Knowledge)    │
│  LAYER 4: Agent Zero Integration (Wingman Bridge)  │
└─────────────────────────────────────────────────────┘
```

## 2. Core Nodes

| Node | Purpose | NAICS Alignment |
|------|---------|-----------------|
| `00_Inbox` | Capture zone — raw thoughts, links, voice dumps | — |
| `01_Projects` | Active project tracking (LearnForge, Peta, Tapline, Ark IDE, Agent Permit) | 541511, 541512 |
| `02_Skills` | Sovereign skill registry & capability documentation | 541690 |
| `03_Intelligence_Graph` | Linked knowledge base, research nodes, concept maps | 541690 |
| `04_Federal_Strike` | Government contracting pipeline (NAICS 541690 primary) | 541690 |

## 3. Engine Configuration

- **Semantic Spine**: gbrain with PGlite (local-first vector store)
- **Embedding Model**: Configurable (default: local ONNX model)
- **Sync Protocol**: Git-based with encrypted remote
- **Theme**: Sovereign Obsidian (Luxury DNA)

## 4. DNA Tokens

```css
Primary Background: #0a0a0f (Deep Obsidian)
Accent Cyan:        #00f0ff (Signal / Active)
Accent Purple:      #a855f7 (Structure / Links)
Accent Pink:        #ec4899 (Highlight / Alert)
```

## 5. Integration Points

### 5.1 Agent Zero (Wingman)
- Scheduled briefs delivered to vault inbox
- Research outputs auto-filed to Intelligence Graph
- Sprint tracking synced to 01_Projects

### 5.2 gbrain Spine
- Semantic search across all vault content
- Auto-tagging and relationship discovery
- Vector embeddings for similarity queries

### 5.3 Federal Strike Pipeline
- SAM.gov opportunity tracking
- Capability statement generation
- Past performance documentation
- NAICS 541690 compliance matrix

## 6. Plugins (Recommended)

| Plugin | Purpose |
|--------|---------|
| Dataview | Structured queries across notes |
| Templater | Standardized note templates |
| Graph Analysis | Intelligence graph visualization |
| Tasks | Project tracking with queries |
| Git | Version control & sync |
| Kanban | Visual project boards |

## 7. Security Protocol

- Local-first architecture (no cloud dependency)
- Encrypted sync via private git remote
- Sensitive notes tagged `#classified` with separate backup
- No external API calls without explicit permission

## 8. Operational Status

```
VAULT STATUS: ████████████████████ ONLINE
ENGINE:       gbrain (Spine)     ✓ INITIALIZED
THEME:        Sovereign Obsidian ✓ APPLIED
STRUCTURE:    5/5 Nodes          ✓ CREATED
SYNC:         Ready              ○ AWAITING CONFIG
```

---

*This specification is maintained by Agent Zero (Wingman) and updated on each structural change.*
