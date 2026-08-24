import 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.umd.js';

CookieConsent.run({
    guiOptions: {
        consentModal: {
            layout: "box",
            position: "bottom left",
            equalWeightButtons: true,
            flipButtons: false
        },
        preferencesModal: {
            layout: "box",
            position: "right",
            equalWeightButtons: true,
            flipButtons: false
        }
    },
    categories: {
        necessary: {
            readOnly: true
        },
        functionality: {},
        analytics: {},
        marketing: {}
    },
    language: {
        default: "it",
        autoDetect: "browser",
        translations: {
            en: {
                consentModal: {
                    title: "Hello traveller, it's cookie time!",
                    description: "We use cookies to offer you the best experience on our site and to analyze traffic anonymously. You can choose to accept all of them or customize your choices. For more details, read our <a href=\"/privacy-policy\">Privacy Policy</a>.",
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Reject all",
                    showPreferencesBtn: "Manage preferences",
                    footer: "<a href=\"/privacy-policy\">Privacy Policy</a>\n<a href=\"/privacy-policy\">Terms and conditions</a>"
                },
                preferencesModal: {
                    title: "Consent Preferences Center",
                    acceptAllBtn: "Accept all",
                    acceptNecessaryBtn: "Reject all",
                    savePreferencesBtn: "Save preferences",
                    closeIconLabel: "Close modal",
                    serviceCounterLabel: "Service|Services",
                    sections: [
                        {
                            title: "Cookie Usage",
                            description: "In this section, you can manage your cookie preferences. Remember that disabling some cookies may affect your browsing experience."
                        },
                        {
                            title: "Strictly Necessary Cookies <span class=\"pm__badge\">Always Enabled</span>",
                            description: "These cookies are essential for the proper functioning of the website. They do not store any personal data and cannot be deactivated.",
                            linkedCategory: "necessary"
                        },
                        {
                            title: "Functionality Cookies",
                            description: "These cookies allow the site to remember your choices (such as language) and provide advanced and customized features.",
                            linkedCategory: "functionality"
                        },
                        {
                            title: "Analytics Cookies",
                            description: "These help us understand how visitors interact with the site by collecting and transmitting information anonymously (e.g., Google Analytics).",
                            linkedCategory: "analytics"
                        },
                        {
                            title: "Advertisement Cookies",
                            description: "Used to track visitors across websites to display ads that are relevant and engaging for the individual user.",
                            linkedCategory: "marketing"
                        },
                        {
                            title: "More information",
                            description: "For any query in relation to my policy on cookies and your choices, please <a class=\"cc__link\" href=\"/contatti\">contact me</a>."
                        }
                    ]
                }
            },
            it: {
                consentModal: {
                    title: "Ciao viaggiatore, è tempo di biscotti!",
                    description: "Utilizziamo i cookie per offrirti la migliore esperienza sul nostro sito e per analizzare in modo anonimo il traffico. Puoi scegliere se accettarli tutti o personalizzare le tue scelte. Per maggiori dettagli, leggi la nostra <a href=\"/privacy-policy\">Informativa sulla privacy</a>.",
                    acceptAllBtn: "Accetta tutto",
                    acceptNecessaryBtn: "Rifiuta tutto",
                    showPreferencesBtn: "Gestisci preferenze",
                    footer: "<a href=\"/privacy-policy\">Informativa sulla privacy</a>\n<a href=\"/privacy-policy\">Termini e condizioni</a>"
                },
                preferencesModal: {
                    title: "Centro preferenze per il consenso",
                    acceptAllBtn: "Accetta tutto",
                    acceptNecessaryBtn: "Rifiuta tutto",
                    savePreferencesBtn: "Salva le preferenze",
                    closeIconLabel: "Chiudi la finestra",
                    serviceCounterLabel: "Servizi",
                    sections: [
                        {
                            title: "Utilizzo dei Cookie",
                            description: "In questa sezione puoi gestire le tue preferenze relative ai cookie. Ricorda che disabilitare alcuni cookie potrebbe influire sulla tua esperienza di navigazione."
                        },
                        {
                            title: "Cookie Strettamente Necessari <span class=\"pm__badge\">Sempre Attivati</span>",
                            description: "Questi cookie sono fondamentali per il corretto funzionamento del sito web. Non memorizzano alcun dato personale e non possono essere disattivati.",
                            linkedCategory: "necessary"
                        },
                        {
                            title: "Cookie di Funzionalità",
                            description: "Questi cookie permettono al sito di ricordare le tue scelte (come la lingua) e forniscono funzionalità avanzate e personalizzate.",
                            linkedCategory: "functionality"
                        },
                        {
                            title: "Cookie Analitici",
                            description: "Ci aiutano a capire come i visitatori interagiscono con il sito raccogliendo e trasmettendo informazioni in forma anonima (es. Google Analytics).",
                            linkedCategory: "analytics"
                        },
                        {
                            title: "Cookie Pubblicitari",
                            description: "Vengono utilizzati per tracciare i visitatori sui siti web con l'intento di visualizzare annunci pertinenti per il singolo utente.",
                            linkedCategory: "marketing"
                        },
                        {
                            title: "Ulteriori informazioni",
                            description: "Per qualsiasi domanda relativa alla nostra politica sui cookie e alle tue scelte, ti preghiamo di visitare la pagina <a class=\"cc__link\" href=\"/contatti\">contatti</a>."
                        }
                    ]
                }
            }
        }
    }
});
