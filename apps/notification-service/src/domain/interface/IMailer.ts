export interface MailOptions {
    to: string
    subject: string
    html: string
}

export interface IMailer {
    sendMail(opts: MailOptions): Promise<void>
    verifyConnection(): Promise<void>
}
