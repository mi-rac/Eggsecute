---
type: "agent_requested"
description: "Fetch when implementing features, modifying code, preparing PRs, or reviewing code quality"
---

# Development Rules

This document defines the development process, coding standards, and quality gates for the Eggsecute platform.

---

## 1. Feature Implementation Workflow

### Before Starting
- [ ] Understand the feature's impact on all three planes (Control, Execution, Presentation)
- [ ] Identify shared-types changes needed FIRST
- [ ] Check for similar patterns in the codebase to maintain consistency

### During Implementation
- [ ] Start with type definitions in `shared-types`
- [ ] Implement backend changes before frontend
- [ ] Use existing composables/utilities before creating new ones
- [ ] All user-facing strings use i18n (`$t()` or `t()`)

### After Implementation (MANDATORY Self-Review)
The agent MUST perform a self-review refactoring pass before marking work complete:

1. **Run quality checks**
   ```bash
   pnpm lint        # Must pass with no errors
   pnpm typecheck   # Must pass with no errors
   pnpm test        # Affected tests must pass
   ```

2. **Code consolidation check**
   - Search codebase for duplicate logic that should be extracted
   - Move shared logic to: `shared-types` (types), `composables/` (frontend), `lib/` (backend)
   - Identify functions >40 lines that should be split

3. **Readability pass**
   - Rename unclear variables (prefer `exerciseId` over `id`, `isLoading` over `loading`)
   - Add JSDoc/docstrings to exported functions
   - Simplify nested conditionals (max 3 levels, use early returns)

4. **Type safety verification**
   - No `any` types without explicit justification comment
   - API boundaries have Zod validation
   - Database queries use generated types

---

## 2. Coding Standards

### TypeScript/JavaScript
- Strict mode enabled (`strict: true`)
- Prefer `const` over `let`, never use `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Async/await over raw promises
- Named exports over default exports (except Vue components)

### Python (Executors)
- Follow PEP 8, enforced by ruff
- Type hints required for all function signatures
- Pydantic models for API contracts
- Use `async def` for I/O-bound operations

### Vue/Nuxt (Frontend)
- `<script setup lang="ts">` syntax required
- Composables for reusable stateful logic
- Props must be typed with `defineProps<T>()`
- Emits must be typed with `defineEmits<T>()`

### Naming Conventions
| Context | Convention | Example |
|---------|------------|---------|
| TypeScript variables/functions | camelCase | `getUserById` |
| TypeScript types/interfaces | PascalCase | `ExecutionResult` |
| Python variables/functions | snake_case | `get_user_by_id` |
| Python classes | PascalCase | `ExecutionResult` |
| Database tables | snake_case | `user_solutions` |
| API endpoints | kebab-case | `/api/exercises/:id` |
| Vue components | PascalCase | `ExerciseCard.vue` |
| Composables | camelCase with `use` prefix | `useExecutionSocket` |

---

## 3. Quality Gates by Domain

### Shared Types (`packages/shared-types`)
- [ ] All API request/response types defined here
- [ ] WebSocket event types defined here
- [ ] Database entity types generated from Supabase schema
- [ ] Zod schemas co-located with types for runtime validation
- [ ] JSDoc comments on all exported types

### Frontend (`apps/frontend`)
- [ ] No hardcoded user-facing strings (use i18n)
- [ ] Loading states for all async operations
- [ ] Error states with user-friendly messages
- [ ] Responsive design (mobile-first)
- [ ] Accessibility: proper ARIA labels, keyboard navigation

### Control Plane (`apps/control-plane`)
- [ ] All routes have request validation (Zod + Fastify)
- [ ] Consistent error response format: `{ error: string, code?: string }`
- [ ] Database access through repository pattern
- [ ] Auth middleware on protected routes
- [ ] Rate limiting on public endpoints

### Executors (`services/executor-*`)
- [ ] Subprocess isolation for user code
- [ ] Resource limits enforced (CPU, memory, time)
- [ ] Stdout/stderr captured and streamed
- [ ] Cleanup of temporary files after execution
- [ ] Health check endpoint (`GET /health`)

---

## 4. Database Conventions (Supabase)

### Schema Design
- Primary keys: `id` (UUID, auto-generated)
- Timestamps: `created_at`, `updated_at` (auto-managed)
- Foreign keys: `{table}_id` (e.g., `user_id`, `exercise_id`)
- Soft deletes: `deleted_at` (nullable timestamp)

### Type Generation
After schema changes, regenerate types:
```bash
supabase gen types typescript --project-id <id> > packages/shared-types/src/database.ts
```

### Repository Pattern
All database access goes through repositories in `apps/control-plane/src/repositories/`:
```typescript
// Good
const exercise = await exerciseRepository.findById(id);

