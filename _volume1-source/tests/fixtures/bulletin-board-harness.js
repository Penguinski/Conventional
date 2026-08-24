import '../../src/styles/main.css';
import { createBulletinBoard } from '../../src/overlays/bulletinBoard.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMemoryStore() {
  const ownerId = 'qa-owner';
  const rows = new Map();
  let sequence = 0;
  let subscriber = null;

  return {
    configured: true,
    get ownerId() { return ownerId; },
    async load() { return [...rows.values()].map(clone); },
    async createPostIt(input) {
      sequence += 1;
      const timestamp = new Date().toISOString();
      const row = {
        id: `qa-post-it-${sequence}`,
        owner_id: ownerId,
        strokes: clone(input.strokes),
        x: input.x,
        y: input.y,
        z_index: input.z_index,
        created_at: timestamp,
        updated_at: timestamp,
      };
      rows.set(row.id, clone(row));
      queueMicrotask(() => subscriber?.({ eventType: 'INSERT', new: clone(row), old: {} }));
      return clone(row);
    },
    async movePostIt(id, position) {
      const current = rows.get(id);
      const partial = { id, ...position, updated_at: new Date().toISOString() };
      rows.set(id, { ...current, ...partial });
      queueMicrotask(() => subscriber?.({ eventType: 'UPDATE', new: clone(partial), old: { id } }));
      return clone(partial);
    },
    subscribe(callback) {
      subscriber = callback;
      return () => { subscriber = null; };
    },
    async unsubscribe() { subscriber = null; },
    snapshot() { return [...rows.values()].map(clone); },
  };
}

const store = createMemoryStore();
const experience = document.querySelector('#experience');
const board = createBulletinBoard({
  host: experience,
  background: document.querySelector('#scene-stage'),
  boardScene: document.querySelector('#board-scene'),
  store,
});

const openButton = document.querySelector('#open-board');
openButton.addEventListener('click', () => board.open(openButton));
window.__QA_BULLETIN_BOARD__ = { board, store };
board.open(openButton);
