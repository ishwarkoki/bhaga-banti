import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { sendEmail, emailTemplates } from '../config/email.js';
import { logger, toLogError } from '../config/logger.js';
import { users, groups, groupMembers } from '../db/schema/index.js';

export class EmailService {
  /**
   * Send welcome email to new user
   */
  static async sendWelcomeEmail(userId: string): Promise<void> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) return;

      const template = emailTemplates.welcome(user.name);

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.error('Failed to send welcome email', {
        userId,
        error: toLogError(error),
      });
    }
  }

  /**
   * Send notification when user is added to group
   */
  static async notifyAddedToGroup(
    userId: string,
    groupId: string,
    addedByName: string,
  ): Promise<void> {
    try {
      const [user, group] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, userId),
        }),
        db.query.groups.findFirst({
          where: eq(groups.id, groupId),
        }),
      ]);

      if (!user || !group) return;

      const template = emailTemplates.addedToGroup(group.name, addedByName);

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.error('Failed to send added to group notification', {
        userId,
        groupId,
        error: toLogError(error),
      });
    }
  }

  /**
   * Send notification for new expense
   */
  static async notifyNewExpense(
    groupId: string,
    payerId: string,
    amount: number,
    description: string,
  ): Promise<void> {
    try {
      const [group, payer] = await Promise.all([
        db.query.groups.findFirst({
          where: eq(groups.id, groupId),
        }),
        db.query.users.findFirst({
          where: eq(users.id, payerId),
        }),
      ]);

      if (!group || !payer) return;

      const template = emailTemplates.newExpense(
        group.name,
        payer.name,
        amount.toFixed(2),
        description,
      );

      // Get all group members
      const members = await db.query.groupMembers.findMany({
        where: eq(groupMembers.groupId, groupId),
        with: {
          user: true,
        },
      });

      // Send to all members except payer
      for (const member of members) {
        if (member.user.id !== payerId) {
          await sendEmail({
            to: member.user.email,
            subject: template.subject,
            html: template.html,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send expense notification', {
        groupId,
        payerId,
        description,
        error: toLogError(error),
      });
    }
  }

  /**
   * Send settlement notification
   */
  static async notifySettlement(
    fromUserId: string,
    toUserId: string,
    amount: number,
  ): Promise<void> {
    try {
      const [fromUser, toUser] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, fromUserId),
        }),
        db.query.users.findFirst({
          where: eq(users.id, toUserId),
        }),
      ]);

      if (!fromUser || !toUser) return;

      const template = emailTemplates.settlementRecorded(
        fromUser.name,
        toUser.name,
        amount.toFixed(2),
      );

      await sendEmail({
        to: toUser.email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.error('Failed to send settlement notification', {
        fromUserId,
        toUserId,
        amount,
        error: toLogError(error),
      });
    }
  }

  /**
   * Send group invite
   */
  static async sendGroupInvite(
    email: string,
    groupName: string,
    invitedBy: string,
    inviteLink: string,
  ): Promise<void> {
    try {
      const template = emailTemplates.groupInvite(groupName, invitedBy, inviteLink);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    } catch (error) {
      logger.error('Failed to send group invite', {
        email,
        groupName,
        invitedBy,
        error: toLogError(error),
      });
      throw error;
    }
  }
}

export default EmailService;
