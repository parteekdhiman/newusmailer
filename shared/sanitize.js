/**
 * Sanitization utilities for preventing XSS and HTML injection attacks
 * Uses built-in HTML entity encoding - NO external dependencies required
 */

/**
 * Escape HTML special characters to prevent XSS in email templates
 * Safe for use in email HTML content
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'\/]/g, (char) => map[char]);
};

/**
 * Validate and normalize email addresses
 * Returns null if invalid, normalized email if valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation: must be between 5-254 chars and match pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (trimmed.length < 5 || trimmed.length > 254 || !emailRegex.test(trimmed)) {
    return null;
  }
  
  return trimmed;
};

/**
 * Validate phone numbers (basic international format)
 * Returns null if invalid, normalized phone if valid
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  
  // Keep only digits, spaces, +, -, and parentheses
  const cleaned = phone.replace(/[^\d\s+\-()]/g, '');
  
  // Must have at least 7 digits, at most 20 characters
  const digitCount = cleaned.replace(/\D/g, '').length;
  
  if (digitCount < 7 || cleaned.length > 20) {
    return null;
  }
  
  return cleaned.trim();
};

/**
 * Validate and truncate text fields
 * Prevents oversized payloads and obvious spam
 */
export const validateTextField = (text, minLength = 1, maxLength = 5000) => {
  if (!text || typeof text !== 'string') return null;
  
  const trimmed = text.trim();
  
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return null;
  }
  
  return trimmed;
};

/**
 * Validate name fields (alphanumeric + spaces + common punctuation)
 * Returns null if invalid, sanitized name if valid
 */
export const validateName = (name, minLength = 2, maxLength = 100) => {
  if (!name || typeof name !== 'string') return null;
  
  const trimmed = name.trim();
  
  // Allow letters, numbers, spaces, hyphens, apostrophes
  const nameRegex = /^[\p{L}\p{N}\s\-']+$/u;
  
  if (trimmed.length < minLength || trimmed.length > maxLength || !nameRegex.test(trimmed)) {
    return null;
  }
  
  return trimmed;
};
