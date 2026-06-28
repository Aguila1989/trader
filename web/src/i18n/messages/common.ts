// Shared UI strings (navigation, tabs, language switcher). One namespace per
// file; the i18n index auto-merges every file in this folder under its filename
// as the namespace (e.g. this file -> `common.*`).
export default {
  en: {
    appName: "Atrium",
    academy: "Academy",
    backToTrading: "← Back to Trading",
    backToApp: "← Back to App",
    backToLogin: "← Back to Login",
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
      tradeMode: "AI trade mode",
      tradeModeHint:
        "Auto-trade submits policy-passing AI proposals without a click (still requires Live armed). Approve every trade queues them for your approval. Manual orders are unaffected.",
      access: "Trading access",
      accessHint:
        "Read-only observes; Paper simulates fills; Live can submit on-chain. This also gates your manual orders and wallet sends.",
    },
  },
  nl: {
    appName: "Atrium",
    academy: "Academy",
    backToTrading: "← Terug naar handelen",
    backToApp: "← Terug naar app",
    backToLogin: "← Terug naar aanmelden",
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
      tradeMode: "AI-handelsmodus",
      tradeModeHint:
        "Auto-trade verstuurt AI-voorstellen die de regels doorstaan zonder klik (vereist nog steeds dat Live actief is). Elke trade goedkeuren zet ze klaar voor jouw goedkeuring. Handmatige orders blijven ongemoeid.",
      access: "Handelstoegang",
      accessHint:
        "Alleen-lezen observeert; Paper simuleert fills; Live kan on-chain versturen. Dit geldt ook voor je handmatige orders en wallet-verzendingen.",
    },
  },
  fr: {
    appName: "Atrium",
    academy: "Académie",
    backToTrading: "← Retour au trading",
    backToApp: "← Retour à l'app",
    backToLogin: "← Retour à la connexion",
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
      tradeMode: "Mode de trading IA",
      tradeModeHint:
        "Auto-trade envoie les propositions de l'IA conformes à la politique sans clic (nécessite quand même que le mode Live soit activé). Approuver chaque transaction les met en attente de votre validation. Les ordres manuels ne sont pas affectés.",
      access: "Accès au trading",
      accessHint:
        "Lecture seule observe ; Paper simule les exécutions ; Live peut soumettre on-chain. Cela conditionne aussi vos ordres manuels et les envois depuis le portefeuille.",
    },
  },
  es: {
    appName: "Atrium",
    academy: "Academia",
    backToTrading: "← Volver al trading",
    backToApp: "← Volver a la app",
    backToLogin: "← Volver al inicio de sesión",
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
      tradeMode: "Modo de trading de IA",
      tradeModeHint:
        "Auto-trade envía las propuestas de la IA que pasan la política sin un clic (sigue requiriendo el modo Live activado). Aprobar cada operación las deja en espera de tu aprobación. Las órdenes manuales no se ven afectadas.",
      access: "Acceso al trading",
      accessHint:
        "Solo lectura observa; Paper simula ejecuciones; Live puede enviar on-chain. Esto también condiciona tus órdenes manuales y los envíos desde la billetera.",
    },
  },
};
