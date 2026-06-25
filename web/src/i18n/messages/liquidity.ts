// Liquidity scanner panel strings. One namespace per file; the i18n index
// auto-merges every file in this folder under its filename as the namespace
// (this file -> `liquidity.*`).
export default {
  en: {
    title: "Liquidity scanner",
    scannerNote:
      "Top assets by 24h XLM-pair volume. Observe-only — it never trades; promote a watch candidate by hand via SCAN_ASSETS / ASSET_WHITELIST.",
    empty: {
      before: "No data yet. Enable the scanner with",
      after: "trend data fills in after ~24 hourly snapshots.",
    },
    cols: {
      asset: "Asset",
      vol24h: "24h vol (XLM)",
      spread: "Spread",
      rankTrend: "Rank trend",
      volume: "Volume",
      consistency: "Consistency",
    },
    labels: {
      liquidityScore: "Liquidity score",
      spread: "Spread",
    },
    tips: {
      liquidity:
        "A measure of how actively a token is traded. Higher liquidity means easier entry and exit without moving the price.",
      spread:
        "The difference between the best buy and best sell price in the order book. A wider spread means higher implicit cost per trade.",
    },
    watch: "watch",
  },
  nl: {
    title: "Liquiditeitsscanner",
    scannerNote:
      "Topassets op 24u XLM-paarvolume. Alleen observeren — er wordt nooit getraded; promoveer een watch-kandidaat handmatig via SCAN_ASSETS / ASSET_WHITELIST.",
    empty: {
      before: "Nog geen data. Schakel de scanner in met",
      after: "trenddata verschijnt na ~24 uurlijkse snapshots.",
    },
    cols: {
      asset: "Asset",
      vol24h: "24u volume (XLM)",
      spread: "Spread",
      rankTrend: "Rangtrend",
      volume: "Volume",
      consistency: "Consistentie",
    },
    labels: {
      liquidityScore: "Liquiditeitsscore",
      spread: "Spread",
    },
    tips: {
      liquidity:
        "Een maat voor hoe actief een token wordt verhandeld. Hogere liquiditeit betekent makkelijker in- en uitstappen zonder de prijs te bewegen.",
      spread:
        "Het verschil tussen de beste bid- en beste ask-prijs in het orderboek. Een bredere spread betekent hogere impliciete kosten per trade.",
    },
    watch: "watch",
  },
  fr: {
    title: "Scanner de liquidité",
    scannerNote:
      "Principaux actifs par volume de paire XLM sur 24h. Observation seule — aucun trade n'est exécuté ; promouvez un candidat watch manuellement via SCAN_ASSETS / ASSET_WHITELIST.",
    empty: {
      before: "Pas encore de données. Activez le scanner avec",
      after: "les données de tendance apparaissent après ~24 instantanés horaires.",
    },
    cols: {
      asset: "Actif",
      vol24h: "Volume 24h (XLM)",
      spread: "Spread",
      rankTrend: "Tendance du rang",
      volume: "Volume",
      consistency: "Cohérence",
    },
    labels: {
      liquidityScore: "Score de liquidité",
      spread: "Spread",
    },
    tips: {
      liquidity:
        "Une mesure de l'activité de trading d'un token. Une liquidité plus élevée facilite l'entrée et la sortie sans faire bouger le prix.",
      spread:
        "La différence entre le meilleur prix bid et le meilleur prix ask dans le carnet d'ordres. Un spread plus large implique un coût implicite plus élevé par trade.",
    },
    watch: "watch",
  },
  es: {
    title: "Escáner de liquidez",
    scannerNote:
      "Principales activos por volumen del par XLM en 24h. Solo observación — nunca opera; promociona un candidato watch a mano mediante SCAN_ASSETS / ASSET_WHITELIST.",
    empty: {
      before: "Aún no hay datos. Activa el escáner con",
      after: "los datos de tendencia aparecen tras ~24 capturas por hora.",
    },
    cols: {
      asset: "Activo",
      vol24h: "Volumen 24h (XLM)",
      spread: "Spread",
      rankTrend: "Tendencia de rango",
      volume: "Volumen",
      consistency: "Consistencia",
    },
    labels: {
      liquidityScore: "Puntuación de liquidez",
      spread: "Spread",
    },
    tips: {
      liquidity:
        "Una medida de cuán activamente se opera un token. Mayor liquidez significa entrar y salir más fácilmente sin mover el precio.",
      spread:
        "La diferencia entre el mejor precio bid y el mejor precio ask en el libro de órdenes. Un spread más amplio implica un coste implícito mayor por trade.",
    },
    watch: "watch",
  },
};
