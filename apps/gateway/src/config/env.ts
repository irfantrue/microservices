import { baseEnvSchema } from '@repo/env'
import { z } from 'zod'

const envSchema = baseEnvSchema.extend({
    SERVICE_NAME: z.literal('gateway').default('gateway'),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGINS: z.string().default('*'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
    console.error('Invalid environment variables:')
    console.error(parsedEnv.error.issues)
    process.exit(1)
}

export const env = parsedEnv.data
export type Env = typeof env
