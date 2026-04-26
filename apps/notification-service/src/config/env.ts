import { baseEnvSchema } from '@repo/env'
import { z } from 'zod'

const envSchema = baseEnvSchema.extend({
    SERVICE_NAME: z.literal('notification-service').default('notification-service'),

    // Nodemailer
    SMTP_HOST: z.string().min(1),
    SMTP_FROM: z.string().min(1),
    SMTP_PORT: z.coerce.number(),
    SMTP_SECURE: z.coerce.number(),
    SMTP_AUTH_USER: z.string().min(1),
    SMTP_AUTH_PASS: z.string().min(1),
})

const parsedEnv = envSchema.safeParse(Bun.env)

if (!parsedEnv.success) {
    console.error('Invalid environment variables:')
    console.error(parsedEnv.error.issues)
    process.exit(1)
}

export const env = parsedEnv.data
export type Env = typeof env
