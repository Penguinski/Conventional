import { renderIllustratedScene } from './illustratedScene.js';
import { scenesByKey } from './sceneConfig.js';

export function renderLobby() {
  return renderIllustratedScene(scenesByKey.lobby);
}
