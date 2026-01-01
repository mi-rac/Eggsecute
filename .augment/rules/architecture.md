---
type: "agent_requested"
description: "Refer to `architecture.md` when:  * Discussing system design decisions * Implementing or modifying services * Adding new languages or executors * Working on performance, concurrency, or protocols  ### When to Modify `architecture.md`  The agent **is allowed and encouraged to update `architecture.md`** when:  * New requirements are discovered * Architectural decisions are refined * APIs or protocols are finalized * Tooling or integrations change"
---

# Architecture & Technical Notes

This document is the **living architectural reference** for the multi-language execution and benchmarking platform. It is expected to evolve over time.

---

## 1. System Requirements (Non-Negotiable)

* Execute user-submitted code in **multiple languages**.
* Each language runs in a **fully isolated environment**.
* Support **parallel execution** of test cases.
* Provide **live execution updates** to clients.
* Measure and report:

  * Compile time (where applicable)
  * Execution time
  * Memory usage
* Make it easy to **add new languages** without redesigning the system.

---

## 2. High-Level Architecture

### Planes

**Control Plane**

* **Technology**: Node.js with Fastify + TypeScript
* Owns job lifecycle
* Schedules work to executors
* Aggregates metrics
* Streams events to clients via WebSocket
* Provides REST API for job control
* Shares types with frontend and Node.js executor

**Execution Plane**

* Language-specific executors
* Stateless per job
* Run user code in subprocesses

**Presentation Plane**

* Web client built with **Nuxt 3**
* UI components from **Nuxt UI**
* **Fully internationalized** using `@nuxtjs/i18n`
* All user-facing text must use localized strings (no hardcoded text)
* Submits jobs via REST
* Receives live updates via WebSocket

Executors never talk directly to clients.

---

## 3. Communication Model

### REST (Job Control)

Used for:

* Submitting jobs
* Cancelling jobs
* Fetching job metadata

Example endpoints:

* `POST /jobs`
* `DELETE /jobs/{jobId}`
* `GET /jobs/{jobId}`

### WebSockets (Live Updates)

Used for:

* Test start/finish events
* Partial results
* Compiler output
* Timing and memory metrics

Typical event payload:

```json
{
  "jobId": "abc",
  "event": "test_finished",
  "testIndex": 2,
  "runtimeMs": 14
}
```

---

## 4. Execution Plane Design

Each language executor runs as a **separate service**, typically inside its own Docker container.

### Common Executor Responsibilities

* Accept execution requests from the control plane
* Write user code to a temporary workspace
* Compile (if needed)
* Execute test cases (possibly in parallel)
* Measure time and memory
* Stream progress events back to the control plane
* Clean up all resources after execution

Executors are **stateless** across jobs.

---

## 5. Language-Specific Executors

### Python Executor

* Framework: **FastAPI**
* Uses subprocesses to run user code
* Timing: `time.perf_counter_ns()`
* Memory: `tracemalloc` or `/proc`

### Node.js Executor

* Framework: **Fastify** + TypeScript
* Uses `child_process` to run user code in isolation
* Supports JavaScript and TypeScript
* Shares types with Control Plane via `shared-types` package

### C++ Executor

* Minimal HTTP server (e.g. `cpp-httplib`, `crow`, or `pistache`)
* Compiles user code with fixed flags (e.g. `-O2 -std=c++20`)
* Runs compiled binaries as subprocesses
* Measures memory via `/usr/bin/time -v`

User code must **never** run in the HTTP server process itself.

---

## 6. Problem & Execution Model

Each problem defines:

* Function name / entry point
* Input & output schema
* Test cases

Executors adapt the problem definition to their language via a harness layer.

Results include:

* Per-test outcome
* Aggregate metrics
* Raw timing data

---

## 7. Parallelism & Scheduling

* Test cases may run in parallel **within a job**, up to a configurable limit.
* Executors must enforce CPU/memory limits per job.
* Control plane limits concurrent jobs per executor.

Warm-up runs and multiple iterations should be supported for fair benchmarking.

---

## 8. Extensibility Rules

To add a new language:

* Create a new executor service
* Implement the same REST/WebSocket contract
* Provide a harness that adapts the problem schema

No changes should be required in the client.

---

## 9. Frontend Architecture

### Technology Stack

* **Framework**: Nuxt 3
* **UI Library**: Nuxt UI (built on Tailwind CSS and Headless UI)
* **Internationalization**: `@nuxtjs/i18n`
* **Code Editor**: Monaco Editor (`@guolao/vue-monaco-editor`)
* **Authentication & Database**: Supabase

### Project Structure

* **Monorepo** managed with:
  * **pnpm workspaces** - fast, efficient package management
  * **Turborepo** - task orchestration, caching, parallel execution

* **Directory structure**:
  ```
  /
  ├── apps/
  │   ├── frontend/          (Nuxt 3 + TypeScript)
  │   └── control-plane/     (Fastify + TypeScript)
  ├── services/
  │   ├── executor-python/   (FastAPI)
  │   ├── executor-node/     (Fastify + TypeScript)
  │   └── executor-cpp/      (C++ HTTP server)
  └── packages/
      └── shared-types/      (TypeScript types/schemas)
  ```

