const baseUrl = import.meta.env?.BASE_URL ?? '/vol1-test/';

export const artworks = Object.freeze({
  'artwork-home-player': { scene: 'home-player', file: 'helene-appel-sink-3-2024.webp', title: 'Sink (3)', year: '2024', medium: 'acrylic, watercolour, varnish and oil on linen', size: '49 × 39 cm' },
  'artwork-home-maria': { scene: 'home-maria', file: 'helene-appel-hesse-2014.webp', title: 'Hesse', year: '2014', medium: 'encaustic and oil on linen', size: '21 × 11 cm' },
  'artwork-home-paolo': { scene: 'home-paolo', file: 'helene-appel-sand-2018.webp', title: 'Sand', year: '2018', medium: 'acrylic and watercolour on linen', size: '236 × 164 cm' },
  'artwork-home-rossi': { scene: 'home-rossi', file: 'helene-appel-fusilli-2024.webp', title: 'Fusilli', year: '2024', medium: 'oil on linen', size: '34 × 22 cm' },
  'artwork-home-jannel': { scene: 'home-jannel', file: 'helene-appel-spilled-water-2018.webp', title: 'Spilled water', year: '2018', medium: 'watercolour, acrylic and oil on linen', size: '93 × 59 cm' },
});

export function artworkAsset(artwork) {
  return `${baseUrl}assets/art/${artwork.file}`;
}
