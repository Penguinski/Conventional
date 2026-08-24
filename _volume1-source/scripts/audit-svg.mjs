import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const assetDirectory = new URL('../public/assets/qwen/', import.meta.url);
const fileNames = (await readdir(assetDirectory)).filter((name) => name.endsWith('.svg')).sort();
const globalIds = new Map();
let hasBlockingError = false;

for (const fileName of fileNames) {
  const markup = await readFile(new URL(fileName, assetDirectory), 'utf8');
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const localCounts = new Map(ids.map((id) => [id, ids.filter((candidate) => candidate === id).length]));
  const duplicateIds = [...localCounts].filter(([, count]) => count > 1).map(([id]) => id);
  const references = [
    ...[...markup.matchAll(/url\(\s*#([^\s)]+)\s*\)/g)].map((match) => match[1]),
    ...[...markup.matchAll(/(?:xlink:)?href="#([^"]+)"/g)].map((match) => match[1]),
  ];
  const unresolvedReferences = [...new Set(references.filter((id) => !localCounts.has(id)))];
  const styleTags = [...markup.matchAll(/<style\b/gi)].length;
  const illustratorClasses = new Set([...markup.matchAll(/\bclass="([^"]+)"/g)]
    .flatMap((match) => match[1].split(/\s+/))
    .filter((token) => /^cls-\d+$/.test(token)));
  const suspiciousFillNone = [...markup.matchAll(/(?:fill="none"|fill\s*:\s*none)/gi)].length;

  for (const id of ids) {
    const owners = globalIds.get(id) ?? [];
    owners.push(fileName);
    globalIds.set(id, owners);
  }

  if (duplicateIds.length || unresolvedReferences.length) hasBlockingError = true;
  console.log(JSON.stringify({
    file: fileName,
    ids: ids.length,
    duplicateIds,
    styleTags,
    illustratorClasses: illustratorClasses.size,
    references: references.length,
    unresolvedReferences,
    suspiciousFillNone,
  }));
}

const crossFileDuplicates = [...globalIds]
  .filter(([, owners]) => new Set(owners).size > 1)
  .map(([id, owners]) => ({ id, files: [...new Set(owners)].sort() }));

console.log(JSON.stringify({
  summary: {
    files: fileNames.length,
    crossFileDuplicateIds: crossFileDuplicates.length,
    crossFileDuplicates,
    note: 'Gli ID tra file sono consentiti nel sorgente: l\u2019adapter li namespace-a prima del mount inline.',
  },
}));

if (hasBlockingError) process.exitCode = 1;
