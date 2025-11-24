/**
 * Test Script for Date Parser
 * Run with: node test-date-parser.js
 */

// Simplified version of parseEventDate for testing
function parseEventDate(humanDate) {
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

      if (!isNaN(year) && year >= 2020 && year <= 2100) {
        for (const part of parts) {
          const monthIndex = monthNames.indexOf(part) !== -1
            ? monthNames.indexOf(part) + 1
            : shortMonths.indexOf(part) !== -1
            ? shortMonths.indexOf(part) + 1
            : 0;

          if (monthIndex > 0) {
            const month = monthIndex.toString().padStart(2, '0');
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

    // Case 5: Try native Date parsing
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    console.warn(`Unable to parse date: "${humanDate}". Using next month as fallback.`);
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];

  } catch (error) {
    console.error('Date parsing error:', error, 'Input:', humanDate);
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  }
}

// Test cases
const testCases = [
  { input: 'December 2025', expected: '2025-12-01', description: 'Full month name with year' },
  { input: 'Dec 2025', expected: '2025-12-01', description: 'Short month name with year' },
  { input: 'June 15, 2025', expected: '2025-06-15', description: 'Month, day, year' },
  { input: '12/2025', expected: '2025-12-01', description: 'MM/YYYY format' },
  { input: '6/2025', expected: '2025-06-01', description: 'M/YYYY format' },
  { input: '2025-12', expected: '2025-12-01', description: 'ISO month format' },
  { input: '2025-12-25', expected: '2025-12-25', description: 'Already SQL format' },
  { input: 'January 2025', expected: '2025-01-01', description: 'January with year' },
  { input: 'Summer 2025', expected: null, description: 'Season (should fallback)' }, // Will use fallback
  { input: 'Wedding in June 2025', expected: '2025-06-01', description: 'Text with month and year' },
  { input: '', expected: null, description: 'Empty string (should fallback)' },
  { input: 'March 2025', expected: '2025-03-01', description: 'March with year' },
];

console.log('🧪 DATE PARSER TEST SUITE\n');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  const result = parseEventDate(test.input);
  const passed = test.expected === null ? result.match(/^\d{4}-\d{2}-\d{2}$/) : result === test.expected;

  console.log(`\nTest ${index + 1}: ${test.description}`);
  console.log(`  Input: "${test.input}"`);
  console.log(`  Expected: ${test.expected || 'Valid SQL date (fallback)'}`);
  console.log(`  Result: ${result}`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  if (passed) passCount++;
  else failCount++;
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 RESULTS: ${passCount} passed, ${failCount} failed out of ${passCount + failCount} tests\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED! Date parser is working correctly.\n');
} else {
  console.log('⚠️ SOME TESTS FAILED. Review the parsing logic.\n');
  process.exit(1);
}