* **Type sharing**: TypeScript types defined once in `packages/shared-types`, used across:
  * Frontend (Nuxt)
  * Control Plane
  * Node.js executor

### i18n Requirements

* **All user-facing text must be localized** - no hardcoded strings in components
* **Supported languages**: English (en), French (fr)
* Locale files organized by feature/domain
* Dynamic locale switching without page reload
* Default locale: English

### Authentication & Data

* **Supabase** for:
  * User authentication (email/password, OAuth providers)
  * PostgreSQL database
  * Real-time subscriptions (optional, complementary to WebSocket)
  * Row-level security (RLS) policies
* Store user data:
  * User profiles
  * Saved solutions
  * Execution history
  * Performance benchmarks
* Problem definitions stored in database

### Frontend Responsibilities

* Code editor interface (Monaco) for writing solutions
* Language selector (JavaScript/TypeScript, Python, C++)
* Test case visualization
* Real-time execution progress display
* Performance metrics comparison (compile time, execution time, memory)
* WebSocket connection management for live updates
* User authentication flows
* Solution persistence and history

### State Management

* Use Nuxt 3's built-in composables and state management
* Supabase client state (auth, user session)
* WebSocket connection state
* Job execution state
* User preferences (language, theme, locale)

---

## 10. Terminal Output Streaming

### Architecture
Executors capture subprocess stdout/stderr and stream them to the frontend via WebSocket.

### Event Flow
```
Executor subprocess → stdout/stderr capture → WebSocket event → Control Plane → Frontend
```

### Event Type
```typescript
interface TerminalOutputEvent extends WebSocketEvent {
  event: 'terminal_output';
  data: {
    stream: 'stdout' | 'stderr';
    chunk: string;
    timestamp: Date;
  };
}
```

### Implementation Notes
- Use non-blocking I/O to capture subprocess output
- Buffer small chunks (e.g., 100ms) to reduce WebSocket message frequency
- Frontend should handle ANSI escape codes (strip or render)
- Terminal output is ephemeral (not persisted to database)

---

## 11. Database Schema (Supabase)

### Core Tables

**exercises**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| title | text | Required |
| description | text | Markdown |
| function_name | text | Entry point |
| difficulty | enum | easy, medium, hard |
| category | text | Optional grouping |
| tags | text[] | Searchable tags |
| input_schema | jsonb | JSON Schema |
| output_schema | jsonb | JSON Schema |
| test_cases | jsonb | Array of test cases |
| images | text[] | Supabase Storage URLs |
| hints | jsonb | Array of hint objects |
| author_id | uuid | FK to auth.users |
| is_published | boolean | Visibility |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

**user_solutions**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| exercise_id | uuid | FK to exercises |
| language | text | typescript, python, cpp |
| code | text | User's solution |
| is_submitted | boolean | Draft vs submitted |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

**execution_history**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| exercise_id | uuid | FK to exercises |
| solution_id | uuid | FK to user_solutions |
| language | text | |
| status | text | success, partial, failed |
| metrics | jsonb | Timing, memory |
| test_results | jsonb | Per-test outcomes |
| created_at | timestamptz | Auto |

### Row Level Security (RLS)
- `exercises`: Public read if `is_published = true`, write restricted to author
- `user_solutions`: Users can only read/write their own
- `execution_history`: Users can only read their own

### Type Generation
```bash
supabase gen types typescript --project-id <id> > packages/shared-types/src/database.ts
```

---

## 12. LLM Integration (OpenAI)

### Architecture
LLM functionality is provided as a module within the Control Plane, not a separate service.

### Capabilities
1. **Hints** - Progressive hints for stuck users
2. **Code Review** - Feedback on submitted solutions
3. **Exercise Generation** - Create exercises from learning goals

### API Design
```
POST /api/llm/hint
POST /api/llm/review
POST /api/llm/generate-exercise
```

### Security
- Requires authentication
- Rate limited: 10 requests/minute per user
- API key stored in environment variable `OPENAI_API_KEY`
- No user code sent to LLM without explicit consent

### Prompt Management
Prompts stored in `apps/control-plane/src/prompts/`:
```
prompts/
  hint.ts          # Progressive hint generation
  review.ts        # Code review feedback
  exercise.ts      # Exercise generation
```

### Streaming
Use Server-Sent Events (SSE) for streaming responses:
```typescript
// Frontend
const eventSource = new EventSource('/api/llm/hint?exerciseId=...');
eventSource.onmessage = (e) => appendToUI(e.data);
```

---

## 13. Evolution Guidelines

This document should be updated when:

* APIs are finalized or changed
* New executors are added
* Benchmarking methodology evolves
* Security or sandboxing decisions are refined
* Frontend architecture or tooling changes
* Database schema changes
* New integrations are added

Avoid storing purely cosmetic details here.
