const fs = require('fs');
const oldDeck = JSON.parse(fs.readFileSync('src/data/cards.servico-social-estreia.json'));
const newCats = JSON.parse(fs.readFileSync('src/data/categories.json'));

const newWords = new Set();
for (const cat of newCats.categories) {
  for (const word of cat.palavras) {
    newWords.add(word.toLowerCase());
  }
}

const missing = [];
for (const card of oldDeck.cards) {
  if (!newWords.has(card.title.toLowerCase())) {
    missing.push(card.title);
  }
}

console.log(`Missing cards: ${missing.length}`);
if (missing.length > 0) {
  console.log(missing.slice(0, 10));
}
