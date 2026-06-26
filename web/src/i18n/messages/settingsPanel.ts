// Feature 2 — Settings panel chrome. The individual setting LABELS and
// DESCRIPTIONS come from the backend catalog (GET /api/settings): they are
// low-level operator parameters (bps, stroops, intervals) kept in English on
// purpose. Only the panel chrome below is localized.
export default {
  en: {
    settingsPanel: {
      title: "Settings",
      note: "Every operational parameter, changeable live — no file edits, no restart. Values are validated and clamped by the backend; changes apply on the next read.",
      riskNote: "AI confidence threshold and drawdown pause are configured per-factor in Risk Settings (Expert Mode).",
      groups: {
        ai: "AI Trading",
        risk: "Risk & Safety",
        automation: "Automation",
        swap: "Swap & Transfer",
      },
      reset: "Reset",
      resetTo: "Reset to default ({v})",
      on: "Enabled",
      off: "Disabled",
    },
  },
  nl: {
    settingsPanel: {
      title: "Instellingen",
      note: "Elke operationele parameter, live aanpasbaar — geen bestanden bewerken, geen herstart. Waarden worden door de backend gevalideerd en begrensd; wijzigingen gelden bij de volgende uitlezing.",
      riskNote: "De AI-vertrouwensdrempel en de drawdown-pauze stel je per factor in bij Risico-instellingen (Expert-modus).",
      groups: {
        ai: "AI-handel",
        risk: "Risico & veiligheid",
        automation: "Automatisering",
        swap: "Swap & overdracht",
      },
      reset: "Herstellen",
      resetTo: "Terug naar standaard ({v})",
      on: "Ingeschakeld",
      off: "Uitgeschakeld",
    },
  },
  fr: {
    settingsPanel: {
      title: "Paramètres",
      note: "Chaque paramètre opérationnel, modifiable en direct — sans éditer de fichier ni redémarrer. Les valeurs sont validées et bornées par le backend ; les changements s'appliquent à la lecture suivante.",
      riskNote: "Le seuil de confiance de l'IA et la pause sur drawdown se règlent par facteur dans les Paramètres de risque (mode Expert).",
      groups: {
        ai: "Trading IA",
        risk: "Risque et sécurité",
        automation: "Automatisation",
        swap: "Swap et transfert",
      },
      reset: "Réinitialiser",
      resetTo: "Valeur par défaut ({v})",
      on: "Activé",
      off: "Désactivé",
    },
  },
  es: {
    settingsPanel: {
      title: "Ajustes",
      note: "Cada parámetro operativo, modificable en vivo — sin editar archivos ni reiniciar. El backend valida y acota los valores; los cambios se aplican en la siguiente lectura.",
      riskNote: "El umbral de confianza de la IA y la pausa por drawdown se configuran por factor en Ajustes de riesgo (modo Experto).",
      groups: {
        ai: "Trading con IA",
        risk: "Riesgo y seguridad",
        automation: "Automatización",
        swap: "Swap y transferencia",
      },
      reset: "Restablecer",
      resetTo: "Valor predeterminado ({v})",
      on: "Activado",
      off: "Desactivado",
    },
  },
};
