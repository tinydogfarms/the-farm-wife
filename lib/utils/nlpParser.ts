import type { TransactionInput } from '../types';
import { matchCategory } from './categoryMatcher';

export function parseNaturalLanguage(input: string): Partial<TransactionInput> {
  const text = input.toLowerCase();
  const currentYear = new Date().getFullYear();
  
  // Determine if income or expense with expanded keywords
  const incomeKeywords = /\b(sold|sale|selling|received|income|payment|paid to us|got paid|made|earned|revenue|profit|proceeds|collected|harvest|harvested)\b/;
  const expenseKeywords = /\b(bought|purchased|paid|expense|cost|spent|bill|fee|hired|repair|fixed|maintenance|bought|acquired)\b/;
  
  let type: 'income' | 'expense';
  if (incomeKeywords.test(text)) {
    type = 'income';
  } else if (expenseKeywords.test(text)) {
    type = 'expense';
  } else {
    // Default to expense if uncertain (most farm transactions are expenses)
    type = 'expense';
  }
  
  // Extract amount - prioritize dollar amounts, then look for amounts near "for"
  let amount = 0;
  
  // First try to find explicit dollar amounts
  const dollarMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (dollarMatch) {
    amount = parseFloat(dollarMatch[1].replace(/,/g, ''));
  } else {
    // Look for amounts after "for" (e.g., "for $100", "for 100")
    const forAmountMatch = text.match(/for\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (forAmountMatch) {
      amount = parseFloat(forAmountMatch[1].replace(/,/g, ''));
    } else {
      // Look for amounts at the end of the sentence (likely prices)
      const endAmountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*$/);
      if (endAmountMatch) {
        amount = parseFloat(endAmountMatch[1].replace(/,/g, ''));
      } else {
        // Fall back to any number, but prefer larger ones (likely prices over quantities)
        const allNumbers = text.match(/\d+(?:,\d{3})*(?:\.\d{2})?/g);
        if (allNumbers) {
          const numbers = allNumbers.map(n => parseFloat(n.replace(/,/g, '')));
          // Use the largest number (likely the price rather than quantity)
          amount = Math.max(...numbers);
        }
      }
    }
  }
  
  // Extract date
  let date = '';
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                 'july', 'august', 'september', 'october', 'november', 'december'];
  const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // Handle "today", "yesterday"
  const today = new Date();
  if (text.includes('today')) {
    date = today.toISOString().split('T')[0];
  } else if (text.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    date = yesterday.toISOString().split('T')[0];
  } else {
    // Try various date patterns
    const datePatterns = [
      /(\w+)\s+(\d{1,2}),?\s*(\d{4})?/,  // "February 1, 2024" or "February 1"
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,  // "2/1/24" or "2/1/2024"
      /(\d{1,2})-(\d{1,2})-(\d{2,4})/,   // "2-1-24"
      /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/  // "February 1st"
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern === datePatterns[0] || pattern === datePatterns[3]) {
          // Month name format
          const monthName = match[1].toLowerCase();
          const monthIndex = months.findIndex(m => m.startsWith(monthName)) || 
                           shortMonths.findIndex(m => m.startsWith(monthName));
          if (monthIndex >= 0) {
            const month = String(monthIndex + 1).padStart(2, '0');
            const day = String(match[2]).padStart(2, '0');
            const year = match[3] || currentYear;
            date = `${year}-${month}-${day}`;
          }
        } else {
          // Numeric format
          const month = String(match[1]).padStart(2, '0');
          const day = String(match[2]).padStart(2, '0');
          let year = match[3];
          if (year && year.length === 2) year = '20' + year;
          if (!year) year = currentYear.toString();
          date = `${year}-${month}-${day}`;
        }
        break;
      }
    }
  }
  
  // Enhanced auto-categorization using scoring system
  let category = matchCategory(text, type === 'income');
  
  // Provide smart fallbacks if no category was detected
  if (!category) {
    if (type === 'income') {
      // For income, try to be more specific based on context
      if (text.includes('weed') || text.includes('weeds')) {
        category = 'Sales of livestock, produce, grains, and other products you raised';
      } else {
        category = 'Other income';
      }
    } else {
      category = 'Other expenses';
    }
  }
  
  // Generate description
  let description = input.trim();
  
  return {
    date: date || new Date().toISOString().split('T')[0],
    type: type as 'income' | 'expense',
    category,
    description,
    amount,
    method: 'cash' as const
  };
}