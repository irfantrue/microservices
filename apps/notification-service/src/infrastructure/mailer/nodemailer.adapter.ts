import type { IMailer, MailOptions } from '@domain/interface/IMailer'

import { env } from '@config/env'
import nodemailer, { type Transporter } from 'nodemailer'

export class NodemailerAdapter implements IMailer {
    private readonly transporter: Transporter

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE == 465,
            auth: { user: env.SMTP_AUTH_USER, pass: env.SMTP_AUTH_PASS },
        })
    }

    async verifyConnection(): Promise<void> {
        await this.transporter.verify()
    }

    async sendMail(opts: MailOptions): Promise<void> {
        await this.transporter.sendMail({
            from: env.SMTP_FROM,
            to: opts.to,
            subject: opts.subject,
            html: opts.html,
        })
    }
}
