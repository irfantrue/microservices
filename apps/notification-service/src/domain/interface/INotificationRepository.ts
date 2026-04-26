import type { NotificationEntity, NotificationStatus } from '../entities/notification.entity'

export interface INotificationRepository {
    save(notification: NotificationEntity): Promise<void>
    updateStatus(id: string, status: NotificationStatus, errorMsg?: string): Promise<void>
    findById(id: string): Promise<NotificationEntity | null>
}
