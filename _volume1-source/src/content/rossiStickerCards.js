const card = (id, title, rarity, slot, motif, colors) => Object.freeze({
  id,
  title,
  rarity,
  slot,
  motif,
  colors,
  asset: null,
  weight: rarity === 'common' ? 5 : rarity === 'uncommon' ? 2.5 : 1,
});

// Placeholder artwork is deliberately data-driven: replacing `asset` with the
// future final illustration is enough; album and pack behaviour do not change.
export const rossiStickerCards = Object.freeze([
  card('portinaio-keys', 'Le chiavi del portinaio', 'common', 0, 'keys', ['#e9c778', '#6e8b94']),
  card('elevator-break', 'Ascensore in pausa', 'common', 1, 'elevator', ['#b7cfcc', '#c4674c']),
  card('landing-cat', 'Gatto sul pianerottolo', 'common', 2, 'cat', ['#a97f8f', '#f4e7d3']),
  card('lost-slippers', 'Ciabatte smarrite', 'common', 3, 'home', ['#7fa37a', '#e9c778']),
  card('maria-biscuits', 'I biscotti di Maria', 'common', 4, 'kitchen', ['#d9a654', '#dc5454']),
  card('night-intercom', 'Citofono notturno', 'common', 5, 'building', ['#6e8b94', '#ece4cc']),
  card('stubborn-plant', 'La pianta resistente', 'common', 6, 'plant', ['#7fa37a', '#f4e7d3']),
  card('single-sock', 'Calzino solitario', 'common', 7, 'home', ['#c4674c', '#b7cfcc']),
  card('chipped-cup', 'Tazza scheggiata', 'common', 8, 'kitchen', ['#f4e7d3', '#a97f8f']),
  card('neighbors-parcel', 'Il pacco del vicino', 'common', 9, 'box', ['#c89b66', '#dc5454']),
  card('stair-light', 'Lampadina del vano scale', 'common', 10, 'light', ['#e9c778', '#6e8b94']),
  card('wet-umbrella', 'Ombrello bagnato', 'common', 11, 'home', ['#6e8b94', '#b7cfcc']),
  card('box-eight', 'Scatolone numero 8', 'common', 12, 'box', ['#b98a52', '#f4e7d3']),
  card('doorbell', 'Driiin!', 'common', 13, 'building', ['#dc5454', '#e9c778']),
  card('seven-oclock-moka', 'La moka delle sette', 'common', 14, 'kitchen', ['#7a7068', '#f4e7d3']),
  card('mystery-bill', 'Bolletta misteriosa', 'common', 15, 'paper', ['#f4e7d3', '#c4674c']),
  card('indiscreet-mirror', 'Specchio indiscreto', 'uncommon', 16, 'mirror', ['#b7cfcc', '#a97f8f']),
  card('stained-recipe', 'Ricettario macchiato', 'uncommon', 17, 'paper', ['#e9c778', '#dc5454']),
  card('red-marker', 'Pennarello rosso', 'uncommon', 18, 'marker', ['#dc5454', '#f4e7d3']),
  card('crooked-album', 'Album sul tappeto', 'uncommon', 19, 'paper', ['#c4674c', '#e9c778']),
  card('arturo-ghost', 'Arturo il fantasma', 'uncommon', 20, 'ghost', ['#6e8b94', '#ece4cc']),
  card('jannel-cat', 'La gatta di Jannel', 'uncommon', 21, 'cat', ['#2a211c', '#a97f8f']),
  card('rooftop-moon', 'Luna sul tetto', 'uncommon', 22, 'sky', ['#526079', '#ece4cc']),
  card('living-board', 'La bacheca viva', 'uncommon', 23, 'paper', ['#c89b66', '#e9c778']),
  card('unlikely-flyer', 'Volantino improbabile', 'uncommon', 24, 'paper', ['#dc5454', '#6e8b94']),
  card('arturo-dog', 'Il cane di Arturo', 'uncommon', 25, 'dog', ['#b98a52', '#7fa37a']),
  card('basement-key', 'Chiave della cantina', 'rare', 26, 'keys', ['#2a211c', '#d9a654']),
  card('sun-behind-building', 'Sole dietro il palazzo', 'rare', 27, 'sky', ['#e78267', '#526079']),
  card('perfect-neighbor', 'Il vicino perfetto', 'rare', 28, 'person', ['#7fa37a', '#e9c778']),
  card('midnight-building', 'Condominio di mezzanotte', 'rare', 29, 'building', ['#39414f', '#f7d489']),
  card('volume-one', 'Conventional · Volume Uno', 'rare', 30, 'star', ['#dc5454', '#fff7e5']),
  card('secret-elevator', 'L’ascensore segreto', 'rare', 31, 'elevator', ['#a97f8f', '#d9a654']),
]);

export const rossiStickerRarityLabels = Object.freeze({
  common: 'Comune',
  uncommon: 'Non comune',
  rare: 'Rara',
});

export function drawStickerPack(cards = rossiStickerCards, rng = Math.random, size = 5) {
  const pool = cards.filter((item) => Number(item.weight) > 0);
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  if (!pool.length || totalWeight <= 0) return [];
  return Array.from({ length: size }, () => {
    let cursor = Math.min(.999999999, Math.max(0, Number(rng()) || 0)) * totalWeight;
    for (const item of pool) {
      cursor -= item.weight;
      if (cursor < 0) return item;
    }
    return pool.at(-1);
  });
}

export function applyStickerPack(owned = {}, pack = []) {
  const nextOwned = { ...owned };
  const reveals = pack.map((item) => {
    const previousCount = Number(nextOwned[item.id] || 0);
    nextOwned[item.id] = previousCount + 1;
    return { card: item, isNew: previousCount === 0, copies: previousCount + 1 };
  });
  return { owned: nextOwned, reveals };
}
