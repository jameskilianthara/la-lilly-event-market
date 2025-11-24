/**
 * Test Script for Checklist Mapping - Strategic Updates
 * Run with: node test-checklist-mapping.js
 */

// Mapping table (copied from checklistMapper.ts)
const CHECKLIST_MAPPING = {
  'wedding': ['wedding', 'marriage', 'nikah', 'shaadi', 'matrimony', 'reception', 'vivah', 'sangeet', 'mehendi', 'mehndi'],
  'engagement': ['engagement', 'ring ceremony', 'roka', 'sagai', 'betrothal'],
  'party': ['birthday', 'party', 'celebration', 'anniversary', 'milestone', 'theme party', 'college fest', 'fest'],
  'employee-engagement': ['corporate workshop', 'team workshop', 'corporate event', 'employee', 'team building', 'dealer meet', 'partner meet', 'training', 'town hall', 'annual day', 'offsite'],
  'conference': ['public workshop', 'public speaking workshop', 'conference', 'business seminar', 'meeting', 'seminar', 'symposium', 'business conference', 'workshop'],
  'exhibition': ['exhibition', 'expo', 'trade show', 'showcase', 'fair', 'display'],
  'film-events': ['film', 'movie', 'cinema', 'muhurat', 'trailer launch', 'music launch', 'premiere', 'celebrity'],
  'press-conference': ['product launch media', 'product launch with media', 'press conference', 'media event', 'press meet', 'media briefing', 'announcement', 'press release'],
  'promotional-activities': ['promotion', 'promotional', 'road show', 'brand activation', 'marketing campaign', 'street marketing', 'mall activation'],
  'inauguration': ['showroom opening', 'grand opening', 'ribbon cutting', 'business pooja', 'pooja ceremony', 'inauguration', 'opening', 'launch'],
};

const FALLBACK_CHECKLIST = 'party';

// Matching algorithm (copied from checklistMapper.ts)
function mapEventTypeToChecklist(eventType) {
  if (!eventType) {
    return FALLBACK_CHECKLIST;
  }

  const normalized = eventType.toLowerCase().trim();

  let bestMatch = null;

  for (const [checklistName, keywords] of Object.entries(CHECKLIST_MAPPING)) {
    for (const keyword of keywords) {
      const matches = normalized.includes(keyword) || keyword.includes(normalized);

      if (matches) {
        const score = keyword.length;

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { checklist: checklistName, keyword, score };
        }
      }
    }
  }

  if (bestMatch) {
    return bestMatch.checklist;
  }

  return FALLBACK_CHECKLIST;
}

// Test cases from user requirements
const testCases = [
  {
    input: "Corporate team building workshop",
    expected: "employee-engagement",
    description: "Corporate + Team Building + Workshop should map to Employee Engagement"
  },
  {
    input: "Public speaking workshop",
    expected: "conference",
    description: "Public + Workshop should map to Conference"
  },
  {
    input: "Sangeet ceremony",
    expected: "wedding",
    description: "Sangeet (Indian wedding event) should map to Wedding"
  },
  {
    input: "New showroom Pooja and opening",
    expected: "inauguration",
    description: "Pooja + Opening should map to Inauguration"
  }
];

// Additional edge case tests
const additionalTests = [
  { input: "Corporate Event", expected: "employee-engagement" },
  { input: "Business Conference", expected: "conference" },
  { input: "Mehendi function", expected: "wedding" },
  { input: "College fest", expected: "party" },
  { input: "Dealer meet", expected: "employee-engagement" },
  { input: "Product launch with media", expected: "press-conference" },
];

console.log('🧪 TESTING CHECKLIST MAPPING - STRATEGIC UPDATES\n');
console.log('=' .repeat(80));

let passCount = 0;
let failCount = 0;

// Run primary test cases
console.log('\n📋 PRIMARY TEST CASES (User Requirements):\n');

testCases.forEach((test, index) => {
  const result = mapEventTypeToChecklist(test.input);
  const passed = result === test.expected;

  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`  Input: "${test.input}"`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Result: ${result}`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  if (passed) passCount++;
  else failCount++;
});

// Run additional tests
console.log('\n📋 ADDITIONAL EDGE CASES:\n');

additionalTests.forEach((test, index) => {
  const result = mapEventTypeToChecklist(test.input);
  const passed = result === test.expected;

  console.log(`Edge Case ${index + 1}: "${test.input}" → ${result} (expected: ${test.expected}) ${passed ? '✅' : '❌'}`);

  if (passed) passCount++;
  else failCount++;
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 RESULTS: ${passCount} passed, ${failCount} failed out of ${passCount + failCount} tests`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED! Strategic mapping updates are working correctly.\n');
} else {
  console.log('⚠️ SOME TESTS FAILED. Review the mapping logic.\n');
  process.exit(1);
}
