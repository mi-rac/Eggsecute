# Code Practice Platform

A multi-language code execution, benchmarking, and learning platform.

## Architecture

- **Frontend**: Nuxt 3 + Nuxt UI + Monaco Editor
- **Control Plane**: Fastify + TypeScript
- **Executors**: Python (FastAPI), Node.js (Fastify), C++
- **Database & Auth**: Supabase
- **i18n**: English and French

## Project Structure

```
/
├── apps/
│   ├── frontend/          # Nuxt 3 web application
│   └── control-plane/     # Fastify orchestration service
├── services/
│   ├── executor-python/   # Python code executor
│   ├── executor-node/     # Node.js/TypeScript executor
│   └── executor-cpp/      # C++ executor
└── packages/
    └── shared-types/      # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.11 (for Python executor)
- C++ compiler (for C++ executor)

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Run all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development

Each workspace has its own README with specific instructions.

## Monorepo Tools

- **pnpm workspaces**: Package management
- **Turborepo**: Task orchestration and caching

