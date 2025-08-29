// Schedule F Categories for Farm Accounting

export const EXPENSE_CATEGORIES = [
  'Feed',
  'Fertilizers and lime', 
  'Seeds and plants',
  'Gasoline, fuel, and oil',
  'Veterinary, breeding, and medicine',
  'Supplies',
  'Repairs and maintenance',
  'Labor hired',
  'Utilities',
  'Insurance (other than health)',
  'Taxes',
  'Other expenses'
] as const;

export const INCOME_CATEGORIES = [
  'Sales of livestock, produce, grains, and other products you raised',
  'Sales of livestock and other items you bought for resale',
  'Custom hire income',
  'Agricultural program payments',
  'Other income'
] as const;

export const PROMPT_EXAMPLES = [
  "We bought a ton of feed on February 1 for $700",
  "Sold 50 head of cattle on March 15th for $45,000",
  "Purchased fertilizer for $1,200 yesterday",
  "Received crop insurance payment of $8,500 on May 20",
  "Paid veterinary bill of $450 today",
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type Category = ExpenseCategory | IncomeCategory;