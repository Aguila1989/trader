// Shared UI strings (navigation, tabs, language switcher). One namespace per
// file; the i18n index auto-merges every file in this folder under its filename
// as the namespace (e.g. this file -> `common.*`).
export default {
  en: {
    appName: "Stellar AI Trading Bot",
    academy: "Academy",
    backToTrading: "← Back to Trading",
    language: "Language",
    tablistAria: "Trading sections",
    tab: { manual: "Manual Trading", bot: "Bot Trading", logs: "Logs" },
    footer:
      "The AI proposes — your backend enforces policy, signs and submits. Start on testnet with a throwaway hot wallet.",
    ai: {
      active: "AI Trading: ACTIVE",
      paused: "AI Trading: PAUSED",
      enable: "Enable AI",
      pause: "Pause AI",
      toggleLabel: "AI trading",
      toggleHint:
        "When paused, the AI stops generating proposals, placing orders and setting stop losses. The liquidity scanner, stop-loss monitor and manual trading keep running.",
    },
  },
  nl: {
    appName: "Stellar AI Trading Bot",
    academy: "Academy",
    backToTrading: "← Terug naar handelen",
    language: "Taal",
    tablistAria: "Handelssecties",
    tab: { manual: "Handmatig handelen", bot: "Bot-handel", logs: "Logboek" },
    footer:
      "De AI stelt voor — je backend handhaaft de regels, ondertekent en verstuurt. Begin op testnet met een wegwerp-hotwallet.",
    ai: {
      active: "AI-handel: ACTIEF",
      paused: "AI-handel: GEPAUZEERD",
      enable: "AI inschakelen",
      pause: "AI pauzeren",
      toggleLabel: "AI-handel",
      toggleHint:
        "Wanneer gepauzeerd genereert de AI geen voorstellen, plaatst hij geen orders en stelt hij geen stop losses in. De liquidity scanner, de stop-loss-monitor en handmatig handelen blijven werken.",
    },
  },
  fr: {
    appName: "Stellar AI Trading Bot",
    academy: "Académie",
    backToTrading: "← Retour au trading",
    language: "Langue",
    tablistAria: "Sections de trading",
    tab: { manual: "Trading manuel", bot: "Trading par bot", logs: "Journaux" },
    footer:
      "L'IA propose — votre backend applique la politique, signe et envoie. Commencez sur le testnet avec un portefeuille chaud jetable.",
    ai: {
      active: "Trading IA : ACTIF",
      paused: "Trading IA : EN PAUSE",
      enable: "Activer l'IA",
      pause: "Mettre l'IA en pause",
      toggleLabel: "Trading IA",
      toggleHint:
        "En pause, l'IA ne génère plus de propositions, ne place plus d'ordres et ne définit plus de stop loss. Le scanner de liquidité, le moniteur de stop loss et le trading manuel continuent de fonctionner.",
    },
  },
  es: {
    appName: "Stellar AI Trading Bot",
    academy: "Academia",
    backToTrading: "← Volver al trading",
    language: "Idioma",
    tablistAria: "Secciones de trading",
    tab: { manual: "Trading manual", bot: "Trading con bot", logs: "Registros" },
    footer:
      "La IA propone — tu backend aplica la política, firma y envía. Empieza en testnet con una billetera caliente desechable.",
    ai: {
      active: "Trading con IA: ACTIVO",
      paused: "Trading con IA: EN PAUSA",
      enable: "Activar IA",
      pause: "Pausar IA",
      toggleLabel: "Trading con IA",
      toggleHint:
        "En pausa, la IA deja de generar propuestas, colocar órdenes y fijar stop loss. El escáner de liquidez, el monitor de stop loss y el trading manual siguen funcionando.",
    },
  },
};
