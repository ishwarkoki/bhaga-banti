import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { logger, toLogError } from '../config/logger.js';
import { settlements, groups, groupMembers } from '../db/schema/index.js';
import { AppError } from '../middleware/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';
import { GroupService } from './group.service.js';
import { EmailService } from './email.service.js';
import type { CreateSettlementInput } from '../utils/validators.js';

type SettlementDetails = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  method: 'cash' | 'upi' | 'bank_transfer' | 'other';
  notes: string | null;
  settledAt: Date;
  createdAt: Date;
  fromUser: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  group: {
    id: string;
    name: string;
  };
};

export class SettlementService {
  /**
   * Create a new settlement
   */
  static async createSettlement(fromUserId: string, input: CreateSettlementInput) {
    const { groupId, toUserId, amount, method, notes } = input;

    // Validate users are different
    if (fromUserId === toUserId) {
      throw new AppError(ERROR_MESSAGES.CANNOT_SETTLE_SELF, 400);
    }

    // Check if both users are members
    const [fromIsMember, toIsMember] = await Promise.all([
      GroupService.isGroupMember(groupId, fromUserId),
      GroupService.isGroupMember(groupId, toUserId),
    ]);

    if (!fromIsMember || !toIsMember) {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    const settlementId = generateId();

    // Create settlement
    const [settlement] = await db
      .insert(settlements)
      .values({
        id: settlementId,
        groupId,
        fromUserId,
        toUserId,
        amount: amount.toString(),
        method,
        notes: notes || null,
        settledAt: new Date(),
      })
      .returning();

    // Get full settlement with user details
    const fullSettlement = await this.getSettlementById(settlementId);

    // Send notification
    EmailService.notifySettlement(fromUserId, toUserId, amount).catch((error) => {
      logger.error('Failed to queue settlement email notification', {
        fromUserId,
        toUserId,
        amount,
        error: toLogError(error),
      });
    });

    return {
      success: true,
      data: fullSettlement,
      message: SUCCESS_MESSAGES.SETTLEMENT_RECORDED,
    };
  }

  /**
   * Get settlement by ID
   */
  static async getSettlementById(settlementId: string): Promise<SettlementDetails> {
    const settlement = await db.query.settlements.findFirst({
      where: eq(settlements.id, settlementId),
      with: {
        fromUser: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        toUser: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!settlement) {
      throw new AppError('Settlement not found', 404);
    }

    if (!settlement.fromUser || !settlement.toUser || !settlement.group) {
      throw new AppError('Settlement relations are incomplete', 500);
    }

    return {
      ...settlement,
      amount: parseFloat(settlement.amount as string),
    };
  }

  /**
   * Get settlements for a group
   */
  static async getGroupSettlements(
    groupId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Check access
    const isMember = await GroupService.isGroupMember(groupId, userId);
    if (!isMember) {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    const offset = (page - 1) * limit;

    const groupSettlements = await db.query.settlements.findMany({
      where: eq(settlements.groupId, groupId),
      with: {
        fromUser: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        toUser: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [desc(settlements.settledAt)],
      limit,
      offset,
    });

    // Get total count
    const countResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(settlements)
      .where(eq(settlements.groupId, groupId));

    const total = countResult[0]?.count || 0;

    // Parse amounts
    const parsedSettlements = groupSettlements.map((s) => ({
      ...s,
      amount: parseFloat(s.amount as string),
    }));

    return {
      success: true,
      data: {
        settlements: parsedSettlements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get settlements involving a specific user
   */
  static async getUserSettlements(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const userSettlements = await db.query.settlements.findMany({
      where: and(sql`${settlements.fromUserId} = ${userId} OR ${settlements.toUserId} = ${userId}`),
      with: {
        fromUser: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        toUser: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(settlements.settledAt)],
      limit,
      offset,
    });

    // Get total count
    const countResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(settlements)
      .where(
        and(sql`${settlements.fromUserId} = ${userId} OR ${settlements.toUserId} = ${userId}`),
      );

    const total = countResult[0]?.count || 0;

    // Parse amounts and categorize
    const parsedSettlements = userSettlements.map((s) => {
      const isPayer = s.fromUserId === userId;
      return {
        ...s,
        amount: parseFloat(s.amount as string),
        type: isPayer ? 'paid' : 'received',
        otherUser: isPayer ? s.toUser : s.fromUser,
      };
    });

    return {
      success: true,
      data: {
        settlements: parsedSettlements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Delete a settlement
   */
  static async deleteSettlement(settlementId: string, userId: string) {
    const settlement = await this.getSettlementById(settlementId);

    // Only involved users or admin can delete
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, settlement.group.id), eq(groupMembers.userId, userId)),
    });

    const canDelete =
      settlement.fromUser.id === userId ||
      settlement.toUser.id === userId ||
      membership?.role === 'admin';

    if (!canDelete) {
      throw new AppError('Not authorized to delete this settlement', 403);
    }

    await db.delete(settlements).where(eq(settlements.id, settlementId));

    return {
      success: true,
      message: 'Settlement deleted successfully / ନିଷ୍ପତ୍ତି ସଫଳତାର ସହ ବିଲୋପ ହେଲା',
    };
  }
}

export default SettlementService;
