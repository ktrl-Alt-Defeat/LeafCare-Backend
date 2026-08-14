import {
  CreateNotificationDTO,
  EmailPayload,
  PushPayload,
  NotificationSendResult,
} from './notification.types.js';

export interface IEmailProvider {
  sendEmail(payload: EmailPayload): Promise<NotificationSendResult>;
}

export interface IPushProvider {
  sendPush(payload: PushPayload): Promise<NotificationSendResult>;
}

export interface INotificationService {
  createNotification(dto: CreateNotificationDTO): Promise<{ id: string }>;
  dispatchEmail(payload: EmailPayload): Promise<NotificationSendResult>;
  dispatchPush(payload: PushPayload): Promise<NotificationSendResult>;
}
