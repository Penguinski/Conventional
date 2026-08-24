import { sanitizeStrokes } from './postItDrawing.js';

export function mergePostItRecord(current = {}, incoming = {}) {
  const definedFields = Object.fromEntries(Object.entries(incoming ?? {}).filter(([, value]) => value !== undefined));
  const hasStrokes = Object.prototype.hasOwnProperty.call(definedFields, 'strokes');
  return {
    ...current,
    ...definedFields,
    strokes: sanitizeStrokes(hasStrokes ? definedFields.strokes : current.strokes),
  };
}
