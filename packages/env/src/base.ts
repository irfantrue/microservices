import z from 'zod'

export const baseEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    SERVICE_NAME: z.string().min(1),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
    PORT: z.coerce.number().default(3000),
    SHUTDOWN_TIMEOUT: z.coerce.number().default(30_000),
})

export type BaseEnv = z.infer<typeof baseEnvSchema>
