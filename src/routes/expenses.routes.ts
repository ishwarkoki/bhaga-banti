import { Router } from 'express';
import { ExpenseController } from '../controllers/expenses.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management endpoints
 */

// Expense routes
router.post('/', requireAuth, ExpenseController.createExpense);
router.get('/:id', requireAuth, ExpenseController.getExpenseById);
router.put('/:id', requireAuth, ExpenseController.updateExpense);
router.delete('/:id', requireAuth, ExpenseController.deleteExpense);

// Group expenses
router.get('/group/:groupId', requireAuth, ExpenseController.getGroupExpenses);

export default router;
