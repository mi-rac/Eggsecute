# Control Plane

The Control Plane is the orchestration service for the Eggsecute platform. It manages job lifecycle, schedules work to executors, aggregates metrics, and streams events to clients.

## Features

- **Job Management**: REST API for submitting, canceling, and querying jobs
- **Live Updates**: WebSocket support for real-time execution events
- **Supabase Integration**: Database and authentication via Supabase
- **Type Safety**: Shared TypeScript types across the platform

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: Supabase (PostgreSQL)
- **WebSocket**: @fastify/websocket

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# From the repository root
pnpm install
```

### Configuration

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)

### Development

```bash
# Run in development mode with hot reload
pnpm dev
```

### Build

```bash
# Build for production
pnpm build

# Run production build
pnpm start
```

## Supabase Client

The control plane includes a Supabase client module (`src/lib/supabase.ts`) that provides:

### Admin Client
```typescript
import { supabaseAdmin } from './lib/supabase.js';

// Use for server-side operations that bypass RLS
const { data, error } = await supabaseAdmin
  .from('jobs')
  .select('*');
```

### User Client
```typescript
import { supabaseClient } from './lib/supabase.js';

// Use for operations that respect RLS policies
const { data, error } = await supabaseClient
  .from('jobs')
  .select('*');
```

### User-Scoped Client
```typescript
import { createUserClient } from './lib/supabase.js';

// Create a client for a specific user
const userClient = createUserClient(userAccessToken);
```

### Token Verification
```typescript
import { verifyUserToken } from './lib/supabase.js';

// Verify a JWT token and get user info
const user = await verifyUserToken(accessToken);
```

## API Endpoints

### Health Check
```
GET /health
```

### Supabase Connection Test
```
GET /api/supabase/test
```

## Architecture

The Control Plane is responsible for:

1. **Job Orchestration**: Managing the lifecycle of code execution jobs
2. **Executor Communication**: Scheduling work to language-specific executors
3. **Metrics Aggregation**: Collecting and aggregating performance metrics
4. **Client Communication**: Streaming live updates via WebSocket
5. **Data Persistence**: Storing jobs, results, and user data in Supabase

See `../../.augment/rules/architecture.md` for detailed system architecture.

