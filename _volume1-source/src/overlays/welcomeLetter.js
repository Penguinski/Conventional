import { editorialNote } from '../content/editorial.js';

export function renderWelcomeLetter() {
  return `
    <div class="letter-overlay" data-welcome-overlay role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <article class="editorial-note">
        <p class="editorial-note-kicker">CONVENTIONAL · VOL. 1</p>
        <h1 id="welcome-title">${editorialNote.title}</h1>
        ${editorialNote.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}
        <button class="letter-close overlay-close" type="button" data-action="close-letter" aria-label="Chiudi la nota editoriale e guarda la facciata"><span aria-hidden="true">×</span></button>
      </article>
    </div>`;
}

export function renderOnboardingNotice({ touch = false } = {}) {
  const verb = touch ? 'tocca' : 'clicca';
  return `
    <aside class="onboarding-notice" data-onboarding-notice role="dialog" aria-labelledby="onboarding-title" aria-describedby="onboarding-copy">
      <h2 id="onboarding-title">Curiosare è consentito.</h2>
      <p id="onboarding-copy">Le cose che lampeggiano in bianco nascondono qualcosa.<br>Se non sai dove cercare, ${verb} da qualche parte. Ti mostreremo dove guardare.</p>
      <button class="onboarding-notice-close overlay-close" type="button" data-onboarding-close aria-label="Chiudi il messaggio informativo"><span aria-hidden="true">×</span></button>
    </aside>`;
}
