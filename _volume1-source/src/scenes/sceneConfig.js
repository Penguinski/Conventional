import { mailboxConfig } from '../content/mailboxes.js';
import { externalLinks } from '../content/externalLinks.js';

const baseUrl = import.meta.env?.BASE_URL ?? '/vol1-test/';
const asset = (file) => `${baseUrl}assets/qwen/${file}`;

const action = (targetId, label, type, options = {}) => ({
  targetId,
  hitAnchor: options.hitAnchor,
  label,
  type,
  minSize: options.minSize ?? 52,
  padding: options.padding ?? 16,
  touchMinSize: options.touchMinSize,
  touchPadding: options.touchPadding,
  className: options.className ?? '',
  destination: options.destination,
  feedback: options.feedback,
  externalUrl: options.externalUrl,
});

export const sceneDefinitions = [
  {
    key: 'exterior',
    label: 'Facciata del condominio',
    asset: asset('facciata-condominio.svg'),
    backgroundAsset: `${baseUrl}assets/exterior/sfondo.svg`,
    artKey: 'facade',
    fit: 'contain',
    kind: 'exterior',
    floor: null,
    actions: [
      action('entrance-door', 'Apri il portone ed entra nell’androne', 'scene', { destination: 'lobby', minSize: 84, padding: 20, className: 'hit--exterior-door' }),
      action('intercom', 'Suona il campanello', 'bell', { minSize: 52, padding: 12, className: 'hit--intercom' }),
    ],
  },
  {
    key: 'lobby',
    label: 'Androne, piano zero',
    asset: asset('androne-condominio.svg'),
    fit: 'cover',
    floor: '0',
    actions: [
      action('entrance-door', 'Apri il portone e torna all’esterno', 'scene', { destination: 'exterior', minSize: 84, padding: 20, className: 'hit--lobby-exit' }),
      ...mailboxConfig.map((mailbox) => action(mailbox.id, `Apri la cassetta postale di ${mailbox.resident}`, 'feedback', {
        feedback: mailbox.id,
        minSize: 34,
        padding: 3,
        touchMinSize: 30,
        touchPadding: 1,
        className: `hit--mailbox hit--${mailbox.id}`,
      })),
      action('bulletin-board', 'Apri la bacheca condominiale', 'feedback', { feedback: 'board', minSize: 64, padding: 12, className: 'hit--board' }),
      action('elevator', 'Entra nell’ascensore', 'elevator', { minSize: 92, padding: 20, className: 'hit--lobby-elevator' }),
    ],
  },
  {
    key: 'elevator',
    label: 'Interno dell’ascensore',
    asset: asset('ascensore-interno.svg'),
    fit: 'cover',
    floor: null,
    actions: [
      action('elevator-doors', 'Torna al piano corrente', 'leave-elevator', { minSize: 100, padding: 20, className: 'hit--elevator-door' }),
      action('button-panel', 'Avvicinati alla pulsantiera', 'focus-elevator-panel', { minSize: 72, padding: 10, touchMinSize: 64, touchPadding: 8, className: 'hit--elevator-panel-focus' }),
      action('button-c', 'Vai alla cantina', 'elevator-destination', { destination: 'basement', minSize: 58, padding: 14, touchMinSize: 46, touchPadding: 0, className: 'hit--elevator-floor' }),
      action('button-0', 'Vai al piano zero', 'elevator-destination', { destination: 'lobby', minSize: 58, padding: 14, touchMinSize: 46, touchPadding: 0, className: 'hit--elevator-floor' }),
      action('button-1', 'Vai al piano uno', 'elevator-destination', { destination: 'landing-1', minSize: 58, padding: 14, touchMinSize: 46, touchPadding: 0, className: 'hit--elevator-floor' }),
      action('button-2', 'Vai al piano due', 'elevator-destination', { destination: 'landing-2', minSize: 58, padding: 14, touchMinSize: 46, touchPadding: 0, className: 'hit--elevator-floor' }),
      action('button-3', 'Vai al piano tre', 'elevator-destination', { destination: 'landing-3', minSize: 58, padding: 14, touchMinSize: 46, touchPadding: 0, className: 'hit--elevator-floor' }),
      action('button-alarm', 'Premi il campanello di allarme', 'feedback', { feedback: 'alarm', minSize: 52, padding: 12, touchMinSize: 46, touchPadding: 0, className: 'hit--elevator-alarm' }),
      action('mirror', 'Scopri perché gli ascensori hanno uno specchio', 'elevator-mirror-fact', { minSize: 64, padding: 12, className: 'hit--elevator-mirror' }),
      action('notice-frame', 'Prova il gioco delle distanze in ascensore', 'elevator-social-game', { minSize: 58, padding: 8, className: 'hit--elevator-social' }),
    ],
  },
  {
    key: 'landing-1',
    label: 'Pianerottolo, piano uno',
    asset: asset('pianerottolo-1.svg'),
    fit: 'cover',
    floor: '1',
    actions: [
      action('player-door', 'Entra in casa tua', 'scene', { destination: 'home-player', minSize: 86, padding: 20, className: 'hit--apartment-door' }),
      action('maria-door', 'Entra in casa di Maria', 'scene', { destination: 'home-maria', minSize: 86, padding: 20, className: 'hit--apartment-door' }),
      action('elevator', 'Entra nell’ascensore', 'elevator', { minSize: 92, padding: 20, className: 'hit--landing-elevator' }),
    ],
  },
  {
    key: 'home-player',
    label: 'Casa tua',
    asset: asset('casa-tua.svg'),
    fit: 'cover',
    floor: '1',
    actions: [
      action('player-entry-door', 'Torna al pianerottolo del piano uno', 'scene', { destination: 'landing-1', minSize: 86, padding: 20, className: 'hit--room-exit' }),
      action('box-6', 'Leggi l’articolo Cosa rende una casa Casa?', 'home-article', { minSize: 86, padding: 12, touchMinSize: 72, touchPadding: 8, className: 'hit--home-article' }),
      action('complaint-file', 'Apri il fascicolo delle denunce da cattivo vicino', 'editorial', { minSize: 72, padding: 18, className: 'hit--complaint-file' }),
      action('artwork-home-player', 'Osserva il quadro', 'artwork-lightbox', { minSize: 68, padding: 10, className: 'hit--artwork' }),
    ],
  },
  {
    key: 'home-maria',
    label: 'Casa di Maria',
    asset: asset('casa-maria2.svg'),
    fit: 'cover',
    floor: '1',
    actions: [
      action('maria-entry-door', 'Torna al pianerottolo del piano uno', 'scene', { destination: 'landing-1', minSize: 86, padding: 20, className: 'hit--room-exit' }),
      action('maria-binoculars', 'Guarda fuori con il binocolo di Maria', 'maria-binoculars', { minSize: 72, padding: 14, className: 'hit--maria-binoculars' }),
      action('maria-fridge', 'Apri il frigo di Maria', 'maria-fridge', { minSize: 88, padding: 14, className: 'hit--maria-fridge' }),
      action('junk-drawer', 'Apri il cassetto misterioso di Maria', 'maria-junk-drawer', { minSize: 76, padding: 14, className: 'hit--maria-junk-drawer' }),
      action('recipe-book', 'Apri il ricettario di Maria', 'maria-recipe-book', { minSize: 72, padding: 14, className: 'hit--maria-recipe-book' }),
      action('artwork-home-maria', 'Osserva il quadro', 'artwork-lightbox', { minSize: 68, padding: 10, className: 'hit--artwork' }),
    ],
  },
  {
    key: 'landing-2',
    label: 'Pianerottolo, piano due',
    asset: asset('pianerottolo-2.svg'),
    fit: 'cover',
    floor: '2',
    actions: [
      action('paolo-door', 'Entra in casa di Paolo', 'scene', { destination: 'home-paolo', minSize: 86, padding: 20, className: 'hit--apartment-door' }),
      action('rossi-door', 'Entra in casa della famiglia Rossi', 'scene', { destination: 'home-rossi', minSize: 86, padding: 20, className: 'hit--apartment-door' }),
      action('elevator', 'Entra nell’ascensore', 'elevator', { minSize: 92, padding: 20, className: 'hit--landing-elevator' }),
    ],
  },
  {
    key: 'home-paolo',
    label: 'Casa di Paolo',
    asset: asset('casa-paolo.svg'),
    fit: 'cover',
    floor: '2',
    extraArt: [
      { key: 'intercom', asset: asset('citofono.svg'), className: 'paolo-intercom', fit: 'contain' },
    ],
    actions: [
      action('paolo-entry-door', 'Torna al pianerottolo del piano due', 'scene', { destination: 'landing-2', minSize: 86, padding: 20, className: 'hit--room-exit' }),
      action('paolo-lamp', 'Spegni la luce e ascolta la casa di Paolo', 'paolo-story', { minSize: 62, padding: 14, className: 'hit--paolo-story' }),
      action('intercom', 'Leggi la storia del citofono', 'intercom-article', { minSize: 72, padding: 8, touchMinSize: 64, touchPadding: 8, className: 'hit--paolo-intercom' }),
      action('artwork-home-paolo', 'Osserva il quadro', 'artwork-lightbox', { minSize: 68, padding: 10, className: 'hit--artwork' }),
    ],
  },
  {
    key: 'home-rossi',
    label: 'Casa della famiglia Rossi',
    asset: asset('casa-rossi2.svg'),
    fit: 'cover',
    floor: '2',
    actions: [
      action('rossi-entry-door', 'Torna al pianerottolo del piano due', 'scene', { destination: 'landing-2', minSize: 86, padding: 20, className: 'hit--room-exit' }),
      action('wall-marker', 'Disegna sul muro con il pennarello rosso', 'rossi-wall-drawing', { minSize: 70, padding: 14, className: 'hit--rossi-marker' }),
      action('rossi-bunk-beds', 'Fai rimbalzare i letti a castello', 'rossi-bunk-boing', { minSize: 96, padding: 8, className: 'hit--rossi-bunks' }),
      action('sticker-album', 'Apri l’album delle figurine', 'rossi-sticker-album', { minSize: 84, padding: 14, className: 'hit--rossi-album' }),
      action('artwork-home-rossi', 'Osserva il quadro', 'artwork-lightbox', { minSize: 68, padding: 10, className: 'hit--artwork' }),
    ],
  },
  {
    key: 'landing-3',
    label: 'Pianerottolo, piano tre',
    asset: asset('pianerottolo-3.svg'),
    fit: 'cover',
    floor: '3',
    actions: [
      action('arturo-door', 'Entra in casa di Arturo', 'scene', { destination: 'home-arturo', minSize: 86, padding: 20, className: 'hit--apartment-door' }),
      action('jannel-door', 'Entra in casa di Jannel', 'scene', { destination: 'home-jannel', minSize: 86, padding: 20, className: 'hit--apartment-door' }),
      action('elevator', 'Entra nell’ascensore', 'elevator', { minSize: 92, padding: 20, className: 'hit--landing-elevator' }),
    ],
  },
  {
    key: 'home-arturo',
    label: 'Casa di Arturo',
    asset: asset('casa-arturo2.svg'),
    fit: 'cover',
    floor: '3',
    actions: [
      action('arturo-entry-door', 'Torna al pianerottolo del piano tre', 'scene', { destination: 'landing-3', minSize: 86, padding: 20, className: 'hit--room-exit' }),
      action('arturo-story-note', 'Ascolta la notte dal punto di vista di Arturo', 'arturo-story', { minSize: 66, padding: 12, className: 'hit--arturo-story' }),
      action('arturo-avoid-note', 'Leggi come evitare i vicini', 'avoid-neighbors', { minSize: 66, padding: 12, className: 'hit--arturo-article' }),
    ],
  },
  {
    key: 'home-jannel',
    label: 'Casa di Jannel',
    asset: asset('casa-jannel2.svg'),
    fit: 'cover',
    floor: '3',
    actions: [
      action('jannel-entry-door', 'Torna al pianerottolo del piano tre', 'scene', { destination: 'landing-3', minSize: 86, padding: 20, className: 'hit--room-exit' }),
      action('cat-jannel-1', 'Accarezza il gatto', 'pet-cat', { minSize: 52, padding: 4, touchMinSize: 52, touchPadding: 4, className: 'hit--jannel-cat' }),
      action('cat-jannel-3', 'Accarezza il gatto', 'pet-cat', { minSize: 52, padding: 4, touchMinSize: 52, touchPadding: 4, className: 'hit--jannel-cat' }),
      action('cat-jannel-4', 'Accarezza il gatto', 'pet-cat', { minSize: 52, padding: 4, touchMinSize: 52, touchPadding: 4, className: 'hit--jannel-cat' }),
      action('cat-jannel-5', 'Accarezza il gatto', 'pet-cat', { minSize: 52, padding: 4, touchMinSize: 52, touchPadding: 4, className: 'hit--jannel-cat' }),
      action('cat-jannel-6', 'Accarezza il gatto', 'pet-cat', { hitAnchor: 'cat-jannel-6-face', minSize: 52, padding: 4, touchMinSize: 52, touchPadding: 4, className: 'hit--jannel-cat' }),
      action('tarot-altar', 'Pesca la carta del giorno', 'jannel-tarot', { minSize: 72, padding: 8, className: 'hit--jannel-tarot' }),
      action('artwork-home-jannel', 'Osserva il quadro', 'artwork-lightbox', { minSize: 68, padding: 10, className: 'hit--artwork' }),
    ],
  },
  {
    key: 'basement',
    label: 'Cantina',
    asset: asset('cantina2.svg'),
    fit: 'cover',
    floor: 'C',
    actions: [
      action('basement-exit', 'Torna all’ascensore', 'elevator', { minSize: 92, padding: 20, className: 'hit--basement-exit' }),
      action('channel-instagram', 'Apri il profilo Instagram di Conventional', 'external-link', { externalUrl: externalLinks.instagram, minSize: 72, padding: 6, touchMinSize: 72, touchPadding: 8, className: 'hit--basement-channel' }),
      action('channel-threads', 'Apri il profilo Threads di Conventional', 'external-link', { externalUrl: externalLinks.threads, minSize: 72, padding: 6, touchMinSize: 72, touchPadding: 8, className: 'hit--basement-channel' }),
      action('channel-newsletter', 'Apri la newsletter di Conventional', 'external-link', { externalUrl: externalLinks.newsletter, minSize: 72, padding: 6, touchMinSize: 72, touchPadding: 8, className: 'hit--basement-channel' }),
      action('channel-email', 'Scrivi a Conventional', 'external-link', { externalUrl: externalLinks.contactEmail, minSize: 72, padding: 6, touchMinSize: 72, touchPadding: 8, className: 'hit--basement-channel' }),
      action('channel-volume-zero', 'Apri Conventional Volume 0', 'external-link', { externalUrl: externalLinks.volumeZero, minSize: 72, padding: 6, touchMinSize: 72, touchPadding: 8, className: 'hit--basement-channel' }),
    ],
  },
];

export const scenesByKey = Object.fromEntries(sceneDefinitions.map((scene) => [scene.key, scene]));

export const destinationLabels = {
  basement: 'C',
  lobby: '0',
  'landing-1': '1',
  'landing-2': '2',
  'landing-3': '3',
};

export function floorForScene(key) {
  return scenesByKey[key]?.floor ?? null;
}