// Bad - raw client access in routes
const { data } = await supabase.from('exercises').select().eq('id', id);
```

---

## 5. WebSocket Event Contract

All WebSocket events MUST be typed in `shared-types`. When adding new events:

1. Add event type to `WebSocketEventType` union
2. Create typed event interface extending `WebSocketEvent`
3. Update executor to emit the event
4. Update frontend composable to handle the event

Example for terminal output:
```typescript
export interface TerminalOutputEvent extends WebSocketEvent {
  event: 'terminal_output';
  data: {
    stream: 'stdout' | 'stderr';
    chunk: string;
  };
}
```

---

## 6. Testing Requirements

### What Must Be Tested
- Utility functions: unit tests (Vitest/Pytest)
- API endpoints: integration tests
- WebSocket handlers: connection and event tests
- Critical user flows: E2E tests (Playwright)

### Test File Location
- Unit tests: co-located with source (`*.test.ts`, `*_test.py`)
- E2E tests: `apps/frontend/e2e/`

### Minimum Coverage
- Shared types validators: 100%
- Repository methods: 80%
- API routes: 80%
- Composables: 70%

---

## 7. Feature-Specific Quality Gates

### Terminal Output Streaming
- [ ] `terminal_output` event in shared-types
- [ ] Executor streams stdout/stderr in real-time (not buffered)
- [ ] Frontend shows terminal tab in results panel
- [ ] ANSI escape codes handled (strip or render colors)

### Exercise Management (CRUD)
- [ ] Exercise schema in database with all fields
- [ ] Markdown editor for description
- [ ] Image upload to Supabase Storage
- [ ] Test case builder with validation
- [ ] Preview mode matches exercise display page

### User Solutions Persistence
- [ ] Solution saved to database on authenticated submit
- [ ] localStorage as offline cache
- [ ] Auto-save with debounce (2s after typing stops)
- [ ] Conflict detection if solution changed elsewhere

### LLM Integration (OpenAI)
- [ ] API key stored securely (env var, not in code)
- [ ] Rate limiting per user
- [ ] Streaming responses to frontend
- [ ] Prompt templates in separate files (not inline)
- [ ] Graceful fallback when API unavailable

---

## 8. Refactoring Triggers

The agent SHOULD proactively refactor when:

| Trigger | Action |
|---------|--------|
| Same code in 2+ places | Extract to utility/composable |
| Function >40 lines | Split into smaller functions |
| Component >200 lines | Split into sub-components |
| Type used in 2+ services | Move to shared-types |
| Magic numbers/strings | Extract to constants |
| Deeply nested callbacks | Convert to async/await |
| Complex conditional | Extract to named function |

---

## 9. PR Readiness Checklist

Before creating a PR, verify:

### Code Quality
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] No `console.log` left in code (use proper logging)
- [ ] No commented-out code
- [ ] No TODO comments without linked issue

### Testing
- [ ] New code has tests
- [ ] Existing tests still pass
- [ ] Manual testing completed for UI changes

### Documentation
- [ ] Breaking API changes documented
- [ ] Complex logic has comments
- [ ] `architecture.md` updated if architectural changes

### Security
- [ ] No secrets in code
- [ ] User input validated
- [ ] SQL injection prevented (parameterized queries)
- [ ] Auth checked on protected endpoints

---

## 10. Error Handling Patterns

### Backend (Fastify)
```typescript
// Define error types
class NotFoundError extends Error {
  statusCode = 404;
}

// Throw typed errors
if (!exercise) throw new NotFoundError('Exercise not found');

// Global error handler formats response
{ error: 'Exercise not found', code: 'NOT_FOUND' }
```

### Frontend (Vue)
```typescript
// Always show user-friendly errors
try {
  await submitCode();
} catch (err) {
  toast.error(t('errors.submitFailed'));
  console.error('Submit failed:', err); // Log for debugging
}
```

### Executors (Python)
```python
# Catch and wrap execution errors
try:
    result = run_user_code(code)
except TimeoutError:
    return ExecutorResponse(success=False, error="Execution timed out")
except MemoryError:
    return ExecutorResponse(success=False, error="Memory limit exceeded")
```

