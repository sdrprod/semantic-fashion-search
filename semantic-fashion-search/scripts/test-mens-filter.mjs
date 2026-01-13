#!/usr/bin/env node

/**
 * Test Men's Product Filter Logic
 * Validates that the filter doesn't have false positives
 */

function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function isMensProductOLD(title, description) {
  const mensTerms = [
    "men's", 'mens', "mens'", 'for men', 'for him', 'men only',
    'male', 'masculine', 'man ', 'gentleman', "gentleman's",
    'boys', "boy's", 'men ', 'menswear', 'mens pants', 'mens shirt',
    'mens jacket', 'mens suit', 'mens shoe', 'mens wear'
  ];

  const decodedTitle = decodeHtmlEntities(title);
  const decodedDescription = decodeHtmlEntities(description || '');
  const combinedText = `${decodedTitle} ${decodedDescription}`.toLowerCase();

  return mensTerms.some(term => combinedText.includes(term));
}

function isMensProductNEW(title, description) {
  const decodedTitle = decodeHtmlEntities(title);
  const decodedDescription = decodeHtmlEntities(description || '');
  const combinedText = `${decodedTitle} ${decodedDescription}`.toLowerCase();

  // Use word boundaries to avoid false positives like "womens" matching "mens"
  const mensPatterns = [
    /\bmen'?s\b/,           // "men's" or "mens" as whole word
    /\bfor men\b/,
    /\bfor him\b/,
    /\bmen only\b/,
    /\bmale\b/,
    /\bmasculine\b/,
    /\bgentleman'?s?\b/,    // "gentleman" or "gentleman's"
    /\bboys?\b/,            // "boy" or "boys"
    /\bboy'?s\b/,           // "boy's"
    /\bmenswear\b/,
  ];

  // Check if text contains "women" or "woman" - if so, be more strict
  const hasWomen = /\bwom[ae]n'?s?\b/.test(combinedText);

  if (hasWomen) {
    // If it mentions women, only flag if it ALSO explicitly mentions men
    // and men appears more prominently
    const menMatches = (combinedText.match(/\bmen'?s?\b/g) || []).length;
    const womenMatches = (combinedText.match(/\bwom[ae]n'?s?\b/g) || []).length;

    // Only flag as men's if men is mentioned more than women
    if (menMatches <= womenMatches) {
      return false;
    }
  }

  return mensPatterns.some(pattern => pattern.test(combinedText));
}

// Test cases
const testCases = [
  // Should be flagged as MEN'S
  { title: "Men's Classic Suit", expected: true },
  { title: "Designer Shoes for Men", expected: true },
  { title: "Gentleman's Dress Shirt", expected: true },
  { title: "Boys Basketball Sneakers", expected: true },
  { title: "Masculine Cologne Set", expected: true },

  // Should NOT be flagged (WOMEN'S products)
  { title: "2025 Luxurys Brands shoulder Bags Women Embossing bag", expected: false },
  { title: "Designer totes women handbags small tote bags for girls", expected: false },
  { title: "Women's Summer Dress", expected: false },
  { title: "Womens Fashion Jewelry", expected: false },
  { title: "Handbag for Women and Girls", expected: false },

  // Edge cases
  { title: "Unisex Watch for Men and Women", expected: false }, // Mixed - women mentioned
  { title: "MULTI POCHETTE ACCESSORIES chain purse Designer bags Womens mens", expected: false }, // Both mentioned, womens first
];

console.log('🧪 Testing Men\'s Product Filter\n');
console.log('=' .repeat(80));

let oldCorrect = 0;
let newCorrect = 0;

testCases.forEach((test, i) => {
  const oldResult = isMensProductOLD(test.title, '');
  const newResult = isMensProductNEW(test.title, '');

  const oldMatch = oldResult === test.expected ? '✅' : '❌';
  const newMatch = newResult === test.expected ? '✅' : '❌';

  if (oldResult === test.expected) oldCorrect++;
  if (newResult === test.expected) newCorrect++;

  console.log(`\nTest ${i + 1}: "${test.title}"`);
  console.log(`  Expected: ${test.expected ? 'MEN\'S' : 'NOT MEN\'S'}`);
  console.log(`  OLD filter: ${oldResult ? 'MEN\'S' : 'NOT MEN\'S'} ${oldMatch}`);
  console.log(`  NEW filter: ${newResult ? 'MEN\'S' : 'NOT MEN\'S'} ${newMatch}`);
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 RESULTS:`);
console.log(`   OLD filter: ${oldCorrect}/${testCases.length} correct (${(oldCorrect/testCases.length*100).toFixed(1)}%)`);
console.log(`   NEW filter: ${newCorrect}/${testCases.length} correct (${(newCorrect/testCases.length*100).toFixed(1)}%)`);
console.log();
