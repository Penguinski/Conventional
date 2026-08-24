import source from '../../Numero 1.md?raw';

const clean = (value) => value.replace(/\\([.!\[\]])/g, '$1').replace(/^>\s*/gm, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();

function sectionAfter(heading, nextHeading = '# 🟢 ') {
  const start = source.indexOf(heading);
  if (start < 0) return '';
  const bodyStart = source.indexOf('\n', start) + 1;
  const end = source.indexOf(`\n${nextHeading}`, bodyStart);
  return clean(source.slice(bodyStart, end < 0 ? source.length : end));
}

function paragraphs(section) {
  return section.split(/\n\s*\n/).map(clean).filter((item) => item && !/^Materiale$/i.test(item));
}

function groupedStory(section, perspective, groups) {
  const sourceParagraphs = paragraphs(section);
  let cursor = 0;
  return groups.map((config, index) => {
    const text = sourceParagraphs.slice(cursor, cursor + config.count).join('\n\n');
    cursor += config.count;
    return { id: `${perspective}-${index + 1}`, text, event: config.event, sound: config.sound, focus: config.focus, panelSide: config.panelSide };
  }).filter((beat) => beat.text);
}

const paoloGroups = [
  { count: 3, event: 'cold', sound: 'cold', focus: 'room', panelSide: 'right' },
  { count: 2, event: 'voice', sound: 'voice', focus: 'ceiling', panelSide: 'right' },
  { count: 2, event: 'breath', sound: 'breath', focus: 'bed', panelSide: 'right' },
  { count: 4, event: 'thump', sound: 'thump', focus: 'floor', panelSide: 'right' },
  { count: 2, event: 'keyboard', sound: 'keyboard', focus: 'wall', panelSide: 'right' },
  { count: 3, event: 'drag', sound: 'drag', focus: 'door', panelSide: 'right' },
  { count: 3, event: 'voice', sound: 'voice', focus: 'door', panelSide: 'right' },
  { count: 2, event: 'ball', sound: 'ball', focus: 'floor', panelSide: 'right' },
];

const arturoGroups = [
  { count: 2, event: 'still', sound: null, focus: 'room', panelSide: 'right' },
  { count: 2, event: 'cold', sound: 'cold', focus: 'door', panelSide: 'right' },
  { count: 2, event: 'slippers', sound: 'drag', focus: 'slippers', panelSide: 'left' },
  { count: 1, event: 'dog', sound: 'breath', focus: 'arturo-dog', panelSide: 'right' },
  { count: 1, event: 'roomba', sound: 'thump', focus: 'arturo-roomba', panelSide: 'right' },
  { count: 2, event: 'keyboard', sound: 'keyboard', focus: 'room', panelSide: 'right' },
  { count: 2, event: 'keyboard', sound: 'keyboard', focus: 'door', panelSide: 'right' },
  { count: 3, event: 'ball', sound: 'ball', focus: 'arturo-ball', panelSide: 'left' },
];

export const paoloStory = groupedStory(sectionAfter('# 🟢 Racconto, POV vicino'), 'paolo', paoloGroups);
export const arturoStory = groupedStory(sectionAfter('# 🟢 Racconto, POV Arturo'), 'arturo', arturoGroups);

function semanticSections(items, titles, counts) {
  let cursor = 0;
  return counts.map((count, index) => {
    const slice = items.slice(cursor, cursor + count);
    cursor += count;
    return { title: titles[index], paragraphs: slice };
  }).filter((section) => section.paragraphs.length);
}

function splitLongParagraph(paragraph, maximum = 520) {
  const sentences = paragraph.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const parts = [];
  let part = '';
  sentences.forEach((sentence) => {
    if (part && part.length + sentence.length + 1 > maximum) { parts.push(part); part = ''; }
    part += `${part ? ' ' : ''}${sentence}`;
  });
  if (part) parts.push(part);
  return parts;
}

function paginateSections(sections) {
  return sections.flatMap((section) => splitLongParagraph(section.paragraphs.join('\n\n')).map((text, index) => ({
    title: `${section.title}${index ? ' · continua' : ''}`,
    paragraphs: [text],
  })));
}

const gossipParagraphs = paragraphs(sectionAfter('# 🟢 Articolo, Gossip').split(/\n(?:# |Materiale\s*\n)/i)[0])
  .filter((item) => !/^il meccanismo del pettegolezzo$/i.test(item));
export const gossipArticle = paginateSections(semanticSections(gossipParagraphs, ['La voce comincia', 'Perché circola', 'Chi la trasporta', 'Cosa cambia', 'Quando ritorna', 'Il condominio ascolta'], [1,1,1,1,1,Math.max(1,gossipParagraphs.length - 5)]));

const avoidParagraphs = paragraphs(sectionAfter('# 🟢 Articolo, evitare i vicini').split(/\n(?:# |Materiale\s*\n)/i)[0])
  .filter((item) => !/^come evitare i vicini$/i.test(item));
const guideTitles = ['Prima di uscire', 'Le scale', 'L’ascensore', 'Il pianerottolo', 'Strategie di emergenza', 'Rientrare senza incidenti'];
export const avoidNeighborsArticle = avoidParagraphs.flatMap((paragraph, index) =>
  splitLongParagraph(paragraph, 520).map((part, partIndex) => ({
    title: `${guideTitles[index] ?? `Sezione ${index + 1}`}${partIndex ? ' · continua' : ''}`,
    paragraphs: [part],
  })),
);

export const elevatorFunFact = 'Si racconta che gli specchi siano stati messi negli ascensori perché le persone si lamentavano meno della loro lentezza se potevano guardarsi nell’attesa.';
