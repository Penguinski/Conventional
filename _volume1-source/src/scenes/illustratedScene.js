function renderAction(action) {
  const destination = action.destination ? ` data-destination="${action.destination}"` : '';
  const feedback = action.feedback ? ` data-feedback="${action.feedback}"` : '';
  const touchMinSize = action.touchMinSize ? ` data-hit-touch-min-size="${action.touchMinSize}"` : '';
  const touchPadding = action.touchPadding !== undefined ? ` data-hit-touch-padding="${action.touchPadding}"` : '';
  const hitAnchor = action.hitAnchor ? ` data-hit-anchor="${action.hitAnchor}"` : '';
  const externalUrl = action.externalUrl ? ` data-external-url="${action.externalUrl}"` : '';
  return `<button class="object-button scene-hit ${action.className}" type="button" aria-label="${action.label}" data-action="${action.type}" data-hit-target="${action.targetId}"${hitAnchor} data-hit-padding="${action.padding}" data-hit-min-size="${action.minSize}"${touchMinSize}${touchPadding}${destination}${feedback}${externalUrl}></button>`;
}

export function renderIllustratedScene(scene, { period, active = false } = {}) {
  const isExterior = scene.kind === 'exterior';
  const artKey = scene.artKey ?? scene.key;
  const classes = ['scene', `scene--${scene.key}`, `scene--fit-${scene.fit}`];
  if (isExterior) classes.push('scene--exterior');
  if (active) classes.push('is-active');
  const periodAttribute = isExterior ? ` data-period="${period}"` : '';
  const background = scene.backgroundAsset
    ? `<div class="qwen-art qwen-art--exterior-background" data-svg-src="${scene.backgroundAsset}" data-svg-root="exterior-background" data-svg-namespace="${scene.key}-background" data-svg-fit="contain" aria-hidden="true"></div>`
    : '';
  const bellCaption = isExterior ? '<div class="bell-caption" data-bell-caption role="status" aria-live="polite"></div>' : '';
  const extraArt = (scene.extraArt ?? []).map((item) => `<div class="qwen-art qwen-art--${item.className ?? item.key}" data-svg-src="${item.asset}" data-svg-root="${item.key}" data-svg-namespace="${scene.key}-${item.key}" data-svg-fit="${item.fit ?? 'contain'}" aria-hidden="true"></div>`).join('');
  const emailLink = scene.emailLink ? `<a class="scene-email-link" href="${scene.emailLink.href}" aria-label="${scene.emailLink.label}">${scene.emailLink.text}</a>` : '';

  return `
    <section class="${classes.join(' ')}" data-scene="${scene.key}" data-floor="${scene.floor ?? ''}" aria-label="${scene.label}"${active ? '' : ' aria-hidden="true"'}${periodAttribute}>
      ${background}
      <div class="qwen-art qwen-art--${artKey}" data-svg-src="${scene.asset}" data-svg-root="${artKey}" data-svg-namespace="${scene.key}" data-svg-fit="${scene.fit}" aria-hidden="true"></div>
      ${extraArt}
      <div class="scene-hit-layer" data-hit-layer>${scene.actions.map(renderAction).join('')}${emailLink}</div>
      ${bellCaption}
    </section>`;
}
