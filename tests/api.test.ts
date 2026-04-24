import type { Request, RequestHandler, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const AUTHENTICATED_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'tester@example.com',
  name: 'Test User',
};

const IDS = {
  groupId: '22222222-2222-4222-8222-222222222222',
  expenseId: '33333333-3333-4333-8333-333333333333',
  settlementId: '44444444-4444-4444-8444-444444444444',
  inviteId: '55555555-5555-4555-8555-555555555555',
  memberId: '66666666-6666-4666-8666-666666666666',
  token: 'invite-token-123',
};

vi.mock('../src/config/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  toLogError: vi.fn((error: unknown) => ({
    message: error instanceof Error ? error.message : String(error),
  })),
}));

vi.mock('../src/middleware/rate-limit.js', () => {
  const passthrough = vi.fn((_req, _res, next) => next());

  return {
    generalRateLimiter: passthrough,
    authRateLimiter: passthrough,
    inviteRateLimiter: passthrough,
  };
});

vi.mock('../src/config/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('better-auth/node', () => ({
  toNodeHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../src/services/group.service.js', () => ({
  GroupService: {
    createGroup: vi.fn(),
    getUserGroups: vi.fn(),
    getGroupById: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    isGroupMember: vi.fn(),
    getGroupMembers: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock('../src/services/expense.service.js', () => ({
  ExpenseService: {
    createExpense: vi.fn(),
    getGroupExpenses: vi.fn(),
    getExpenseById: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  },
}));

vi.mock('../src/services/balance.service.js', () => ({
  BalanceService: {
    getGroupBalances: vi.fn(),
    getSimplifiedDebts: vi.fn(),
    getUserTotalBalance: vi.fn(),
  },
}));

vi.mock('../src/services/invite.service.js', () => ({
  InviteService: {
    createInvite: vi.fn(),
    validateInvite: vi.fn(),
    acceptInvite: vi.fn(),
    getGroupInvites: vi.fn(),
    revokeInvite: vi.fn(),
  },
}));

vi.mock('../src/services/settlement.service.js', () => ({
  SettlementService: {
    createSettlement: vi.fn(),
    getGroupSettlements: vi.fn(),
    getUserSettlements: vi.fn(),
    deleteSettlement: vi.fn(),
  },
}));

import { errorHandler } from '../src/middleware/error.ts';
import { GroupController } from '../src/controllers/groups.controller.ts';
import { ExpenseController } from '../src/controllers/expenses.controller.ts';
import { BalanceController } from '../src/controllers/balances.controller.ts';
import { InviteController } from '../src/controllers/invites.controller.ts';
import { SettlementController } from '../src/controllers/settlements.controller.ts';
import authRoutes from '../src/routes/auth.routes.ts';
import balanceRoutes from '../src/routes/balances.routes.ts';
import expenseRoutes from '../src/routes/expenses.routes.ts';
import groupInviteRoutes from '../src/routes/group-invites.routes.ts';
import groupRoutes from '../src/routes/groups.routes.ts';
import inviteRoutes from '../src/routes/invites.routes.ts';
import settlementRoutes from '../src/routes/settlements.routes.ts';
import { GroupService } from '../src/services/group.service.ts';
import { ExpenseService } from '../src/services/expense.service.ts';
import { BalanceService } from '../src/services/balance.service.ts';
import { InviteService } from '../src/services/invite.service.ts';
import { SettlementService } from '../src/services/settlement.service.ts';

type MockResponse = Response & {
  statusCode: number;
  body?: unknown;
};

function createMockResponse(): MockResponse {
  const res = {
    locals: {},
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as MockResponse;

  return res;
}

async function invokeHandler(
  handler: RequestHandler,
  options: {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, unknown>;
    user?: typeof AUTHENTICATED_USER;
    method?: string;
    originalUrl?: string;
    path?: string;
  } = {},
) {
  const req = {
    body: options.body ?? {},
    params: options.params ?? {},
    query: options.query ?? {},
    headers: {},
    method: options.method ?? 'GET',
    path: options.path ?? '/',
    originalUrl: options.originalUrl ?? '/',
    user: options.user,
  } as unknown as Request;

  const res = createMockResponse();
  const next = vi.fn();

  handler(req, res, next);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const error = next.mock.calls[0]?.[0];
  if (error) {
    errorHandler(error, req, res, (() => {}) as never);
  }

  return { req, res, next };
}

function listRoutes(router: {
  stack?: Array<{ route?: { path: string; methods: Record<string, boolean> } }>;
}) {
  return (router.stack ?? []).flatMap((layer) => {
    if (!layer.route) {
      return [];
    }

    return Object.keys(layer.route.methods)
      .filter((method) => layer.route?.methods[method])
      .map((method) => `${method.toUpperCase()} ${layer.route?.path}`);
  });
}

describe('Route registration', () => {
  it('registers all group endpoints', () => {
    expect(listRoutes(groupRoutes)).toEqual([
      'POST /',
      'GET /',
      'GET /:id',
      'PUT /:id',
      'DELETE /:id',
      'GET /:id/members',
      'POST /:id/members',
      'DELETE /:id/members/:userId',
    ]);
  });

  it('registers all expense endpoints', () => {
    expect(listRoutes(expenseRoutes)).toEqual([
      'POST /',
      'GET /:id',
      'PUT /:id',
      'DELETE /:id',
      'GET /group/:groupId',
    ]);
  });

  it('registers all balance endpoints', () => {
    expect(listRoutes(balanceRoutes)).toEqual([
      'GET /groups/:groupId/balances',
      'GET /groups/:groupId/simplify',
      'GET /balances',
    ]);
  });

  it('registers all group invite endpoints', () => {
    expect(listRoutes(groupInviteRoutes)).toEqual([
      'POST /:groupId/invites',
      'GET /:groupId/invites',
    ]);
  });

  it('registers all invite endpoints', () => {
    expect(listRoutes(inviteRoutes)).toEqual([
      'GET /:token',
      'POST /:token/accept',
      'POST /groups/:groupId/invites',
      'GET /groups/:groupId/invites',
      'DELETE /:id',
    ]);
  });

  it('registers all settlement endpoints', () => {
    expect(listRoutes(settlementRoutes)).toEqual([
      'POST /',
      'GET /user',
      'GET /group/:groupId',
      'DELETE /:id',
    ]);
  });

  it('mounts Better Auth through the auth route module', () => {
    expect(authRoutes.stack?.length).toBe(2);
  });
});

describe('GroupController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(GroupService.createGroup).mockResolvedValue({
      success: true,
      data: { id: IDS.groupId },
    });
    vi.mocked(GroupService.getUserGroups).mockResolvedValue({
      success: true,
      data: { groups: [] },
    });
    vi.mocked(GroupService.getGroupById).mockResolvedValue({
      success: true,
      data: { id: IDS.groupId },
    });
    vi.mocked(GroupService.updateGroup).mockResolvedValue({
      success: true,
      data: { id: IDS.groupId },
    });
    vi.mocked(GroupService.deleteGroup).mockResolvedValue({ success: true, message: 'deleted' });
    vi.mocked(GroupService.isGroupMember).mockResolvedValue(true);
    vi.mocked(GroupService.getGroupMembers).mockResolvedValue([{ userId: AUTHENTICATED_USER.id }]);
    vi.mocked(GroupService.addMember).mockResolvedValue({ success: true, message: 'added' });
    vi.mocked(GroupService.removeMember).mockResolvedValue({ success: true, message: 'removed' });
  });

  it('creates a group', async () => {
    const { res } = await invokeHandler(GroupController.createGroup, {
      user: AUTHENTICATED_USER,
      body: { name: 'Trip Fund', description: 'Goa trip' },
      method: 'POST',
      originalUrl: '/api/groups',
    });

    expect(res.statusCode).toBe(201);
    expect(GroupService.createGroup).toHaveBeenCalledWith(AUTHENTICATED_USER.id, {
      name: 'Trip Fund',
      description: 'Goa trip',
    });
  });

  it('lists user groups with parsed pagination', async () => {
    const { res } = await invokeHandler(GroupController.getUserGroups, {
      user: AUTHENTICATED_USER,
      query: { page: '2', limit: '5' },
      originalUrl: '/api/groups?page=2&limit=5',
    });

    expect(res.statusCode).toBe(200);
    expect(GroupService.getUserGroups).toHaveBeenCalledWith(AUTHENTICATED_USER.id, 2, 5);
  });

  it('gets a group by id', async () => {
    const { res } = await invokeHandler(GroupController.getGroupById, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId },
      originalUrl: `/api/groups/${IDS.groupId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(GroupService.getGroupById).toHaveBeenCalledWith(IDS.groupId, AUTHENTICATED_USER.id);
  });

  it('updates a group', async () => {
    const { res } = await invokeHandler(GroupController.updateGroup, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId },
      body: { name: 'Updated Group' },
      method: 'PUT',
      originalUrl: `/api/groups/${IDS.groupId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(GroupService.updateGroup).toHaveBeenCalledWith(IDS.groupId, AUTHENTICATED_USER.id, {
      name: 'Updated Group',
    });
  });

  it('deletes a group', async () => {
    const { res } = await invokeHandler(GroupController.deleteGroup, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId },
      method: 'DELETE',
      originalUrl: `/api/groups/${IDS.groupId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(GroupService.deleteGroup).toHaveBeenCalledWith(IDS.groupId, AUTHENTICATED_USER.id);
  });

  it('gets members for an accessible group', async () => {
    const { res } = await invokeHandler(GroupController.getGroupMembers, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId },
      originalUrl: `/api/groups/${IDS.groupId}/members`,
    });

    expect(res.statusCode).toBe(200);
    expect(GroupService.isGroupMember).toHaveBeenCalledWith(IDS.groupId, AUTHENTICATED_USER.id);
    expect(GroupService.getGroupMembers).toHaveBeenCalledWith(IDS.groupId);
  });

  it('adds a member', async () => {
    const { res } = await invokeHandler(GroupController.addMember, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId },
      body: { userId: IDS.memberId },
      method: 'POST',
      originalUrl: `/api/groups/${IDS.groupId}/members`,
    });

    expect(res.statusCode).toBe(200);
    expect(GroupService.addMember).toHaveBeenCalledWith(
      IDS.groupId,
      AUTHENTICATED_USER.id,
      IDS.memberId,
    );
  });

  it('removes a member', async () => {
    const { res } = await invokeHandler(GroupController.removeMember, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId, userId: IDS.memberId },
      method: 'DELETE',
      originalUrl: `/api/groups/${IDS.groupId}/members/${IDS.memberId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(GroupService.removeMember).toHaveBeenCalledWith(
      IDS.groupId,
      AUTHENTICATED_USER.id,
      IDS.memberId,
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const { res } = await invokeHandler(GroupController.createGroup, {
      body: { name: 'Trip Fund' },
      method: 'POST',
      originalUrl: '/api/groups',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: 'Unauthorized' });
  });

  it('returns 403 for non-members requesting members', async () => {
    vi.mocked(GroupService.isGroupMember).mockResolvedValue(false);

    const { res } = await invokeHandler(GroupController.getGroupMembers, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId },
      originalUrl: `/api/groups/${IDS.groupId}/members`,
    });

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ success: false, error: 'Access denied' });
  });

  it('returns 400 when userId is missing on add member', async () => {
    const { res } = await invokeHandler(GroupController.addMember, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.groupId },
      body: {},
      method: 'POST',
      originalUrl: `/api/groups/${IDS.groupId}/members`,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: 'userId is required' });
  });
});

