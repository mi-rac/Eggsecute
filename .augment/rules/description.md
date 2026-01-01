---
type: "always_apply"
description: "Project overview and document routing"
---

# Eggsecute

A **distributed multi-language code execution platform** for learning and benchmarking. Users write solutions in multiple languages (TypeScript, Python, C++), run tests in parallel with live updates, and compare performance metrics.

## Architecture (Brief)

| Plane | Tech | Role |
|-------|------|------|
| **Control** | Fastify + TS | Job orchestration, REST API, WebSocket hub |
| **Execution** | FastAPI (Py), Fastify (Node), C++ | Isolated code runners, subprocess sandboxing |
| **Presentation** | Nuxt 3 + Nuxt UI | Editor, live results, i18n |

Communication: REST for jobs, WebSocket for streaming events.

## Document Routing

| Document | When to Fetch |
|----------|---------------|
| `architecture.md` | System design, adding services/executors, protocols, database schema |
| `development.md` | Implementing features, code standards, quality gates, PR prep |

The agent should update these documents when decisions are finalized or requirements change.

## Core Development Mandates

These rules apply to ALL code changes:

1. **Types first** – Start in `shared-types`, then backend, then frontend
2. **Self-review required** – After implementing, run lint/typecheck/test, consolidate duplicates, verify readability
3. **i18n always** – No hardcoded user-facing strings
4. **Fail gracefully** – Loading states, error states, user-friendly messages
