const competingIosBrowsers = /(?:CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)\//;

export function needsIosSafariEntry({
  userAgent = navigator.userAgent,
  platform = navigator.platform,
  maxTouchPoints = navigator.maxTouchPoints,
} = {}) {
  const iosDevice = /iPhone|iPad|iPod/.test(userAgent)
    || (platform === 'MacIntel' && Number(maxTouchPoints) > 1);
  const safari = /Safari\//.test(userAgent) && !competingIosBrowsers.test(userAgent);
  return iosDevice && safari;
}
