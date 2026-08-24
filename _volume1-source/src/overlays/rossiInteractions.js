import '../styles/rossiInteractions.css';
import { createRossiWallDrawing } from './rossiWallDrawing.js';

let stickerAlbumModulePromise = null;

export function createRossiInteractions({ host, background, scene, audio }) {
  const wallDrawing = createRossiWallDrawing({ host, background, scene });
  let stickerAlbum = null;
  let boingTimer = 0;

  function hydrate() {
    wallDrawing.updatePreview();
  }

  function openWallDrawing(trigger) {
    wallDrawing.open(trigger);
  }

  function boingBeds(trigger) {
    const beds = scene.querySelector('[data-svg-id="rossi-bunk-beds"]');
    if (!beds) return;
    window.clearTimeout(boingTimer);
    beds.classList.remove('is-boinging');
    void beds.getBoundingClientRect();
    beds.classList.add('is-boinging');
    trigger?.setAttribute('aria-label', 'Boing! Fai rimbalzare di nuovo i letti a castello');
    boingTimer = window.setTimeout(() => beds.classList.remove('is-boinging'), 720);
  }

  async function openStickerAlbum(trigger) {
    stickerAlbumModulePromise ??= import('./rossiStickerAlbum.js');
    const { createRossiStickerAlbum } = await stickerAlbumModulePromise;
    if (!trigger?.closest('.scene--home-rossi.is-active')) return;
    stickerAlbum ??= createRossiStickerAlbum({ host, background, audio });
    stickerAlbum.open(trigger);
  }

  function handleKeydown(event) {
    if (stickerAlbum?.handleKeydown(event)) return true;
    return wallDrawing.handleKeydown(event);
  }

  return { hydrate, openWallDrawing, boingBeds, openStickerAlbum, handleKeydown };
}
