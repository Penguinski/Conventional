let audioContext;
let enabled = localStorage.getItem('conventional:audio-enabled') === 'true';
let elevatorTimer = 0;
let narrativeStops = [];

function context() {
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

function tone({ frequency, start, duration, gain = 0.08 }) {
  const ctx = context();
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(volume).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playBell() {
  if (!enabled) return;
  const ctx = context();
  const now = ctx.currentTime;
  tone({ frequency: 1180, start: now, duration: 0.18 });
  tone({ frequency: 880, start: now + 0.14, duration: 0.28, gain: 0.1 });
}

export function playDoorLatch() {
  if (!enabled) return;
  const ctx = context();
  const now = ctx.currentTime;
  tone({ frequency: 170, start: now, duration: 0.09, gain: 0.045 });
  tone({ frequency: 120, start: now + 0.08, duration: 0.12, gain: 0.035 });
}

function noise({ duration = .16, gain = .035, highpass = 120 }) {
  const ctx = context();
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource(); const filter = ctx.createBiquadFilter(); const volume = ctx.createGain();
  filter.type = 'highpass'; filter.frequency.value = highpass; volume.gain.setValueAtTime(gain, ctx.currentTime); volume.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
  source.buffer = buffer; source.connect(filter).connect(volume).connect(ctx.destination); source.start();
  narrativeStops.push(() => { try { source.stop(); } catch {} });
}

export function playEffect(name) {
  if (!enabled) return;
  const ctx = context(); void ctx.resume?.(); const now = ctx.currentTime;
  if (name === 'thump' || name === 'roomba' || name === 'drag') { tone({ frequency: name === 'thump' ? 82 : 118, start: now, duration: .16, gain: .055 }); noise({ duration: .12, gain: .018, highpass: 70 }); }
  else if (name === 'keyboard') { noise({ duration: .4, gain: .025, highpass: 900 }); }
  else if (name === 'dog' || name === 'breath') { noise({ duration: .7, gain: .018, highpass: 300 }); }
  else if (name === 'voice') { tone({ frequency: 164, start: now, duration: .65, gain: .026 }); tone({ frequency: 218, start: now + .08, duration: .55, gain: .018 }); }
  else if (name === 'ball') { tone({ frequency: 720, start: now, duration: .09, gain: .04 }); tone({ frequency: 440, start: now + .16, duration: .18, gain: .025 }); }
  else if (name === 'cat') { tone({ frequency: 145, start: now, duration: .32, gain: .025 }); tone({ frequency: 170, start: now + .22, duration: .34, gain: .02 }); }
  else if (name === 'book') { noise({ duration: .22, gain: .018, highpass: 420 }); }
  else if (name === 'pack') { noise({ duration: .28, gain: .026, highpass: 1200 }); }
  else if (name === 'button') { tone({ frequency: 540, start: now, duration: .08, gain: .025 }); }
}

export function stopNarrative() { narrativeStops.splice(0).forEach((stop) => stop()); }

function elevatorPhrase() {
  if (!enabled) return;
  const ctx = context(); const now = ctx.currentTime;
  [261.6,329.6,392,329.6].forEach((frequency,index) => tone({ frequency, start: now + index * .32, duration: .26, gain: .012 }));
}

export function setAudioScene(scene) {
  window.clearInterval(elevatorTimer); elevatorTimer = 0;
  if (scene === 'elevator' && enabled) { elevatorPhrase(); elevatorTimer = window.setInterval(elevatorPhrase, 3200); }
}

export function initializeAudio() {
  return { playEffect, stopNarrative, setAudioScene, get enabled() { return enabled; } };
}
