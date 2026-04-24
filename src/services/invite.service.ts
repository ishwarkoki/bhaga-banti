import { eq, and, gt, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { logger, toLogError } from '../config/logger.js';
import { invitations, groups, groupMembers, users } from '../db/schema/index.js';
import { AppError } from '../middleware/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, INVITE_EXPIRY_DAYS } from '../utils/constants.js';
import { generateId, generateToken, addDays } from '../utils/helpers.js';
import { GroupService } from './group.service.js';
import { EmailService } from './email.service.js';

export class InviteService {
  /**
   * Create a new invitation
   */
  static async createInvite(groupId: string, invitedBy: string, email?: string) {
    // Check if inviter is admin
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, invitedBy)),
    });

    if (!membership || membership.role !== 'admin') {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    // Get group and inviter details
    const [group, inviter] = await Promise.all([
      db.query.groups.findFirst({
        where: eq(groups.id, groupId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, invitedBy),
      }),
    ]);

    if (!group || !inviter) {
      throw new AppError('Group or user not found', 404);
    }

    // Generate invite token
    const token = generateToken(32);
    const inviteId = generateId();

    // Create invitation
    const [invite] = await db
      .insert(invitations)
      .values({
        id: inviteId,
        groupId,
        invitedBy,
        token,
        email: email || null,
        status: 'pending',
        expiresAt: addDays(new Date(), INVITE_EXPIRY_DAYS),
      })
      .returning();

    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;

    // Send email if provided
    if (email) {
      try {
        await EmailService.sendGroupInvite(email, group.name, inviter.name, inviteLink);
      } catch (error) {
        logger.error('Failed to send invite email', {
          groupId,
          email,
          inviteId,
          error: toLogError(error),
        });
      }
    }

    return {
      success: true,
      data: {
        invite: {
          ...invite,
          inviteLink,
        },
        message: SUCCESS_MESSAGES.INVITE_SENT,
      },
    };
  }

  /**
   * Validate an invite token
   */
  static async validateInvite(token: string) {
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
      with: {
        group: {
          columns: {
            id: true,
            name: true,
            description: true,
          },
        },
        invitedBy: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!invite) {
      throw new AppError('Invalid invite link / ଅବୈଧ ଆମନ୍ତ୍ରଣ ଲିଙ୍କ୍', 404);
    }

    // Check status
    if (invite.status === 'accepted') {
      throw new AppError(ERROR_MESSAGES.INVITE_ALREADY_USED, 400);
    }

    if (invite.status === 'revoked') {
      throw new AppError(ERROR_MESSAGES.INVITE_REVOKED, 400);
    }

    if (invite.status === 'expired' || new Date() > invite.expiresAt) {
      throw new AppError(ERROR_MESSAGES.INVITE_EXPIRED, 400);
    }

    return {
      success: true,
      data: {
        invite: {
          id: invite.id,
          token: invite.token,
          status: invite.status,
          expiresAt: invite.expiresAt,
        },
        group: invite.group,
        invitedBy: invite.invitedBy,
      },
    };
  }

  /**
   * Accept an invite
   */
  static async acceptInvite(token: string, userId: string) {
    const validation = await this.validateInvite(token);
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });

    if (!invite) {
      throw new AppError('Invite not found', 404);
    }

    const groupId = invite.groupId;

    // Check if user is already a member
    const isMember = await GroupService.isGroupMember(groupId, userId);
    if (isMember) {
      throw new AppError(ERROR_MESSAGES.ALREADY_MEMBER, 400);
    }

    // Add user to group
    const memberId = generateId();
    await db.insert(groupMembers).values({
      id: memberId,
      groupId,
      userId,
      role: 'member',
    });

    // Update invitation
    await db
      .update(invitations)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: userId,
      })
      .where(eq(invitations.id, invite.id));

    // Get group details
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: {
        id: true,
        name: true,
      },
    });

    return {
      success: true,
      data: {
        group,
      },
      message: SUCCESS_MESSAGES.JOINED_GROUP,
    };
  }

  /**
   * Get invites for a group
   */
  static async getGroupInvites(groupId: string, userId: string) {
    // Check if user is admin
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (!membership || membership.role !== 'admin') {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    const invites = await db.query.invitations.findMany({
      where: and(eq(invitations.groupId, groupId), eq(invitations.status, 'pending')),
      with: {
        invitedBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [sql`${invitations.createdAt} desc`],
    });

    return {
      success: true,
      data: invites.map((invite) => ({
        ...invite,
        inviteLink: `${process.env.FRONTEND_URL}/invite/${invite.token}`,
      })),
    };
  }

  /**
   * Revoke an invite
   */
  static async revokeInvite(inviteId: string, userId: string) {
    const invite = await db.query.invitations.findFirst({
      where: eq(invitations.id, inviteId),
    });

    if (!invite) {
      throw new AppError('Invite not found', 404);
    }

    // Check if user is admin
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, invite.groupId), eq(groupMembers.userId, userId)),
    });

    if (!membership || membership.role !== 'admin') {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    await db.update(invitations).set({ status: 'revoked' }).where(eq(invitations.id, inviteId));

    return {
      success: true,
      message: 'Invite revoked successfully / ଆମନ୍ତ୍ରଣ ସଫଳତାର ସହ ବାତିଲ୍ ହେଲା',
    };
  }

  /**
   * Clean up expired invites
   */
  static async cleanupExpiredInvites() {
    const now = new Date();

    await db
      .update(invitations)
      .set({ status: 'expired' })
      .where(and(eq(invitations.status, 'pending'), gt(sql`${invitations.expiresAt}`, now)));
  }
}

export default InviteService;
