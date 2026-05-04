# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **bun-powered Turborepo monorepo** for microservices backend services. Uses Turborepo for build orchestration, bun for package management, SWC for TypeScript transpilation, oxlint/oxfmt for linting and formatting, and TypeScript with strict mode.

## Architecture

```
apps/                          # Microservices (executable applications)
  ├── notification-service/    # Notification service (Hono framework)
  └── user-service/             # User service (Hono framework)
packages/                      # Shared libraries
  ├── env/                     # Zod-based environment validation
  ├── logger/                  # Winston-based logging
  └── typescript-config/       # TypeScript base configs
```

## Common Commands

```bash
# Install dependencies
bun install

# Build all apps and packages
bun run build

# Build single app (auto-builds dependencies first)
bun run build --filter=notification-service

# Develop single app with hot reload
bun run dev --filter=notification-service

# Lint all
bun run lint

# Format all
bun run format

# Type check all (auto-builds packages first)
bun run check-types

# Clean build outputs
bun run clean

# Deep clean (node_modules, .turbo, dist)
bun run clean:deep

# Filter commands work for packages too
bun run check-types --filter=@repo/env
```

## Package Structure

### Apps (Microservices)

Each app in `apps/` requires:
- `src/index.ts` - Main entry point
- `src/config/env.ts` - Environment validation extending `@repo/env`
- `package.json` - Dependencies and scripts
- `tsconfig.json` - Extends `@repo/typescript-config/base.json`
- `.swcrc` - SWC transpiler configuration
- `.env` - Environment variables

Notification service uses Hono framework with CORS and secureHeaders middleware. Exports `{ port, fetch }` for Node.js serve().

### Packages (Shared Libraries)

Each package in `packages/` has:
- `src/` - Source code
- `dist/` - Built output (ESM transpiled + .d.ts)
- `package.json` - Build scripts using SWC
- `tsconfig.json` - Extends base config with `rootDir: "src"`
- `.swcrc` - SWC transpiler configuration

**Important:** Libraries must be built before apps can use them. Turborepo handles this via `dependsOn: ["^build"]` in turbo.json - running any app command automatically builds its dependencies.

## Shared Packages

### @repo/env
Zod-based environment validation. Runtime dependency (zod v4) is centralized in root package.json:
```typescript
import { baseEnvSchema } from '@repo/env'
import { z } from 'zod'

const envSchema = baseEnvSchema.extend({
  SERVICE_NAME: z.literal('notification-service').default('notification-service'),
  JWT_SECRET: z.string().min(32),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid env:', parsed.error.issues)
  process.exit(1)
}
export const env = parsed.data
```

### @repo/logger
Winston-based logging with configurable level, format, and service name:
```typescript
import { logger, createLogger } from '@repo/logger'

// Default logger
logger.info('message')

// Custom instance
const custom = createLogger({
  level: 'debug',
  format: 'pretty',
  service: 'my-service'
})
```

## Dependency Management

- **Shared dependencies** (zod) are in root `package.json` under `dependencies` - bun hoists them to root node_modules
- **App-specific dependencies** are in each app's package.json
- **devDependencies** for tooling (typescript, oxlint, turbo) are in root

## Configuration Notes

- **TypeScript 6.x** with strict mode and `moduleResolution: Bundler`
- **bun** as package manager - use `bun run` for scripts, `bun exec` for one-off commands
- **Turbo** runs tasks in topological order based on dependencies
- **dev task**: `persistent: true` keeps server running; `dependsOn: ["^build"]` auto-builds dependencies first
- **check-types task**: Automatically builds packages before type-checking apps

## Environment Variables

Each app has its own `.env` file. Load with `node --env-file=.env`:
```json
"dev": "node --env-file=.env --watch src/index.ts"
```

Base env schema provides: NODE_ENV, SERVICE_NAME, LOG_LEVEL, LOG_FORMAT, PORT, SHUTDOWN_TIMEOUT
