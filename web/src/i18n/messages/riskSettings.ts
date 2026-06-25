// Strings for RiskSettingsPanel.vue (per-factor AI risk profile). One namespace
// per file; the i18n index auto-merges this file under `riskSettings.*`.
export default {
  en: {
    title: "Risk settings",
    note: "How aggressively the AI trades, per factor. LOW = current (most conservative) behavior; raising a factor lets the AI take more risk on that dimension. Changes take effect on the next proposal — no restart needed.",
    highWarning:
      "One or more risk factors are set to HIGH. The AI may place larger or more frequent trades. Monitor your portfolio closely.",
    overall: "Overall risk profile",
    resetToLow: "Reset to LOW",
    factors: {
      positionSize: {
        label: "Position size",
        tip: "LOW: AI trades the minimum safe amount per order (current behavior). MEDIUM: scales position size to a moderate % of available balance. HIGH: uses a larger % of available balance per order.",
      },
      stopLossDistance: {
        label: "Stop loss distance",
        tip: "LOW: stop placed close to entry (tight, limits losses). MEDIUM: a moderate distance from entry. HIGH: further from entry (wider, allows more movement). The AI prefers a trailing stop at MEDIUM/HIGH.",
      },
      tradeFrequency: {
        label: "Trade frequency",
        tip: "LOW: trades conservatively, only on high-confidence signals. MEDIUM: trades on moderate-confidence signals. HIGH: trades more frequently, including lower-confidence signals.",
      },
      volatilityTolerance: {
        label: "Asset volatility tolerance",
        tip: "LOW: only stable, high-liquidity tokens. MEDIUM: also considers moderately volatile tokens. HIGH: considers all whitelisted tokens including volatile ones.",
      },
      drawdownTolerance: {
        label: "Drawdown tolerance",
        tip: "LOW: pauses trading if the portfolio drops more than 5% in 24h. MEDIUM: pauses if it drops more than 10% in 24h. HIGH: does not pause based on portfolio drawdown.",
      },
      slippageTolerance: {
        label: "Slippage tolerance",
        tip: "LOW: rejects trades where slippage exceeds 0.5% (current behavior). MEDIUM: accepts slippage up to 1.5%. HIGH: accepts slippage up to 3%.",
      },
    },
    expert: {
      toggle: "Expert Mode — configure exact numeric thresholds",
      preset: "Load preset",
      presets: { conservative: "Conservative", balanced: "Balanced", aggressive: "Aggressive", custom: "Custom" },
      presetDesc: {
        conservative: "Small trades, tight stops, high-confidence only",
        balanced: "Moderate exposure across all factors",
        aggressive: "Larger trades, wider stops, trades more often",
      },
      positionSize: "Max position size (% of available balance)",
      positionPreview: "At {bal} XLM available, max order ≈ {amt} XLM",
      positionExceedsCap: "Above the AI per-trade cap of {cap} XLM — orders are capped there.",
      stopMode: { pct: "Fixed % from entry", amount: "Fixed amount from entry" },
      stopPct: "Stop distance (% from entry)",
      stopAmount: "Stop distance (XLM from entry)",
      stopTight: "Very tight stop — it may trigger on the normal spread.",
      minConfidence: "Minimum AI confidence score to trade",
      minConfidenceTip: "The AI scores each proposal 0–100. Only proposals at or above this threshold are executed.",
      maxVolatility: "Maximum accepted 24h price swing (%)",
      maxVolatilityTip: "Tokens with a 24h price swing above this value are skipped by the AI.",
      drawdownPause: "Pause AI trading if the portfolio drops this % in 24h",
      neverPause: "Never pause based on drawdown",
      slippage: "Maximum accepted slippage (%)",
      highWarning: "One or more values are more aggressive than the Aggressive preset. The AI may take outsized risk — monitor closely.",
    },
  },
  nl: {
    title: "Risico-instellingen",
    note: "Hoe agressief de AI handelt, per factor. LOW = huidig (meest conservatief) gedrag; een factor verhogen laat de AI meer risico nemen op die dimensie. Wijzigingen gaan in bij het volgende voorstel — geen herstart nodig.",
    highWarning:
      "Een of meer risicofactoren staan op HIGH. De AI kan grotere of frequentere trades plaatsen. Houd je portefeuille goed in de gaten.",
    overall: "Algeheel risicoprofiel",
    resetToLow: "Terug naar LOW",
    factors: {
      positionSize: {
        label: "Positiegrootte",
        tip: "LOW: de AI handelt het minimale veilige bedrag per order (huidig gedrag). MEDIUM: schaalt de positiegrootte naar een gematigd % van het beschikbare saldo. HIGH: gebruikt een groter % van het beschikbare saldo per order.",
      },
      stopLossDistance: {
        label: "Stop loss-afstand",
        tip: "LOW: stop dicht bij de instap (krap, beperkt verliezen). MEDIUM: een gematigde afstand van de instap. HIGH: verder van de instap (ruimer, laat meer beweging toe). De AI verkiest een trailing stop bij MEDIUM/HIGH.",
      },
      tradeFrequency: {
        label: "Handelsfrequentie",
        tip: "LOW: handelt conservatief, alleen bij signalen met hoge betrouwbaarheid. MEDIUM: handelt bij signalen met gematigde betrouwbaarheid. HIGH: handelt vaker, ook bij signalen met lagere betrouwbaarheid.",
      },
      volatilityTolerance: {
        label: "Tolerantie voor asset-volatiliteit",
        tip: "LOW: alleen stabiele tokens met hoge liquiditeit. MEDIUM: overweegt ook matig volatiele tokens. HIGH: overweegt alle tokens op de whitelist, inclusief volatiele.",
      },
      drawdownTolerance: {
        label: "Drawdown-tolerantie",
        tip: "LOW: pauzeert de handel als de portefeuille meer dan 5% daalt in 24u. MEDIUM: pauzeert als hij meer dan 10% daalt in 24u. HIGH: pauzeert niet op basis van portefeuille-drawdown.",
      },
      slippageTolerance: {
        label: "Slippage-tolerantie",
        tip: "LOW: weigert trades waarbij de slippage hoger is dan 0.5% (huidig gedrag). MEDIUM: accepteert slippage tot 1.5%. HIGH: accepteert slippage tot 3%.",
      },
    },
    expert: {
      toggle: "Expert-modus — stel exacte numerieke drempels in",
      preset: "Voorinstelling laden",
      presets: { conservative: "Conservatief", balanced: "Gebalanceerd", aggressive: "Agressief", custom: "Aangepast" },
      presetDesc: {
        conservative: "Kleine trades, krappe stops, alleen hoge betrouwbaarheid",
        balanced: "Gematigde blootstelling over alle factoren",
        aggressive: "Grotere trades, ruimere stops, handelt vaker",
      },
      positionSize: "Max. positiegrootte (% van beschikbaar saldo)",
      positionPreview: "Bij {bal} XLM beschikbaar, max. order ≈ {amt} XLM",
      positionExceedsCap: "Boven de AI-limiet per trade van {cap} XLM — orders worden daar afgetopt.",
      stopMode: { pct: "Vast % vanaf instap", amount: "Vast bedrag vanaf instap" },
      stopPct: "Stop-afstand (% vanaf instap)",
      stopAmount: "Stop-afstand (XLM vanaf instap)",
      stopTight: "Zeer krappe stop — kan afgaan op de normale spread.",
      minConfidence: "Minimale AI-betrouwbaarheidsscore om te handelen",
      minConfidenceTip: "De AI scoort elk voorstel 0–100. Alleen voorstellen op of boven deze drempel worden uitgevoerd.",
      maxVolatility: "Maximaal geaccepteerde 24u-prijsschommeling (%)",
      maxVolatilityTip: "Tokens met een 24u-prijsschommeling boven deze waarde worden door de AI overgeslagen.",
      drawdownPause: "Pauzeer AI-handel als de portefeuille dit % daalt in 24u",
      neverPause: "Nooit pauzeren op basis van drawdown",
      slippage: "Maximaal geaccepteerde slippage (%)",
      highWarning: "Een of meer waarden zijn agressiever dan de voorinstelling Agressief. De AI kan buitensporig risico nemen — houd het goed in de gaten.",
    },
  },
  fr: {
    title: "Paramètres de risque",
    note: "Le niveau d'agressivité du trading de l'IA, par facteur. LOW = comportement actuel (le plus prudent) ; augmenter un facteur permet à l'IA de prendre plus de risque sur cette dimension. Les changements prennent effet à la prochaine proposition — aucun redémarrage nécessaire.",
    highWarning:
      "Un ou plusieurs facteurs de risque sont réglés sur HIGH. L'IA peut placer des trades plus importants ou plus fréquents. Surveillez votre portefeuille de près.",
    overall: "Profil de risque global",
    resetToLow: "Réinitialiser à LOW",
    factors: {
      positionSize: {
        label: "Taille de position",
        tip: "LOW : l'IA trade le montant minimal sûr par ordre (comportement actuel). MEDIUM : ajuste la taille de position à un % modéré du solde disponible. HIGH : utilise un % plus élevé du solde disponible par ordre.",
      },
      stopLossDistance: {
        label: "Distance du stop loss",
        tip: "LOW : stop placé près de l'entrée (serré, limite les pertes). MEDIUM : une distance modérée de l'entrée. HIGH : plus loin de l'entrée (plus large, autorise plus de mouvement). L'IA préfère un trailing stop en MEDIUM/HIGH.",
      },
      tradeFrequency: {
        label: "Fréquence de trading",
        tip: "LOW : trade de façon prudente, uniquement sur des signaux à forte confiance. MEDIUM : trade sur des signaux à confiance modérée. HIGH : trade plus souvent, y compris sur des signaux à plus faible confiance.",
      },
      volatilityTolerance: {
        label: "Tolérance à la volatilité des actifs",
        tip: "LOW : uniquement des tokens stables et très liquides. MEDIUM : prend aussi en compte des tokens modérément volatils. HIGH : prend en compte tous les tokens autorisés, y compris les volatils.",
      },
      drawdownTolerance: {
        label: "Tolérance au drawdown",
        tip: "LOW : met le trading en pause si le portefeuille baisse de plus de 5% en 24h. MEDIUM : met en pause s'il baisse de plus de 10% en 24h. HIGH : ne met pas en pause sur la base du drawdown du portefeuille.",
      },
      slippageTolerance: {
        label: "Tolérance au slippage",
        tip: "LOW : rejette les trades où le slippage dépasse 0.5% (comportement actuel). MEDIUM : accepte un slippage jusqu'à 1.5%. HIGH : accepte un slippage jusqu'à 3%.",
      },
    },
    expert: {
      toggle: "Mode Expert — configurez des seuils numériques exacts",
      preset: "Charger un préréglage",
      presets: { conservative: "Conservateur", balanced: "Équilibré", aggressive: "Agressif", custom: "Personnalisé" },
      presetDesc: {
        conservative: "Petits trades, stops serrés, haute confiance uniquement",
        balanced: "Exposition modérée sur tous les facteurs",
        aggressive: "Trades plus importants, stops plus larges, trade plus souvent",
      },
      positionSize: "Taille de position max. (% du solde disponible)",
      positionPreview: "Avec {bal} XLM disponibles, ordre max. ≈ {amt} XLM",
      positionExceedsCap: "Au-dessus du plafond IA par trade de {cap} XLM — les ordres y seront plafonnés.",
      stopMode: { pct: "% fixe depuis l'entrée", amount: "Montant fixe depuis l'entrée" },
      stopPct: "Distance du stop (% depuis l'entrée)",
      stopAmount: "Distance du stop (XLM depuis l'entrée)",
      stopTight: "Stop très serré — il peut se déclencher sur le spread normal.",
      minConfidence: "Score de confiance IA minimum pour trader",
      minConfidenceTip: "L'IA note chaque proposition de 0 à 100. Seules les propositions au-dessus de ce seuil sont exécutées.",
      maxVolatility: "Variation de prix 24h maximale acceptée (%)",
      maxVolatilityTip: "Les tokens dont la variation de prix sur 24h dépasse cette valeur sont ignorés par l'IA.",
      drawdownPause: "Mettre l'IA en pause si le portefeuille baisse de ce % en 24h",
      neverPause: "Ne jamais mettre en pause sur la base du drawdown",
      slippage: "Slippage maximum accepté (%)",
      highWarning: "Une ou plusieurs valeurs sont plus agressives que le préréglage Agressif. L'IA peut prendre un risque démesuré — surveillez de près.",
    },
  },
  es: {
    title: "Ajustes de riesgo",
    note: "Con qué agresividad opera la IA, por factor. LOW = comportamiento actual (el más conservador); subir un factor permite que la IA asuma más riesgo en esa dimensión. Los cambios se aplican en la siguiente propuesta — no hace falta reiniciar.",
    highWarning:
      "Uno o más factores de riesgo están en HIGH. La IA puede realizar operaciones más grandes o más frecuentes. Vigila tu cartera de cerca.",
    overall: "Perfil de riesgo general",
    resetToLow: "Restablecer a LOW",
    factors: {
      positionSize: {
        label: "Tamaño de posición",
        tip: "LOW: la IA opera el importe mínimo seguro por orden (comportamiento actual). MEDIUM: ajusta el tamaño de posición a un % moderado del saldo disponible. HIGH: usa un % mayor del saldo disponible por orden.",
      },
      stopLossDistance: {
        label: "Distancia del stop loss",
        tip: "LOW: stop cerca de la entrada (ajustado, limita las pérdidas). MEDIUM: una distancia moderada de la entrada. HIGH: más lejos de la entrada (más amplio, permite más movimiento). La IA prefiere un trailing stop en MEDIUM/HIGH.",
      },
      tradeFrequency: {
        label: "Frecuencia de operaciones",
        tip: "LOW: opera de forma conservadora, solo con señales de alta confianza. MEDIUM: opera con señales de confianza moderada. HIGH: opera con más frecuencia, incluso con señales de menor confianza.",
      },
      volatilityTolerance: {
        label: "Tolerancia a la volatilidad del activo",
        tip: "LOW: solo tokens estables y de alta liquidez. MEDIUM: también considera tokens moderadamente volátiles. HIGH: considera todos los tokens de la whitelist, incluidos los volátiles.",
      },
      drawdownTolerance: {
        label: "Tolerancia al drawdown",
        tip: "LOW: pausa las operaciones si la cartera cae más de 5% en 24h. MEDIUM: pausa si cae más de 10% en 24h. HIGH: no pausa según el drawdown de la cartera.",
      },
      slippageTolerance: {
        label: "Tolerancia al slippage",
        tip: "LOW: rechaza operaciones donde el slippage supera 0.5% (comportamiento actual). MEDIUM: acepta slippage hasta 1.5%. HIGH: acepta slippage hasta 3%.",
      },
    },
    expert: {
      toggle: "Modo Experto — configura umbrales numéricos exactos",
      preset: "Cargar preajuste",
      presets: { conservative: "Conservador", balanced: "Equilibrado", aggressive: "Agresivo", custom: "Personalizado" },
      presetDesc: {
        conservative: "Operaciones pequeñas, stops ajustados, solo alta confianza",
        balanced: "Exposición moderada en todos los factores",
        aggressive: "Operaciones más grandes, stops más amplios, opera más a menudo",
      },
      positionSize: "Tamaño máx. de posición (% del saldo disponible)",
      positionPreview: "Con {bal} XLM disponibles, orden máx. ≈ {amt} XLM",
      positionExceedsCap: "Por encima del límite de IA por operación de {cap} XLM — las órdenes se limitarán ahí.",
      stopMode: { pct: "% fijo desde la entrada", amount: "Importe fijo desde la entrada" },
      stopPct: "Distancia del stop (% desde la entrada)",
      stopAmount: "Distancia del stop (XLM desde la entrada)",
      stopTight: "Stop muy ajustado — puede activarse con el spread normal.",
      minConfidence: "Puntuación mínima de confianza de la IA para operar",
      minConfidenceTip: "La IA puntúa cada propuesta de 0 a 100. Solo se ejecutan las propuestas en o por encima de este umbral.",
      maxVolatility: "Máxima oscilación de precio en 24h aceptada (%)",
      maxVolatilityTip: "Los tokens con una oscilación de precio en 24h superior a este valor son omitidos por la IA.",
      drawdownPause: "Pausar la IA si la cartera cae este % en 24h",
      neverPause: "No pausar nunca por drawdown",
      slippage: "Slippage máximo aceptado (%)",
      highWarning: "Uno o más valores son más agresivos que el preajuste Agresivo. La IA puede asumir un riesgo desmesurado — vigila de cerca.",
    },
  },
};
