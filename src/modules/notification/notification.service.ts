import { INotificationService, IEmailProvider, IPushProvider } from './notification.interface.js';
import {
  CreateNotificationDTO,
  EmailPayload,
  PushPayload,
  NotificationSendResult,
} from './notification.types.js';
import { logger } from '../../utils/logger.js';

export class NotificationService implements INotificationService {
  constructor(
    private emailProvider?: IEmailProvider,
    private pushProvider?: IPushProvider
  ) {}

  async createNotification(dto: CreateNotificationDTO): Promise<{ id: string }> {
    logger.info(`[NotificationService] Notification queued for user '${dto.user_id}': ${dto.title}`);
    return { id: 'pending_auth_user_notification_id' };
  }

  async dispatchEmail(payload: EmailPayload): Promise<NotificationSendResult> {
    if (!this.emailProvider) {
      logger.warn('[NotificationService] Email provider not configured.');
      return { success: false, channel: 'EMAIL', error: 'Provider not initialized' };
    }
    return this.emailProvider.sendEmail(payload);
  }

  async dispatchPush(payload: PushPayload): Promise<NotificationSendResult> {
    if (!this.pushProvider) {
      logger.warn('[NotificationService] Push provider not configured.');
      return { success: false, channel: 'PUSH', error: 'Provider not initialized' };
    }
    return this.pushProvider.sendPush(payload);
  }
}

export const notificationService = new NotificationService();
