import { notification_type } from '@prisma/client';

export type NotificationChannel = 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP';

export interface EmailPayload {
  to: string;
  subject: string;
  templateName: string;
  variables: Record<string, unknown>;
}

export interface PushPayload {
  targetToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface CreateNotificationDTO {
  user_id: string;
  type: notification_type;
  title: string;
  message: string;
  link_url?: string;
  channels?: NotificationChannel[];
}

export interface NotificationSendResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}
