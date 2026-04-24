import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { logger, toLogError } from '../config/logger.js';
import { groups, settlements } from '../db/schema/index.js';
import { AppError } from '../middleware/error.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import { GroupService } from './group.service.js';
import { ExpenseService } from './expense.service.js';
import { simplifyDebts, Balance, Transaction } from '../utils/calculations.js';

export class BalanceService {
  /**
   * Get balances for a group
   */
  static async getGroupBalances(groupId: string, userId: string) {
    // Check access
    const isMember = await GroupService.isGroupMember(groupId, userId);
    if (!isMember) {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    // Get group details
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new AppError(ERROR_MESSAGES.GROUP_NOT_FOUND, 404);
    }

    // Calculate balances from expenses
    const rawBalances = await ExpenseService.calculateGroupBalances(groupId);

    // Get settlements for this group
    const groupSettlements = await db.query.settlements.findMany({
      where: eq(settlements.groupId, groupId),
    });

    // Apply settlements to balances
    const adjustedBalances = new Map<string, (typeof rawBalances)[0]>();

    for (const balance of rawBalances) {
      adjustedBalances.set(balance.userId, { ...balance });
    }

    // Process settlements
    for (const settlement of groupSettlements) {
      const fromBalance = adjustedBalances.get(settlement.fromUserId);
      const toBalance = adjustedBalances.get(settlement.toUserId);
      const amount = parseFloat(settlement.amount as string);

      if (fromBalance) {
        fromBalance.paid += amount;
        fromBalance.net = Math.round((fromBalance.paid - fromBalance.owes) * 100) / 100;
      }

      if (toBalance) {
        toBalance.owes += amount;
        toBalance.net = Math.round((toBalance.paid - toBalance.owes) * 100) / 100;
      }
    }

    const balances = Array.from(adjustedBalances.values());

    return {
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          currency: group.currency,
        },
        balances: balances.sort((a, b) => b.net - a.net),
      },
    };
  }

  /**
   * Get simplified debts for a group
   */
  static async getSimplifiedDebts(groupId: string, userId: string) {
    // Check access
    const isMember = await GroupService.isGroupMember(groupId, userId);
    if (!isMember) {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    // Get balances
    const { data } = await this.getGroupBalances(groupId, userId);
    const balances = data.balances;

    // Format for simplification algorithm
    const balanceInput: Balance[] = balances.map((b) => ({
      userId: b.userId,
      userName: b.name,
      userEmail: b.email,
      userImage: b.image,
      amount: b.net,
    }));

    // Run simplification algorithm
    const simplifiedTransactions = simplifyDebts(balanceInput);

    return {
      success: true,
      data: {
        group: data.group,
        originalBalances: balances,
        simplifiedDebts: simplifiedTransactions,
        totalTransactions: simplifiedTransactions.length,
      },
    };
  }

  /**
   * Get user's balance across all groups
   */
  static async getUserTotalBalance(userId: string) {
    // Get all groups user is part of
    const userGroups = await GroupService.getUserGroups(userId, 1, 100);

    let totalOwed = 0; // Amount others owe user
    let totalOwes = 0; // Amount user owes others
    const groupBalances: Array<{
      groupId: string;
      groupName: string;
      balance: number;
    }> = [];

    for (const group of userGroups.data.groups) {
      try {
        const { data } = await this.getGroupBalances(group.id, userId);
        const userBalance = data.balances.find((b) => b.userId === userId);

        if (userBalance) {
          groupBalances.push({
            groupId: group.id,
            groupName: group.name,
            balance: userBalance.net,
          });

          if (userBalance.net > 0) {
            totalOwed += userBalance.net;
          } else {
            totalOwes += Math.abs(userBalance.net);
          }
        }
      } catch (error) {
        // Skip groups with errors
        logger.error('Failed to calculate balance for group', {
          groupId: group.id,
          userId,
          error: toLogError(error),
        });
      }
    }

    return {
      success: true,
      data: {
        totalOwed: Math.round(totalOwed * 100) / 100,
        totalOwes: Math.round(totalOwes * 100) / 100,
        netBalance: Math.round((totalOwed - totalOwes) * 100) / 100,
        groupBalances: groupBalances.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
      },
    };
  }
}

export default BalanceService;