describe('ExpenseController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(ExpenseService.createExpense).mockResolvedValue({
      success: true,
      data: { id: IDS.expenseId },
    });
    vi.mocked(ExpenseService.getGroupExpenses).mockResolvedValue({
      success: true,
      data: { expenses: [] },
    });
    vi.mocked(ExpenseService.getExpenseById).mockResolvedValue({
      id: IDS.expenseId,
      description: 'Lunch',
    } as never);
    vi.mocked(ExpenseService.updateExpense).mockResolvedValue({
      success: true,
      data: { id: IDS.expenseId },
    });
    vi.mocked(ExpenseService.deleteExpense).mockResolvedValue({
      success: true,
      message: 'deleted',
    });
  });

  it('creates an expense', async () => {
    const { res } = await invokeHandler(ExpenseController.createExpense, {
      user: AUTHENTICATED_USER,
      body: {
        groupId: IDS.groupId,
        amount: 240,
        description: 'Lunch',
        expenseDate: '2026-04-24T10:00:00.000Z',
        splitType: 'equal',
        splits: [{ userId: IDS.memberId, amount: 120 }],
      },
      method: 'POST',
      originalUrl: '/api/expenses',
    });

    expect(res.statusCode).toBe(201);
    expect(ExpenseService.createExpense).toHaveBeenCalledWith(
      AUTHENTICATED_USER.id,
      expect.objectContaining({
        groupId: IDS.groupId,
        amount: 240,
        description: 'Lunch',
      }),
    );
  });

  it('lists expenses for a group', async () => {
    const { res } = await invokeHandler(ExpenseController.getGroupExpenses, {
      user: AUTHENTICATED_USER,
      params: { groupId: IDS.groupId },
      query: { page: '3', limit: '10' },
      originalUrl: `/api/expenses/group/${IDS.groupId}?page=3&limit=10`,
    });

    expect(res.statusCode).toBe(200);
    expect(ExpenseService.getGroupExpenses).toHaveBeenCalledWith(
      IDS.groupId,
      AUTHENTICATED_USER.id,
      3,
      10,
    );
  });

  it('gets an expense by id', async () => {
    const { res } = await invokeHandler(ExpenseController.getExpenseById, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.expenseId },
      originalUrl: `/api/expenses/${IDS.expenseId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { id: IDS.expenseId, description: 'Lunch' },
    });
  });

  it('updates an expense', async () => {
    const { res } = await invokeHandler(ExpenseController.updateExpense, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.expenseId },
      body: { description: 'Dinner' },
      method: 'PUT',
      originalUrl: `/api/expenses/${IDS.expenseId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(ExpenseService.updateExpense).toHaveBeenCalledWith(
      IDS.expenseId,
      AUTHENTICATED_USER.id,
      {
        description: 'Dinner',
      },
    );
  });

  it('deletes an expense', async () => {
    const { res } = await invokeHandler(ExpenseController.deleteExpense, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.expenseId },
      method: 'DELETE',
      originalUrl: `/api/expenses/${IDS.expenseId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(ExpenseService.deleteExpense).toHaveBeenCalledWith(IDS.expenseId, AUTHENTICATED_USER.id);
  });

  it('returns 400 for invalid expense payloads', async () => {
    const { res } = await invokeHandler(ExpenseController.createExpense, {
      user: AUTHENTICATED_USER,
      body: {
        groupId: 'not-a-uuid',
        amount: -1,
        description: '',
        expenseDate: 'invalid-date',
        splits: [],
      },
      method: 'POST',
      originalUrl: '/api/expenses',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: 'Validation Error' });
  });
});

describe('BalanceController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(BalanceService.getGroupBalances).mockResolvedValue({
      success: true,
      data: { balances: [] },
    });
    vi.mocked(BalanceService.getSimplifiedDebts).mockResolvedValue({
      success: true,
      data: { simplifiedDebts: [] },
    });
    vi.mocked(BalanceService.getUserTotalBalance).mockResolvedValue({
      success: true,
      data: { netBalance: 0 },
    });
  });

  it('gets group balances', async () => {
    const { res } = await invokeHandler(BalanceController.getGroupBalances, {
      user: AUTHENTICATED_USER,
      params: { groupId: IDS.groupId },
      originalUrl: `/api/groups/${IDS.groupId}/balances`,
    });

    expect(res.statusCode).toBe(200);
    expect(BalanceService.getGroupBalances).toHaveBeenCalledWith(
      IDS.groupId,
      AUTHENTICATED_USER.id,
    );
  });

  it('gets simplified debts', async () => {
    const { res } = await invokeHandler(BalanceController.getSimplifiedDebts, {
      user: AUTHENTICATED_USER,
      params: { groupId: IDS.groupId },
      originalUrl: `/api/groups/${IDS.groupId}/simplify`,
    });

    expect(res.statusCode).toBe(200);
    expect(BalanceService.getSimplifiedDebts).toHaveBeenCalledWith(
      IDS.groupId,
      AUTHENTICATED_USER.id,
    );
  });

  it('gets the current user total balance', async () => {
    const { res } = await invokeHandler(BalanceController.getUserTotalBalance, {
      user: AUTHENTICATED_USER,
      originalUrl: '/api/balances',
    });

    expect(res.statusCode).toBe(200);
    expect(BalanceService.getUserTotalBalance).toHaveBeenCalledWith(AUTHENTICATED_USER.id);
  });
});

describe('InviteController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(InviteService.createInvite).mockResolvedValue({
      success: true,
      data: { id: IDS.inviteId },
    });
    vi.mocked(InviteService.validateInvite).mockResolvedValue({
      success: true,
      data: { token: IDS.token },
    });
    vi.mocked(InviteService.acceptInvite).mockResolvedValue({ success: true, message: 'accepted' });
    vi.mocked(InviteService.getGroupInvites).mockResolvedValue({
      success: true,
      data: { invites: [] },
    });
    vi.mocked(InviteService.revokeInvite).mockResolvedValue({ success: true, message: 'revoked' });
  });

  it('creates an invite', async () => {
    const { res } = await invokeHandler(InviteController.createInvite, {
      user: AUTHENTICATED_USER,
      params: { groupId: IDS.groupId },
      body: { email: 'friend@example.com' },
      method: 'POST',
      originalUrl: `/api/groups/${IDS.groupId}/invites`,
    });

    expect(res.statusCode).toBe(201);
    expect(InviteService.createInvite).toHaveBeenCalledWith(
      IDS.groupId,
      AUTHENTICATED_USER.id,
      'friend@example.com',
    );
  });

  it('validates an invite token', async () => {
    const { res } = await invokeHandler(InviteController.validateInvite, {
      params: { token: IDS.token },
      originalUrl: `/api/invites/${IDS.token}`,
    });

    expect(res.statusCode).toBe(200);
    expect(InviteService.validateInvite).toHaveBeenCalledWith(IDS.token);
  });

  it('accepts an invite token', async () => {
    const { res } = await invokeHandler(InviteController.acceptInvite, {
      user: AUTHENTICATED_USER,
      params: { token: IDS.token },
      method: 'POST',
      originalUrl: `/api/invites/${IDS.token}/accept`,
    });

    expect(res.statusCode).toBe(200);
    expect(InviteService.acceptInvite).toHaveBeenCalledWith(IDS.token, AUTHENTICATED_USER.id);
  });

  it('lists group invites', async () => {
    const { res } = await invokeHandler(InviteController.getGroupInvites, {
      user: AUTHENTICATED_USER,
      params: { groupId: IDS.groupId },
      originalUrl: `/api/groups/${IDS.groupId}/invites`,
    });

    expect(res.statusCode).toBe(200);
    expect(InviteService.getGroupInvites).toHaveBeenCalledWith(IDS.groupId, AUTHENTICATED_USER.id);
  });

  it('revokes an invite', async () => {
    const { res } = await invokeHandler(InviteController.revokeInvite, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.inviteId },
      method: 'DELETE',
      originalUrl: `/api/invites/${IDS.inviteId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(InviteService.revokeInvite).toHaveBeenCalledWith(IDS.inviteId, AUTHENTICATED_USER.id);
  });
});

