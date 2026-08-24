import { neighborProfiles, neighborQuestions } from '../content/neighborQuiz.js';

const emptyVector = () => ({ social: 0, ordine: 0, regole: 0, rumore: 0, curiosita: 0, possesso: 0 });

function rankProfiles(vector) {
  return Object.entries(neighborProfiles).map(([key, profile]) => ({
    key,
    profile,
    distance: Math.sqrt(Object.keys(vector).reduce((sum, dimension) => sum + (vector[dimension] - profile.vector[dimension]) ** 2, 0)),
  })).sort((a, b) => a.distance - b.distance);
}

export function createNeighborQuiz({ host, onClose }) {
  let overlay = null;
  let questionIndex = 0;
  let vector = emptyVector();
  let result = null;

  function renderIntro() {
    return `<section class="neighbor-quiz-intro"><p class="neighbor-quiz-label">STRUMENTO DI AUTOVALUTAZIONE</p><h1 id="neighbor-quiz-title">Che vicino sei?</h1><p>Un test non scientifico per scoprire come vivi, come convivi e quanto sei sopportabile quando attraversi la porta di casa.</p><button type="button" data-quiz-action="start">Inizia il quiz</button></section>`;
  }

  function renderQuestion() {
    const item = neighborQuestions[questionIndex];
    return `<section class="neighbor-quiz-question"><div class="neighbor-quiz-progress"><span>Domanda ${questionIndex + 1} di ${neighborQuestions.length}</span><i style="--quiz-progress:${(questionIndex / neighborQuestions.length) * 100}%"></i></div><h2>${item.question}</h2><div class="neighbor-quiz-answers">${item.answers.map((answer, index) => `<button type="button" data-quiz-action="answer" data-answer-index="${index}">${answer.text}</button>`).join('')}</div></section>`;
  }

  function renderResult() {
    const rankings = rankProfiles(vector);
    const winner = rankings[0];
    const second = rankings[1];
    const secondary = second.distance - winner.distance < 2.5
      ? `<div class="neighbor-quiz-secondary"><p>Ma c’è anche un po’ di</p><h3>${second.profile.title}</h3><p>${second.profile.description}</p></div>` : '';
    localStorage.setItem('conventional:neighbor-quiz-result', winner.key);
    result = { key: winner.key, ...winner.profile };
    return `<section class="neighbor-quiz-result"><p class="neighbor-quiz-label">IL TUO RISULTATO È</p><h2>${winner.profile.title}</h2><p>${winner.profile.description}</p>${secondary}<div class="neighbor-quiz-result-actions"><button type="button" data-quiz-action="share">Condividi</button><button type="button" data-quiz-action="start">Rifai il quiz</button></div></section>`;
  }

  async function shareResult() {
    if (!result) return;
    const imageUrl = `${import.meta.env.BASE_URL}${result.shareImage}`;
    const fileName = result.shareImage.split('/').pop();
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Immagine di condivisione non disponibile: ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      const shareData = { title: 'Che vicino sei?', text: `Io sono: ${result.title}.`, url: 'https://conventional.ooo/', files: [file] };
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share(shareData);
      else { const link = document.createElement('a'); link.href = imageUrl; link.download = fileName; link.click(); }
    } catch (error) { if (error?.name !== 'AbortError') await navigator.clipboard?.writeText(window.location.href).catch(() => {}); }
  }

  function setContent(markup) { overlay.querySelector('[data-quiz-content]').innerHTML = markup; }

  function start() { questionIndex = 0; vector = emptyVector(); setContent(renderQuestion()); }

  function answer(index) {
    const selected = neighborQuestions[questionIndex]?.answers[index];
    if (!selected) return;
    for (const [dimension, value] of Object.entries(selected.values)) vector[dimension] += value;
    questionIndex += 1;
    setContent(questionIndex >= neighborQuestions.length ? renderResult() : renderQuestion());
  }

  function open() {
    if (overlay) return;
    const template = document.createElement('template');
    template.innerHTML = `<div class="neighbor-quiz-overlay" role="dialog" aria-modal="true" aria-labelledby="neighbor-quiz-title"><div class="neighbor-quiz-paper"><div data-quiz-content>${renderIntro()}</div><button class="neighbor-quiz-close overlay-close" type="button" data-quiz-action="close" aria-label="Torna alla bacheca">×</button></div></div>`;
    overlay = template.content.firstElementChild;
    overlay.addEventListener('click', (event) => {
      const action = event.target.closest('[data-quiz-action]');
      if (!action) return;
      if (action.dataset.quizAction === 'close') close();
      if (action.dataset.quizAction === 'start') start();
      if (action.dataset.quizAction === 'answer') answer(Number(action.dataset.answerIndex));
      if (action.dataset.quizAction === 'share') shareResult();
    });
    host.append(overlay);
    window.requestAnimationFrame(() => overlay?.classList.add('is-open'));
    overlay.querySelector('.neighbor-quiz-close')?.focus({ preventScroll: true });
  }

  function close() {
    if (!overlay) return false;
    overlay.remove();
    overlay = null;
    onClose?.();
    return true;
  }

  function handleKeydown(event) {
    if (!overlay || event.key !== 'Escape') return false;
    event.preventDefault(); close(); return true;
  }

  return { open, close, handleKeydown, get isOpen() { return Boolean(overlay); } };
}
