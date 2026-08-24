import { renderIllustratedScene } from './illustratedScene.js';
import { scenesByKey } from './sceneConfig.js';

export function renderElevator() {
  return renderIllustratedScene(scenesByKey.elevator);
}
