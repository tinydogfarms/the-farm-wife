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
  "Bought 50lbs of feed on 8/1 for $32",
  "Sold 2 dozen eggs for $12 yesterday",
  "Paid vet bill of $85 for the goats today",
  "Bought 3 bags of grain on May 20 for $18",
  "Sold tomatoes at the farmers market for $15 on June 10",
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type Category = ExpenseCategory | IncomeCategory;