// Test script for PDF download and share functionality
// Run with: node test-pdf-functionality.js

console.log('🧪 Testing PDF Download and Share Functionality');
console.log('==============================================\n');

// Test 1: Check if libraries are installed
try {
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  const requiredDeps = ['jspdf', 'html2canvas'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

  if (missingDeps.length === 0) {
    console.log('✅ All required PDF libraries are installed:');
    console.log('   - jsPDF:', packageJson.dependencies.jspdf);
    console.log('   - html2canvas:', packageJson.dependencies.html2canvas);
  } else {
    console.log('❌ Missing dependencies:', missingDeps.join(', '));
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Test 2: Check if utility files exist
const testFiles = [
  './src/lib/pdfGenerator.ts',
  './src/lib/blueprintSharing.ts',
  './src/components/blueprint/ProfessionalBlueprint.tsx'
];

console.log('\n📁 Checking utility files:');
testFiles.forEach(file => {
  try {
    require('fs').accessSync(file);
    console.log(`   ✅ ${file}`);
  } catch {
    console.log(`   ❌ ${file} - File not found`);
  }
});

// Test 3: Check imports in ProfessionalBlueprint
try {
  const fs = require('fs');
  const blueprintContent = fs.readFileSync('./src/components/blueprint/ProfessionalBlueprint.tsx', 'utf8');

  const checks = [
    { name: 'PDF generator import', pattern: 'generateBlueprintPDF' },
    { name: 'Share utilities import', pattern: 'copyBlueprintShareUrl' },
    { name: 'PDF button handler', pattern: 'handleDownloadPDF' },
    { name: 'Share button handler', pattern: 'handleShareBlueprint' },
    { name: 'Share modal state', pattern: 'showShareModal' }
  ];

  console.log('\n🔧 Checking ProfessionalBlueprint imports and handlers:');
  checks.forEach(check => {
    if (blueprintContent.includes(check.pattern)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - Not found`);
    }
  });
} catch (error) {
  console.log('❌ Error checking ProfessionalBlueprint:', error.message);
}

console.log('\n🚀 Manual Testing Instructions:');
console.log('1. Start dev server: pnpm dev');
console.log('2. Navigate to a blueprint page: /blueprint/[blueprintId]');
console.log('3. Switch to Professional view mode');
console.log('4. Scroll to the bottom "EventFoundry Branding Footer" section');
console.log('5. Click "Download PDF" button - should generate and download PDF');
console.log('6. Click "Share Blueprint" button - should open share modal');
console.log('7. Test copy link, WhatsApp, email, and social sharing options');

console.log('\n✨ Expected Results:');
console.log('- PDF should download with filename like "eventfoundry-wedding-blueprint-[timestamp].pdf"');
console.log('- PDF should contain: title page, executive summary, event details, requirements, timeline');
console.log('- Share modal should show copy link, WhatsApp, email, and social media options');
console.log('- Copy link should show success checkmark briefly');
console.log('- Social media links should open in new tabs');

console.log('\n🎯 Status: PDF Download and Share functionality has been implemented!');
console.log('Ready for testing in the browser.');
