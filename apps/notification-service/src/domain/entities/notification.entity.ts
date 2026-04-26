export enum NotificationStatus {
    Queued = 'queued',
    Sent = 'sent',
    Failed = 'failed',
}

export interface NotificationEntity {
    id: string
    recipientId: string
    to: string
    subject: string
    templateSlug: string
    vars: Record<string, string>
    status: NotificationStatus
    errorMsg?: string
    createdAt: Date
    sentAt?: Date
}
