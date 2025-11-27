/**
 * Input sanitization utilities for security
 */

/**
 * Sanitizes a search term for use in SQL LIKE/ILIKE queries.
 * Escapes special characters that have meaning in LIKE patterns.
 *
 * @param term - The raw search term from user input
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized search term safe for LIKE queries
 */
export function sanitizeSearchTerm(term: string, maxLength = 100): string {
  if (!term || typeof term !== 'string') {
    return '';
  }

  return term
    .slice(0, maxLength) // Limit length to prevent DoS
    .replace(/[%_\\]/g, '\\$&'); // Escape LIKE wildcards and backslash
}

/**
 * Sanitizes a search term and wraps it for partial matching.
 * Use this when you want to search for the term anywhere in the field.
 *
 * @param term - The raw search term from user input
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized search term wrapped with % for ILIKE
 */
export function sanitizeSearchTermForILike(term: string, maxLength = 100): string {
  const sanitized = sanitizeSearchTerm(term, maxLength);
  if (!sanitized) {
    return '';
  }
  return `%${sanitized}%`;
}

/**
 * Validates and sanitizes an ID parameter.
 * Returns null if the ID is invalid.
 *
 * @param id - The ID to validate
 * @returns Sanitized ID or null if invalid
 */
export function sanitizeId(id: string | undefined): string | null {
  if (!id || typeof id !== 'string') {
    return null;
  }

  // Allow UUIDs or numeric IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numericRegex = /^\d+$/;

  if (uuidRegex.test(id) || numericRegex.test(id)) {
    return id;
  }

  return null;
}
