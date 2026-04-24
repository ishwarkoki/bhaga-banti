import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { groups, groupMembers } from '../db/schema/index.js';
import { AppError } from '../middleware/error.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';
import type { CreateGroupInput, UpdateGroupInput, AddMemberInput } from '../utils/validators.js';

export class GroupService {
  /**
   * Create a new group
   */
  static async createGroup(userId: string, input: CreateGroupInput) {
    const groupId = generateId();

    // Create group
    const [group] = await db
      .insert(groups)
      .values({
        id: groupId,
        name: input.name,
        description: input.description || null,
        createdBy: userId,
      })
      .returning();

    // Add creator as admin
    await db.insert(groupMembers).values({
      id: generateId(),
      groupId: groupId,
      userId: userId,
      role: 'admin',
    });

    return {
      success: true,
      data: group,
      message: SUCCESS_MESSAGES.GROUP_CREATED,
    };
  }

  /**
   * Get group by ID with members
   */
  static async getGroupById(groupId: string, userId: string) {
    // Check if user is a member
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (!membership) {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

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
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!group) {
      throw new AppError(ERROR_MESSAGES.GROUP_NOT_FOUND, 404);
    }

    return {
      success: true,
      data: group,
    };
  }

  /**
   * Get all groups for a user
   */
  static async getUserGroups(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const userGroups = await db.query.groupMembers.findMany({
      where: eq(groupMembers.userId, userId),
      with: {
        group: {
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
            creator: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      limit,
      offset,
    });

    // Get total count
    const countResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    const total = countResult[0]?.count || 0;

    return {
      success: true,
      data: {
        groups: userGroups.map((membership) => membership.group),
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
   * Update group
   */
  static async updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
    // Check if user is admin
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (!membership || membership.role !== 'admin') {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    const [updatedGroup] = await db
      .update(groups)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning();

    return {
      success: true,
      data: updatedGroup,
      message: 'Group updated successfully / ଗ୍ରୁପ୍ ସଫଳତାର ସହ ଅପଡେଟ୍ ହେଲା',
    };
  }

  /**
   * Delete group
   */
  static async deleteGroup(groupId: string, userId: string) {
    // Check if user is admin
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (!membership || membership.role !== 'admin') {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    await db.delete(groups).where(eq(groups.id, groupId));

    return {
      success: true,
      message: 'Group deleted successfully / ଗ୍ରୁପ୍ ସଫଳତାର ସହ ବିଲୋପ ହେଲା',
    };
  }

  /**
   * Add member to group
   */
  static async addMember(groupId: string, userId: string, invitedUserId: string) {
    // Check if inviter is admin
    const inviterMembership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (!inviterMembership || inviterMembership.role !== 'admin') {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    // Check if user is already a member
    const existingMembership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, invitedUserId)),
    });

    if (existingMembership) {
      throw new AppError(ERROR_MESSAGES.ALREADY_MEMBER, 400);
    }

    const [member] = await db
      .insert(groupMembers)
      .values({
        id: generateId(),
        groupId,
        userId: invitedUserId,
        role: 'member',
      })
      .returning();

    return {
      success: true,
      data: member,
      message: 'Member added successfully / ସଦସ୍ୟ ସଫଳତାର ସହ ଯୋଡ଼ାଗଲେ',
    };
  }

  /**
   * Remove member from group
   */
  static async removeMember(groupId: string, userId: string, memberId: string) {
    // Check if user is admin
    const inviterMembership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    if (!inviterMembership || inviterMembership.role !== 'admin') {
      throw new AppError(ERROR_MESSAGES.GROUP_ACCESS_DENIED, 403);
    }

    // Cannot remove yourself
    if (memberId === userId) {
      throw new AppError('Cannot remove yourself / ନିଜକୁ ବାହାର କରିପାରିବେ ନାହିଁ', 400);
    }

    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, memberId)));

    return {
      success: true,
      message: 'Member removed successfully / ସଦସ୍ୟ ସଫଳତାର ସହ ବାହାର କରାଗଲେ',
    };
  }

  /**
   * Check if user is member of group
   */
  static async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const membership = await db.query.groupMembers.findFirst({
      where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    });

    return !!membership;
  }

  /**
   * Get all members of a group
   */
  static async getGroupMembers(groupId: string) {
    const members = await db.query.groupMembers.findMany({
      where: eq(groupMembers.groupId, groupId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
      },
    });

    return members.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }
}
