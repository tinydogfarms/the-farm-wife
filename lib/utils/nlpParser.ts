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
    // Try various date patterns. Numeric formats are tried first since they're
    // unambiguous. The month-name pattern matches only actual month words (not \w+)
    // — a generic "<word> <1-2 digits>" pattern false-matches unrelated text, e.g.
    // "sold 50 head..." or "bought 500lbs..." both read as a month name + day.
    const monthNameAlternation = [...months, ...shortMonths].join('|');
    const datePatterns: Array<{ regex: RegExp; kind: 'numeric' | 'month' }> = [
      { regex: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/, kind: 'numeric' },  // "8/1" or "8/1/2024"
      { regex: /(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?/, kind: 'numeric' },   // "8-1" or "8-1-2024"
      { regex: new RegExp(`\\b(${monthNameAlternation})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?`), kind: 'month' }  // "February 1, 2024" or "Feb 1st"
    ];

    for (const { regex, kind } of datePatterns) {
      const match = text.match(regex);
      if (!match) continue;

      let parsedDate = '';
      if (kind === 'month') {
        const monthName = match[1];
        let monthIndex = months.indexOf(monthName);
        if (monthIndex < 0) monthIndex = shortMonths.indexOf(monthName);
        if (monthIndex >= 0) {
          const month = String(monthIndex + 1).padStart(2, '0');
          const day = String(match[2]).padStart(2, '0');
          const year = match[3] || currentYear;
          parsedDate = `${year}-${month}-${day}`;
        }
      } else {
        const month = String(match[1]).padStart(2, '0');
        const day = String(match[2]).padStart(2, '0');
        let year = match[3];
        if (year && year.length === 2) year = '20' + year;
        if (!year) year = currentYear.toString();
        parsedDate = `${year}-${month}-${day}`;
      }

      // Only stop searching once a pattern actually produced a usable date —
      // a matched-but-unparseable pattern (e.g. an invalid month name) must not
      // block later, more specific patterns from being tried.
      if (parsedDate) {
        date = parsedDate;
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
  
  // Generate description — prefer an extracted quantity phrase (e.g. "500lbs of feed")
  // over the full raw sentence, which is redundant once type/date/amount/category are
  // already parsed out separately.
  const quantityMatch = input.match(
    /\b(\d+(?:\.\d+)?\s*(?:lbs?|pounds?|tons?|tonnes?|bags?|bales?|gal(?:lons?)?|bu(?:shels?)?|acres?|head|boxes?|crates?|bundles?|rolls?|dozen|units?))\s+(?:of\s+)?(\w+)/i
  );
  let description = quantityMatch ? quantityMatch[0].trim() : input.trim();
  
  return {
    date: date || new Date().toISOString().split('T')[0],
    type: type as 'income' | 'expense',
    category,
    description,
    amount,
    method: 'cash' as const
  };
}