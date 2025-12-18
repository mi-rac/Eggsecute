---
type: "always_apply"
description: "Example description"
---

# Project Overview (High-Level)

This project is a **multi-language code execution, benchmarking, and learning platform** inspired by tools like CodeSignal or LeetCode, but designed primarily as a **systems-learning and performance-comparison tool**.

The core goal is to allow a user to:

* Write and run solutions to programming problems in **multiple languages** (initially JavaScript/TypeScript, Python, and C++).
* Execute the *same logical solution* across different runtimes.
* Run test suites **in parallel** with **live progress updates**.
* Compare **compile time, execution time, and memory usage** fairly across languages.

The system is intentionally designed as a **distributed execution platform** rather than a monolithic backend, in order to teach and exercise:

* Systems design
* Process isolation & sandboxing
* Performance profiling
* Cross-language execution semantics

---

## Core Architectural Idea

The system is split into three conceptual layers:

1. **Control Plane** – orchestrates jobs, scheduling, aggregation, and client communication.
2. **Execution Plane** – isolated language-specific executors (Python, Node.js, C++), each running user code in sandboxed subprocesses.
3. **Presentation Plane** – a client (web or IDE) that submits jobs and receives live updates.

Communication uses:

* **REST** for job control (submit, cancel, metadata)
* **WebSockets** for streaming execution events and live test results

---

## How to Use This Document

This file (`description.md`) is **always included in context** when interacting with an agentic assistant.

It should:

* Stay **brief and stable**
* Capture the *intent* and *shape* of the project
* Avoid low-level details that may change frequently

### When to Refer to `architecture.md`

Refer to `architecture.md` when:

* Discussing system design decisions
* Implementing or modifying services
* Adding new languages or executors
* Working on performance, concurrency, or protocols

### When to Modify `architecture.md`

The agent **is allowed and encouraged to update `architecture.md`** when:

* New requirements are discovered
* Architectural decisions are refined
* APIs or protocols are finalized
* Tooling or integrations change

Do **not** duplicate large sections of `architecture.md` into this file. Instead, evolve `architecture.md` as the living technical reference.
