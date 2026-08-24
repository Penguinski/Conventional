import { externalLinks } from './externalLinks.js';

const baseUrl = import.meta.env?.BASE_URL ?? '/vol1-test/';

export const mailboxConfig = [
  {
    id: 'mailbox-player',
    resident: 'Visitatore / Conventional',
    type: 'conventional',
    newsletterUrl: externalLinks.newsletterEmbed,
    volumeZeroUrl: externalLinks.volumeZero,
  },
  { id: 'mailbox-maria', resident: 'Maria', type: 'image', asset: `${baseUrl}assets/mailboxes/geova.png`, alt: 'Materiale ricevuto da Maria' },
  { id: 'mailbox-paolo', resident: 'Paolo', type: 'image', asset: `${baseUrl}assets/mailboxes/pianetarisparmio.png`, alt: 'Volantino Pianeta Risparmio ricevuto da Paolo' },
  { id: 'mailbox-rossi', resident: 'Famiglia Rossi', type: 'image', asset: `${baseUrl}assets/mailboxes/littl.png`, alt: 'Catalogo Littl ricevuto dalla famiglia Rossi' },
  { id: 'mailbox-arturo', resident: 'Arturo', type: 'empty' },
  { id: 'mailbox-jannel', resident: 'Jannel', type: 'image', asset: `${baseUrl}assets/mailboxes/meowmagazine.png`, alt: 'Copertina di Meow Magazine ricevuta da Jannel' },
];

export const mailboxById = Object.fromEntries(mailboxConfig.map((mailbox) => [mailbox.id, mailbox]));
