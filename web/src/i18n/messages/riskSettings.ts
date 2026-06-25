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
  },
};
