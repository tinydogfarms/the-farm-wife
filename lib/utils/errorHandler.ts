import type { PostgrestError } from '@supabase/supabase-js';

// Database constraints for better error messages
const DB_CONSTRAINTS = {
  MAX_AMOUNT: 999999999.99, // Typical PostgreSQL numeric constraint
  MAX_STRING_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

export function getReadableError(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle PostgrestError from Supabase
  if (error && typeof error === 'object' && 'message' in error) {
    const pgError = error as PostgrestError;
    const message = pgError.message || '';
    const code = pgError.code || '';
    const details = pgError.details || '';
    
    // Handle specific database constraint violations
    if (message.includes('numeric field overflow') || 
        message.includes('value out of range') ||
        code === '22003') {
      return `Amount is too large. Please enter an amount less than $${DB_CONSTRAINTS.MAX_AMOUNT.toLocaleString()}.`;
    }
    
    if (message.includes('value too long') ||
        message.includes('string too long') ||
        code === '22001') {
      if (details.includes('description')) {
        return `Description is too long. Please limit to ${DB_CONSTRAINTS.MAX_DESCRIPTION_LENGTH} characters.`;
      }
      if (details.includes('category')) {
        return `Category name is too long. Please limit to ${DB_CONSTRAINTS.MAX_STRING_LENGTH} characters.`;
      }
      return `Text is too long. Please shorten your input.`;
    }
    
    if (message.includes('duplicate key') ||
        message.includes('violates unique constraint') ||
        code === '23505') {
      return 'A similar transaction already exists. Please check for duplicates.';
    }
    
    if (message.includes('foreign key') ||
        message.includes('violates foreign key constraint') ||
        code === '23503') {
      return 'Invalid reference. Please refresh the page and try again.';
    }
    
    if (message.includes('not null') ||
        message.includes('violates not-null constraint') ||
        code === '23502') {
      return 'All required fields must be filled out.';
    }
    
    if (message.includes('invalid input syntax') ||
        code === '22P02') {
      return 'Invalid data format. Please check your input and try again.';
    }
    
    if (message.includes('permission denied') ||
        message.includes('insufficient privilege') ||
        code === '42501') {
      return 'You do not have permission to perform this action.';
    }
    
    // Network/connection errors
    if (message.includes('network') || 
        message.includes('connection') ||
        message.includes('timeout')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Authentication errors
    if (message.includes('JWT') || 
        message.includes('authentication') ||
        message.includes('unauthorized')) {
      return 'Your session has expired. Please sign out and sign in again.';
    }
    
    // Return the original message if we can't improve it
    return message;
  }
  
  // Handle generic Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Last resort
  return 'An unexpected error occurred. Please try again.';
}

// Validation function to catch errors before they reach the database
export function validateTransaction(transaction: {
  amount: number;
  description: string;
  category: string;
  date: string;
}): string | null {
  // Validate amount
  if (transaction.amount <= 0) {
    return 'Amount must be greater than zero.';
  }
  
  if (transaction.amount > DB_CONSTRAINTS.MAX_AMOUNT) {
    return `Amount is too large. Please enter an amount less than $${DB_CONSTRAINTS.MAX_AMOUNT.toLocaleString()}.`;
  }
  
  // Check for unreasonably large amounts (likely user error)
  if (transaction.amount > 10000000) { // $10M
    return 'This amount seems unusually large. Please double-check your entry.';
  }
  
  // Validate description length
  if (transaction.description.length > DB_CONSTRAINTS.MAX_DESCRIPTION_LENGTH) {
    return `Description is too long. Please limit to ${DB_CONSTRAINTS.MAX_DESCRIPTION_LENGTH} characters.`;
  }
  
  // Validate required fields
  if (!transaction.description.trim()) {
    return 'Description is required.';
  }
  
  if (!transaction.category.trim()) {
    return 'Category is required.';
  }
  
  if (!transaction.date) {
    return 'Date is required.';
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(transaction.date)) {
    return 'Please enter a valid date in YYYY-MM-DD format.';
  }
  
  // Validate date is not in the future (with some tolerance)
  const transactionDate = new Date(transaction.date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (transactionDate > tomorrow) {
    return 'Transaction date cannot be in the future.';
  }
  
  return null; // No validation errors
}