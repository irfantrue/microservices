import { env } from '@config/env'
import { logger } from '@shared/logger'

import { HandlebarsAdapter } from './infrastructure/mailer/handlebars.adapter'
import { NodemailerAdapter } from './infrastructure/mailer/nodemailer.adapter'
import { router } from './router'
import { SendEmailUseCase } from './use-cases/send-email.use-case'

const log = logger.child({ module: 'Bootstrap' })

async function bootstrap() {
    // Build depencies
    const mailer = new NodemailerAdapter()
    const template = new HandlebarsAdapter()

    // Verify SMTP connection on startup

    // Wire use case
    const sendEmailUseCase = new SendEmailUseCase({ mailer, template })

    // Start RabbitMQ consumer

    log.info(`Notification service running on http://localhost:${env.PORT}`)

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        log.info('shutting down...', { signal })
        process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    return { port: env.PORT, fetch: router.fetch }
}

export default await bootstrap()
