/**
 * Input Sanitization Utilities
 *
 * These utilities help prevent XSS attacks and injection vulnerabilities
 * by sanitizing user input before storing or displaying it.
 */

/**
 * HTML entities that need to be escaped to prevent XSS
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char]);
};

/**
 * Removes HTML tags from a string
 * @param {string} str - The string to strip
 * @returns {string} - The stripped string
 */
export const stripHtmlTags = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '');
};

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  // Remove null bytes
  let sanitized = str.replace(/\0/g, '');
  // Strip HTML tags
  sanitized = stripHtmlTags(sanitized);
  // Escape remaining HTML entities
  sanitized = escapeHtml(sanitized);
  // Trim whitespace
  sanitized = sanitized.trim();
  return sanitized;
};

/**
 * Sanitizes an email address
 * @param {string} email - The email to sanitize
 * @returns {string} - The sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }
  // Remove any characters that aren't valid in emails
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._%+-@]/gi, '');
};

/**
 * Sanitizes a number input
 * @param {string|number} value - The value to sanitize
 * @param {object} options - Options for sanitization
 * @param {number} options.min - Minimum allowed value
 * @param {number} options.max - Maximum allowed value
 * @param {number} options.defaultValue - Default value if invalid
 * @returns {number} - The sanitized number
 */
export const sanitizeNumber = (value, options = {}) => {
  const { min = -Infinity, max = Infinity, defaultValue = 0 } = options;

  const num = parseFloat(value);

  if (isNaN(num)) {
    return defaultValue;
  }

  return Math.min(Math.max(num, min), max);
};

/**
 * Sanitizes an integer input
 * @param {string|number} value - The value to sanitize
 * @param {object} options - Options for sanitization
 * @returns {number} - The sanitized integer
 */
export const sanitizeInteger = (value, options = {}) => {
  return Math.floor(sanitizeNumber(value, options));
};

/**
 * Sanitizes customer feedback
 * @param {object} feedback - The feedback data
 * @returns {object} - The sanitized feedback
 */
export const sanitizeFeedback = (feedback) => {
  return {
    rating: sanitizeInteger(feedback.rating, { min: 1, max: 5, defaultValue: 5 }),
    comment: sanitizeString(feedback.comment || '').substring(0, 1000),
  };
};

export default {
  escapeHtml,
  stripHtmlTags,
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeFeedback,
};
