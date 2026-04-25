import { env } from '@config/env'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()

// -- Global Middleware --
app.use('*', secureHeaders())

app.use(
    '*',
    cors({
        origin: env.CORS_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
        exposeHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
        credentials: true,
    }),
)

// -- Health Check --
app.get('/health', c =>
    c.json({
        status: 'ok',
        service: env.SERVICE_NAME,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    }),
)

app.get('/', async c => c.json({ message: 'Hello' }))

export default { port: env.PORT, fetch: app.fetch }
