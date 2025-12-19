# Eggsecute

A multi-language code execution, benchmarking, and learning platform.

See [architecture.md](.augment/rules/architecture.md) for detailed system design.

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.11 (for Python executor)
- C++ compiler (for C++ executor)

## Quick Start

```bash
# Install dependencies
pnpm install

# Build shared types (required first time)
pnpm --filter @code-practice/shared-types build

# Run all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Workspaces

| Workspace | Status | Description |
|-----------|--------|-------------|
| `apps/frontend` | ✅ Ready | Nuxt 3 web application |
| `apps/control-plane` | ✅ Ready | Fastify orchestration service |
| `packages/shared-types` | ✅ Ready | Shared TypeScript types |
| `services/executor-*` | 🚧 Planned | Language-specific executors |
