// App constants
export const APP_NAME = 'Bhaga-Banti';
export const APP_DESCRIPTION = 'Share expenses with friends and family';

// Currency
export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Rate Limiting
export const RATE_LIMITS = {
  general: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  auth: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 auth requests per minute
  },
  invites: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 invite requests per minute
  },
};

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍔' },
  { id: 'transportation', name: 'Transportation', icon: '🚗' },
  { id: 'housing', name: 'Housing & Rent', icon: '🏠' },
  { id: 'utilities', name: 'Utilities', icon: '💡' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'health', name: 'Health & Medical', icon: '🏥' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'personal', name: 'Personal Care', icon: '💇' },
  { id: 'other', name: 'Other', icon: '📦' },
] as const;

// Split Types
export const SPLIT_TYPES = [
  { id: 'equal', name: 'Equal', description: 'Split equally among all members' },
  { id: 'exact', name: 'Exact Amounts', description: 'Specify exact amount for each person' },
  { id: 'percentage', name: 'Percentage', description: 'Split by percentage' },
  { id: 'shares', name: 'Shares', description: 'Split by shares/units' },
] as const;

// Settlement Methods
export const SETTLEMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: '💵' },
  { id: 'upi', name: 'UPI', icon: '📱' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
  { id: 'other', name: 'Other', icon: '📝' },
] as const;

// Member Roles
export const MEMBER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

// Invitation
export const INVITE_EXPIRY_DAYS = 7;

// Error Messages (Bilingual: English + Odia)
export const ERROR_MESSAGES = {
  // General
  NOT_FOUND: 'Resource not found / ସମ୍ବଳ ମିଳୁନାହିଁ',
  UNAUTHORIZED: 'Unauthorized / ଅନାଧିକୃତ',
  FORBIDDEN: 'Forbidden / ନିଷିଦ୍ଧ',
  INTERNAL_ERROR: 'Something went wrong / କିଛି ଭୁଲ ହୋଇଗଲା',

  // Auth
  NOT_LOGGED_IN: 'Please log in to continue / ଅଗ୍ରଗତି କରିବାକୁ ଦୟାକରି ଲଗଇନ୍ କରନ୍ତୁ',
  INVALID_TOKEN: 'Invalid or expired token / ଅବୈଧ କିମ୍ବା ମିଆଦି ପାରିହେଉଥିବା ଟୋକେନ୍',

  // Groups
  GROUP_NOT_FOUND: 'Group not found / ଗ୍ରୁପ୍ ମିଳୁନାହିଁ',
  GROUP_ACCESS_DENIED:
    'You do not have access to this group / ଆପଣଙ୍କୁ ଏହି ଗ୍ରୁପ୍ ପ୍ରବେଶ ଅଧିକାର ନାହିଁ',
  ALREADY_MEMBER: 'User is already a member / ସଦସ୍ୟ ପୂର୍ବରୁ ଗ୍ରୁପ୍ ରେ ଅଛନ୍ତି',

  // Expenses
  EXPENSE_NOT_FOUND: 'Expense not found / ଖର୍ଚ୍ଚ ମିଳୁନାହିଁ',
  INVALID_SPLIT: 'Invalid split amounts / ଅବୈଧ ବାଣ୍ଟିବାର ପରିମାଣ',

  // Settlements
  INVALID_SETTLEMENT: 'Invalid settlement / ଅବୈଧ ନିଷ୍ପତ୍ତି',
  CANNOT_SETTLE_SELF: 'Cannot settle with yourself / ନିଜ ସହିତ ନିଷ୍ପତ୍ତି କରିପାରିବେ ନାହିଁ',

  // Invites
  INVITE_EXPIRED: 'Invite link has expired / ଆମନ୍ତ୍ରଣ ଲିଙ୍କ୍ ମିଆଦି ପାରିଯାଇଛି',
  INVITE_REVOKED: 'Invite has been revoked / ଆମନ୍ତ୍ରଣ ବାତିଲ୍ କରାଯାଇଛି',
  INVITE_ALREADY_USED: 'Invite already used / ଆମନ୍ତ୍ରଣ ପୂର୍ବରୁ ବ୍ୟବହାର ହୋଇଛି',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  GROUP_CREATED: 'Group created successfully / ଗ୍ରୁପ୍ ସଫଳତାର ସହ ସୃଷ୍ଟି ହେଲା',
  EXPENSE_ADDED: 'Expense added successfully / ଖର୍ଚ୍ଚ ସଫଳତାର ସହ ଯୋଡ଼ାଗଲା',
  SETTLEMENT_RECORDED: 'Settlement recorded successfully / ନିଷ୍ପତ୍ତି ସଫଳତାର ସହ ରେକର୍ଡ ହେଲା',
  INVITE_SENT: 'Invitation sent successfully / ଆମନ୍ତ୍ରଣ ସଫଳତାର ସହ ପଠାଗଲା',
  JOINED_GROUP: 'Joined group successfully / ଗ୍ରୁପ୍ ସଫଳତାର ସହ ଯୋଗଦାନ କଲେ',
};
