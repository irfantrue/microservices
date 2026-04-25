# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Bun-powered Turborepo monorepo** for microservices backend services. Uses Turborepo for build orchestration, Bun for package management and runtime, oxlint/oxfmt for linting and formatting, and TypeScript with strict mode.

## Architecture

```
apps/               # Microservices (executable applications)
  └── gateway/      # API Gateway service (Hono)
packages/           # Shared libraries
  ├── env/          # Zod-based environment validation
  ├── logger/      # Winston-based logging
  ├── eslint-config/
  └── typescript-config/
```

## Common Commands

```bash
# Install dependencies
bun install

# Build all apps and packages
bun run build

# Develop all apps (runs on ports defined in each app)
bun run dev

# Run a single app
bun run dev --filter=gateway

# Lint all
bun run lint

# Format all
bun run format

# Type check all
bun run check-types

# Clean build outputs
bun run clean

# Deep clean (including node_modules, .turbo, dist)
bun run clean:deep
```

## Package Structure

### Apps (Microservices)

Each app in `apps/` follows this pattern:
- `src/index.ts` - Main entry point
- `src/config/env.ts` - Environment validation extending `@repo/env`
- `package.json` - Dependencies and scripts
- `tsconfig.json` - Extends `@repo/typescript-config/base.json`
- `.env` - Environment variables

### Packages (Shared Libraries)

Each package in `packages/` follows this pattern:
- `src/` - Source code
- `dist/` - Built output (ESM + .d.ts)
- `package.json` - With build scripts using Bun
- `tsconfig.json` - Extends base config with `rootDir: "src"`

Libraries must be built before apps can use them - Turborepo handles this via `dependsOn: ["^build"]` in turbo.json.

## Shared Packages

### @repo/env
Environment variable validation using Zod. Import and extend:
```typescript
import { baseEnvSchema } from '@repo/env'
const envSchema = baseEnvSchema.extend({
  SERVICE_NAME: z.literal('gateway').default('gateway'),
  JWT_SECRET: z.string().min(32),
})
const env = envSchema.parse(process.env)
```

### @repo/logger
Winston-based logger. Import and configure:
```typescript
import { logger, createLogger } from '@repo/logger'
logger.info('message')
const custom = createLogger({ level: 'debug', service: 'my-service' })
```

## Configuration Notes

- **TypeScript 6.x** with strict mode and `moduleResolution: Bundler`
- **Bun** as package manager - use `bun run` not `bunx` for local scripts
- **Turbo** runs tasks in topological order based on dependencies
- **dev task**: `persistent: true` keeps server running, auto-builds dependencies first
- **check-types task**: Automatically builds packages before type-checking apps

## Environment Variables

Each app has its own `.env` file. Load with `bun --dotenv=.env`:
```json
"dev": "bun --dotenv=.env --hot src/index.ts"
```
