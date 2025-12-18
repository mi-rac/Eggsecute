# @code-practice/shared-types

Shared TypeScript types and interfaces used across the Code Practice Platform.

## Usage

This package is used by:
- Frontend (Nuxt app)
- Control Plane (Fastify service)
- Node.js Executor

## Types Included

- **Language & Problem Types**: `SupportedLanguage`, `Problem`, `TestCase`
- **Job Types**: `Job`, `JobSubmission`
- **Execution Results**: `TestResult`, `ExecutionResult`, `ExecutionMetrics`
- **WebSocket Events**: All event types for real-time updates
- **Executor API**: Request/response types for executor communication

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev
```

## Adding New Types

1. Add types to `src/index.ts`
2. Run `pnpm build` to compile
3. Types will be automatically available to dependent packages

