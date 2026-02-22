import fs from 'fs';

const data = JSON.parse(fs.readFileSync('rainforest-weighting-analysis.json', 'utf-8'));

const TOTAL = 15000;
const MIN = 50;
const PER_SEARCH = 50;

const existing = {
  'Sneakers': 680, 'Dresses': 482, 'Boots': 280, 'Pants & Jeans': 280,
  'Activewear': 260, 'Heels': 260, 'Earrings': 245, 'Handbags & Totes': 245,
  'Tops & Blouses': 245, 'Sunglasses': 244, 'Necklaces': 225, 'Outerwear': 225,
  'Sandals': 225, 'Bracelets': 210, 'Rings': 210, 'Skirts': 210,
  'Hats & Caps': 190, 'Swimwear': 190, 'Flats & Loafers': 175, 'Jewelry Sets': 175,
  'Scarves & Wraps': 155, 'Belts': 140,
};

let totalPages = 0;
for (const cat of data.categories) {
  const ratioTarget = Math.round((cat.productsPerThousand / 1000) * TOTAL);
  const target = Math.max(MIN, ratioTarget);
  const have = existing[cat.subcategory] || 0;
  const need = Math.max(0, target - have);
  const startPage = Math.max(1, Math.floor(have / PER_SEARCH) + 1);
  const pages = Math.ceil(need / PER_SEARCH);
  totalPages += pages;
  const name = cat.subcategory.padEnd(20);
  const haveStr = String(have).padStart(4);
  const targetStr = String(target).padStart(5);
  const needStr = String(need).padStart(5);
  const endPage = startPage + pages - 1;
  console.log(`${name} have:${haveStr} target:${targetStr} need:${needStr}  pages ${startPage}–${endPage} (${pages}p)`);
}
console.log('\nTotal pages (credits):', totalPages);
console.log('Budget: 200 credits');
console.log('Fit?', totalPages <= 200 ? 'YES' : `NO — over by ${totalPages - 200}`);
