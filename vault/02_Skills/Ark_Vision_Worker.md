---
id: ark-vision-worker
domain: visual-extraction
engine: Zamba2-VL (1.2B / 2.7B)
version: 1.0.0
status: active
created: 2026-06-14
tags: [vision, extraction, mamba2, zamba2-vl, proofai, schemaforge, ark-memory]
---

# Ark Vision Worker

## Purpose
High-speed, low-latency visual extraction layer serving as the **Eyes** of the ArkOn digital workforce. Extracts structured data from images, documents, screenshots, and video frames for downstream processing by ProofAI, SchemaForge, and Ark Memory.

## Engine: Zamba2-VL

### Architecture Benefits (Mamba2 + Transformer Hybrid)

| Component | Role | Advantage |
|-----------|------|-----------|
| **Mamba2 SSM Blocks** | Sequential context processing | O(n) linear complexity — handles long documents without quadratic attention cost |
| **Shared Transformer Attention** | Cross-modal reasoning injection | Enables visual-language grounding at critical layers without full transformer overhead |
| **LoRA Adapters** | Domain fine-tuning | Rapid adaptation to new document types (< 1hr fine-tune on 500 samples) |
| **Hybrid Design** | Combined throughput | 3x inference speed vs pure-transformer VLMs at equivalent extraction quality |

### Why Mamba2 for Vision Extraction
1. **Linear scaling** — Process 100-page documents without memory explosion
2. **State compression** — Maintains document context across pages via learned state transitions
3. **Selective attention** — Transformer blocks fire only where cross-modal reasoning is needed
4. **Batch efficiency** — Process 32 pages concurrently within 3s latency budget

## Output Schema
Produces structured JSON with:
- **Entities**: Typed extractions (text, numbers, dates, currencies, names, addresses, signatures, etc.)
- **Confidence Scores**: Per-entity float (0.0–1.0) for downstream filtering
- **Spatial Coordinates**: Normalized bounding boxes with page references
- **Reasoning Handoff**: Auto-escalation to Claude/MiniMax when confidence drops below threshold

## Integration Map
```
┌─────────────────┐
│  Ark Vision     │
│  Worker         │
│  (Zamba2-VL)    │
└───────┬─────────┘
        │ Structured JSON
        ├──────────────────► ProofAI (Evidence Nodes)
        ├──────────────────► SchemaForge (Auto-Schema)
        └──────────────────► Ark Memory (Indexed Content)
```

## Operational Specs
- **Latency target**: < 200ms/page (single GPU)
- **Batch capacity**: 32 pages / < 3s
- **Auto-escalation**: confidence < 0.7 → reasoning layer
- **Template pre-fill**: 80%+ hit rate on recurring document types
- **Model refresh**: Bi-weekly LoRA fine-tune on correction feedback

## Skill File Location
`/skills/visual/ark-vision-worker.skill`

## Related Skills
- [[Luxury Obsidian Design Protocol]] — UI layer for extraction results
- [[Agentic SEO Protocol]] — Structured data from extracted content

---
*Registered: 2026-06-14 | Registry: ArkOn Sovereign Skill Registry*
