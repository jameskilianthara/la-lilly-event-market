/**
 * Date Parser Utility for EventFoundry
 * Converts human-readable date formats to SQL-compatible date strings
 */

/**
 * Parses various human-readable date formats into SQL date format (YYYY-MM-DD)
 *
 * Supported formats:
 * - "December 2025" → "2025-12-01"
 * - "Dec 2025" → "2025-12-01"
 * - "12/2025" → "2025-12-01"
 * - "2025-12" → "2025-12-01"
 * - "June 15, 2025" → "2025-06-15"
 * - "2025-06-15" → "2025-06-15" (already correct)
 *
 * @param humanDate - Human-readable date string
 * @returns SQL-compatible date string (YYYY-MM-DD)
 */
export function parseEventDate(humanDate: string | null | undefined): string {
  // If no date provided, return first day of next month
  if (!humanDate || humanDate.trim() === '') {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  }

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const shortMonths = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];

  try {
    const trimmed = humanDate.trim();

    // Case 1: Already in SQL format "YYYY-MM-DD"
    const sqlPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (sqlPattern.test(trimmed)) {
      return trimmed;
    }

    // Case 2: ISO format "YYYY-MM"
    const isoMonthPattern = /^\d{4}-\d{2}$/;
    if (isoMonthPattern.test(trimmed)) {
      return `${trimmed}-01`;
    }

    // Case 3: "Month Year" format (e.g., "December 2025" or "Dec 2025")
    const parts = trimmed.toLowerCase().split(/[\s,]+/).filter(p => p);

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const year = parseInt(lastPart);

      // Check if last part is a valid year
      if (!isNaN(year) && year >= 2020 && year <= 2100) {
        // Look for month in the parts
        for (const part of parts) {
          const monthIndex = monthNames.indexOf(part) !== -1
            ? monthNames.indexOf(part) + 1
            : shortMonths.indexOf(part) !== -1
            ? shortMonths.indexOf(part) + 1
            : 0;

          if (monthIndex > 0) {
            const month = monthIndex.toString().padStart(2, '0');

            // Check if there's a day number
            const dayMatch = parts.find(p => /^\d{1,2}$/.test(p) && parseInt(p) >= 1 && parseInt(p) <= 31);
            const day = dayMatch ? parseInt(dayMatch).toString().padStart(2, '0') : '01';

            return `${year}-${month}-${day}`;
          }
        }
      }
    }

    // Case 4: "MM/YYYY" or "M/YYYY" format
    const slashPattern = /^(\d{1,2})\/(\d{4})$/;
    const slashMatch = trimmed.match(slashPattern);
    if (slashMatch) {
      const month = slashMatch[1].padStart(2, '0');
      const year = slashMatch[2];
      return `${year}-${month}-01`;
    }

    // Case 5: Try native Date parsing as last resort
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Fallback: Return first day of next month
    console.warn(`Unable to parse date: "${humanDate}". Using next month as fallback.`);
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];

  } catch (error) {
    console.error('Date parsing error:', error, 'Input:', humanDate);

    // Return first day of next month as ultimate fallback
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  }
}

/**
 * Validates if a date string is in proper SQL format
 * @param dateStr - Date string to validate
 * @returns true if valid SQL date format (YYYY-MM-DD)
 */
export function isValidSQLDate(dateStr: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(dateStr)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Formats a SQL date for display
 * @param sqlDate - SQL date string (YYYY-MM-DD)
 * @returns Human-readable format (e.g., "December 2025")
 */
export function formatDateForDisplay(sqlDate: string | null | undefined): string {
  if (!sqlDate) return 'Date TBD';

  try {
    const date = new Date(sqlDate);
    if (isNaN(date.getTime())) return 'Date TBD';

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const day = date.getDate();

    // If it's the first day of the month, just show month and year
    if (day === 1) {
      return `${month} ${year}`;
    }

    return `${month} ${day}, ${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Date TBD';
  }
}
