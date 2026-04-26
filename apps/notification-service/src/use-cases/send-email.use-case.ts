import type { SendEmailJobDto } from '@domain/dtos/send-email.dto'
import type { IMailer } from '@domain/interface/IMailer'
import type { INotificationRepository } from '@domain/interface/INotificationRepository'
import type { ITemplateEngine } from '@domain/interface/ITemplateEngine'

import { logger } from '@shared/logger'
import { uuidv7 } from 'zod'

interface Deps {
    mailer: IMailer
    repo: INotificationRepository
    template: ITemplateEngine
}

const log = logger.child({ module: 'SendEmailUseCase' })

export class SendEmailUseCase {
    constructor(private readonly deps: Deps) {}

    async execute(dto: SendEmailJobDto): Promise<void> {
        const { template } = this.deps
        const id = uuidv7()

        try {
            // Compile template -> html -> extract subject
            const html = await template.compile(dto.slug, dto.vars)
            const subject = dto.vars['subject'] ?? dto.templateSlug

            // Send email
            log.info('email sent', {
                id,
                to: dto.to,
                templateSlug: dto.templateSlug,
            })
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            log.error('email failed', { id, to: dto.to, err })
            throw err
        }
    }
}
