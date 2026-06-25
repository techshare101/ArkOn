# Ark OS V2.0 Cabinet — Index

11-agent swarm mirrored at `/agents/` in the `techshare101/ArkOn` repo. Each file is one identity, single-purpose, with explicit domain, tools, skills, owns, guardrails, and eval criteria.

> **Naming note:** **Arkon** (lowercase 'k') = the cabinet CFO role. **ArkOn** (capital O) = the workflow-engine product on disk (the `techshare101/ArkOn` repo). Two distinct identities — do not conflate.

| # | Identity | Role | Abbrev | File |
|---|----------|------|--------|------|
|||||
|---|---|---|---|---|---|
| 1 | **Athena** | Chief Operating Agent | COO | [`athena.md`](./athena.md) |
| 2 | **Arkon** | Chief Financial Officer | CFO | [`arkon.md`](./arkon.md) |
| 3 | **Solomon** | Chief Architecture Officer | CAO | [`solomon.md`](./solomon.md) |
| 4 | **Melchior** | Chief Growth Officer | CGO | [`melchior.md`](./melchior.md) |
| 5 | **Apollo** | Sales Coach Agent | — | [`apollo.md`](./apollo.md) |
| 6 | **Aurora** | Customer Success Agent | — | [`aurora.md`](./aurora.md) |
| 7 | **Argus** | Market Surveillance Agent | — | [`argus.md`](./argus.md) |
| 8 | **Sophia** | Knowledge / RAG Librarian | — | [`sophia.md`](./sophia.md) |
| 9 | **Guardian** | Risk & Compliance Agent | — | [`guardian.md`](./guardian.md) |
| 10 | **Balthazar** | Forge Master (Engineering) | — | [`balthazar.md`](./balthazar.md) |
| 11 | **Automata** | Creative Director (Media) | — | [`automata.md`](./automata.md) |

## Composition by function

- **C-Suite (4):** Athena (COO), Arkon (CFO), Solomon (CAO), Melchior (CGO)
- **Customer-facing (3):** Apollo (sales), Aurora (CS), Automata (creative)
- **Intelligence & knowledge (2):** Argus (market intel), Sophia (RAG librarian)
- **Engineering & compliance (2):** Balthazar (eng), Guardian (compliance)

## Cabinet rules

1. **Single-purpose.** Each identity owns exactly one domain. Cross-domain work goes through Athena (COO).
2. **No autonomous money-movement.** Only Arkon (CFO) can write to Stripe, and only with explicit Operator approval.
3. **No autonomous destructive ops.** Balthazar never pushes to main; branches off dev, PR per doctrine.
4. **Guardian has veto power** on any ship touching PHI/PII. Cannot be overridden except by Operator + 2-of-3 cabinet vote.
5. **Every cabinet member logs cross-agent handoffs** to memory (with target identity, intent, payload summary).

## How to add an agent

Do not. The cabinet is fixed at 11 for V2.0. New work goes through Athena (COO) for routing, or through Solomon (CAO) for architecture review before any expansion.

If you believe an 11-agent cabinet is insufficient: that's a Solomon (architecture) proposal, not a unilateral add.
