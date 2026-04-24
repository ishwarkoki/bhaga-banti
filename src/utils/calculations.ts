/**
 * Debt Simplification Algorithm
 *
 * This algorithm minimizes the number of transactions needed to settle debts
 * in a group. It uses a greedy approach with max heap for creditors and min heap for debtors.
 *
 * Time Complexity: O(n log n) where n is number of members
 * Space Complexity: O(n)
 */

export interface Balance {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  amount: number; // Positive = owed to them, Negative = they owe
}

export interface Transaction {
  from: {
    userId: string;
    name: string;
    email: string;
    image?: string | null;
  };
  to: {
    userId: string;
    name: string;
    email: string;
    image?: string | null;
  };
  amount: number;
}

/**
 * Calculate simplified debts using greedy algorithm
 * Returns minimum number of transactions to settle all debts
 */
export function simplifyDebts(balances: Balance[]): Transaction[] {
  if (!balances || balances.length < 2) return [];

  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors: Balance[] = [];
  const debtors: Balance[] = [];

  for (const balance of balances) {
    if (balance.amount > 0.01) {
      creditors.push({ ...balance });
    } else if (balance.amount < -0.01) {
      debtors.push({ ...balance, amount: Math.abs(balance.amount) });
    }
  }

  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];
  let creditorIdx = 0;
  let debtorIdx = 0;

  // Greedy matching: match largest debtor with largest creditor
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];

    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    if (settlementAmount > 0.01) {
      transactions.push({
        from: {
          userId: debtor.userId,
          name: debtor.userName,
          email: debtor.userEmail,
          image: debtor.userImage,
        },
        to: {
          userId: creditor.userId,
          name: creditor.userName,
          email: creditor.userEmail,
          image: creditor.userImage,
        },
        amount: Math.round(settlementAmount * 100) / 100, // Round to 2 decimals
      });
    }

    // Update balances
    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    // Move to next if settled
    if (creditor.amount < 0.01) creditorIdx++;
    if (debtor.amount < 0.01) debtorIdx++;
  }

  return transactions;
}

/**
 * Calculate net balance for a user in a group
 */
export function calculateNetBalance(paid: number, owes: number): number {
  return Math.round((paid - owes) * 100) / 100;
}

/**
 * Split amount equally among members
 */
export function splitEqual(amount: number, memberCount: number): number[] {
  if (memberCount <= 0) return [];

  const baseAmount = Math.floor((amount / memberCount) * 100) / 100;
  const total = baseAmount * memberCount;
  const remainder = Math.round((amount - total) * 100) / 100;

  const splits = Array(memberCount).fill(baseAmount);

  // Add remainder to first person
  if (remainder > 0) {
    splits[0] = Math.round((splits[0] + remainder) * 100) / 100;
  }

  return splits;
}

/**
 * Validate that splits sum up to total amount
 */
export function validateSplits(
  splits: { amount: number }[],
  totalAmount: number,
  tolerance: number = 0.01,
): boolean {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  return Math.abs(sum - totalAmount) <= tolerance;
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with Indian number system (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  });
  return formatter.format(num);
}
