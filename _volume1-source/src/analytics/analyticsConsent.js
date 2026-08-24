export const analyticsTrackerIds = {
  googleAnalytics: 'G-S0KTLZF56G',
  microsoftClarity: 'wsxvrhi5hw',
};

const COOKIE_CONSENT_MODULE =
  'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js';

let analyticsEnabled = false;
let googleLoaded = false;
let clarityLoaded = false;

function setConsentState(value) {
  document.documentElement.dataset.analyticsConsent = value;
}

function configureGoogleDefaults() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window[`ga-disable-${analyticsTrackerIds.googleAnalytics}`] = true;
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
}

function loadGoogleAnalytics() {
  if (!googleLoaded) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.conventionalTracker = 'google-analytics';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsTrackerIds.googleAnalytics}`;
    document.head.appendChild(script);
    googleLoaded = true;
    window.gtag('js', new Date());
  }
  window.gtag('config', analyticsTrackerIds.googleAnalytics);
}

function loadClarity() {
  window.clarity = window.clarity || function clarity() {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  window.clarity('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: 'granted',
  });

  if (!clarityLoaded) {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.conventionalTracker = 'microsoft-clarity';
    script.src = `https://www.clarity.ms/tag/${analyticsTrackerIds.microsoftClarity}`;
    document.head.appendChild(script);
    clarityLoaded = true;
  }
}

function enableAnalytics() {
  if (analyticsEnabled) return;
  analyticsEnabled = true;
  setConsentState('granted');
  window[`ga-disable-${analyticsTrackerIds.googleAnalytics}`] = false;
  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  loadGoogleAnalytics();
  loadClarity();
}

function disableAnalytics() {
  analyticsEnabled = false;
  setConsentState('denied');
  window[`ga-disable-${analyticsTrackerIds.googleAnalytics}`] = true;
  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });

  if (window.clarity) {
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: 'denied',
    });
    window.clarity('consent', false);
  }
}

function syncAnalyticsConsent(CookieConsent) {
  if (CookieConsent.acceptedCategory('analytics')) {
    enableAnalytics();
  } else {
    disableAnalytics();
  }
}

function addPreferencesControl(CookieConsent) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cookie-preferences-control';
  button.textContent = 'Preferenze cookie';
  button.addEventListener('click', () => CookieConsent.showPreferences());
  document.body.appendChild(button);
}

export async function initializeAnalyticsConsent() {
  configureGoogleDefaults();
  setConsentState('denied');

  try {
    await import(/* @vite-ignore */ COOKIE_CONSENT_MODULE);
    const { CookieConsent } = window;
    if (!CookieConsent) throw new Error('CookieConsent non disponibile');

    addPreferencesControl(CookieConsent);
    CookieConsent.run({
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {
          autoClear: {
            cookies: [
              { name: /^_ga/ },
              { name: '_gid' },
              { name: /^_gat/ },
              { name: '_clck' },
              { name: '_clsk' },
            ],
          },
        },
      },
      onFirstConsent: () => syncAnalyticsConsent(CookieConsent),
      onConsent: () => syncAnalyticsConsent(CookieConsent),
      onChange: () => syncAnalyticsConsent(CookieConsent),
      guiOptions: {
        consentModal: { layout: 'box', position: 'bottom left' },
        preferencesModal: { layout: 'box' },
      },
      language: {
        default: 'it',
        translations: {
          it: {
            consentModal: {
              title: 'Cookie',
              description:
                'Usiamo cookie necessari al funzionamento del sito e, solo con il tuo consenso, cookie analytics per capire come viene esplorato Conventional.',
              acceptAllBtn: 'Accetta tutto',
              acceptNecessaryBtn: 'Rifiuta',
              showPreferencesBtn: 'Gestisci preferenze',
            },
            preferencesModal: {
              title: 'Preferenze cookie',
              acceptAllBtn: 'Accetta tutto',
              acceptNecessaryBtn: 'Rifiuta',
              savePreferencesBtn: 'Salva preferenze',
              closeIconLabel: 'Chiudi',
              sections: [
                {
                  title: 'Cookie necessari',
                  description: 'Servono al funzionamento essenziale del sito e non possono essere disattivati.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Analytics',
                  description: 'Google Analytics e Microsoft Clarity vengono caricati solo se autorizzati.',
                  linkedCategory: 'analytics',
                },
              ],
            },
          },
        },
      },
    });
  } catch (error) {
    disableAnalytics();
    console.warn('Gestione consenso non disponibile; analytics disattivati.', error);
  }
}