describe('SettlementController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(SettlementService.createSettlement).mockResolvedValue({
      success: true,
      data: { id: IDS.settlementId },
    });
    vi.mocked(SettlementService.getGroupSettlements).mockResolvedValue({
      success: true,
      data: { settlements: [] },
    });
    vi.mocked(SettlementService.getUserSettlements).mockResolvedValue({
      success: true,
      data: { settlements: [] },
    });
    vi.mocked(SettlementService.deleteSettlement).mockResolvedValue({
      success: true,
      message: 'deleted',
    });
  });

  it('creates a settlement', async () => {
    const { res } = await invokeHandler(SettlementController.createSettlement, {
      user: AUTHENTICATED_USER,
      body: {
        groupId: IDS.groupId,
        toUserId: IDS.memberId,
        amount: 500,
        method: 'cash',
      },
      method: 'POST',
      originalUrl: '/api/settlements',
    });

    expect(res.statusCode).toBe(201);
    expect(SettlementService.createSettlement).toHaveBeenCalledWith(
      AUTHENTICATED_USER.id,
      expect.objectContaining({
        groupId: IDS.groupId,
        toUserId: IDS.memberId,
        amount: 500,
      }),
    );
  });

  it('lists group settlements', async () => {
    const { res } = await invokeHandler(SettlementController.getGroupSettlements, {
      user: AUTHENTICATED_USER,
      params: { groupId: IDS.groupId },
      query: { page: '2', limit: '10' },
      originalUrl: `/api/settlements/group/${IDS.groupId}?page=2&limit=10`,
    });

    expect(res.statusCode).toBe(200);
    expect(SettlementService.getGroupSettlements).toHaveBeenCalledWith(
      IDS.groupId,
      AUTHENTICATED_USER.id,
      2,
      10,
    );
  });

  it('lists current user settlements', async () => {
    const { res } = await invokeHandler(SettlementController.getUserSettlements, {
      user: AUTHENTICATED_USER,
      query: { page: '4', limit: '15' },
      originalUrl: '/api/settlements/user?page=4&limit=15',
    });

    expect(res.statusCode).toBe(200);
    expect(SettlementService.getUserSettlements).toHaveBeenCalledWith(AUTHENTICATED_USER.id, 4, 15);
  });

  it('deletes a settlement', async () => {
    const { res } = await invokeHandler(SettlementController.deleteSettlement, {
      user: AUTHENTICATED_USER,
      params: { id: IDS.settlementId },
      method: 'DELETE',
      originalUrl: `/api/settlements/${IDS.settlementId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(SettlementService.deleteSettlement).toHaveBeenCalledWith(
      IDS.settlementId,
      AUTHENTICATED_USER.id,
    );
  });
});
