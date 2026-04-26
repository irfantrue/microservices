import { env } from '@config/env'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', c =>
    c.json({
        status: 'ok',
        service: env.SERVICE_NAME,
        timestamp: new Date().toISOString(),
    }),
)

export { app as router }
