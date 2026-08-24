import { renderIllustratedScene } from './illustratedScene.js';
import { scenesByKey } from './sceneConfig.js';

export function renderExterior(period) {
  return renderIllustratedScene(scenesByKey.exterior, { period, active: true });
}
