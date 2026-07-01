// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// New BASIC glossary terms introduced by the pending Academy chapters
// (c22 Trading Psychology, c23 Market Cycles, c24 Stablecoins and USDC,
// c25 Crypto and Taxes, c26 How to Read Crypto News Critically).
//
// At GREEN-LIGHT: merge each locale's entries into the matching `en`/`nl`/`fr`/
// `es` object in ./glossary.ts (spread these in, or paste the entries). Nothing
// imports this file yet, so the live glossary is untouched. Each `term` is
// spelled exactly as it appears in that locale's lesson prose, so the existing
// segmentText() first-occurrence matcher will attach a tooltip automatically.
import type { Glossary } from "./glossary";

const en: Glossary = {
  fomo: { term: "FOMO", def: "The fear of missing out — the urge to buy because a price is running up and you dread being left behind." },
  fud: { term: "FUD", def: "Fear, uncertainty, and doubt — negative talk spread to scare people into selling." },
  lossAversion: { term: "loss aversion", def: "Feeling the pain of a loss about twice as strongly as the pleasure of an equal gain." },
  tradingPlan: { term: "trading plan", def: "A set of rules decided in advance: what to buy, and where to take profit or cut a loss." },
  bullMarket: { term: "bull market", def: "A sustained stretch when prices are broadly rising and optimism is high." },
  bearMarket: { term: "bear market", def: "A sustained stretch when prices are broadly falling and caution dominates." },
  altseason: { term: "altseason", def: "A period when coins other than the largest ones rise especially fast." },
  marketCorrection: { term: "market correction", def: "A modest, normal price drop (often around 10%) that interrupts a rise without ending it." },
  marketCrash: { term: "market crash", def: "A sudden, severe price drop, far sharper and deeper than a normal correction." },
  stablecoin: { term: "stablecoin", def: "A token designed to hold a steady value, usually pegged one-to-one to a currency like the US dollar." },
  peg: { term: "peg", def: "The fixed value a stablecoin aims to track, such as one USDC equalling one US dollar." },
  depeg: { term: "depeg", def: "When a stablecoin slips away from its intended value and no longer matches its peg." },
  taxableEvent: { term: "taxable event", def: "A moment the tax authorities may treat as taxable — such as selling, swapping, or being paid in crypto." },
  mica: { term: "MiCA", def: "Markets in Crypto-Assets — the EU's rulebook that regulates crypto services and stablecoins." },
  capitalGains: { term: "capital gains", def: "The profit made when you sell or swap an asset for more than you paid, which is often taxed." },
  pumpAndDump: { term: "pump-and-dump", def: "A scheme where people hype a token to push its price up, then sell into the buyers and let it collapse." },
  shilling: { term: "shilling", def: "Promoting a token loudly, often while hiding that you own it and profit if others buy." },
  fakePartnership: { term: "fake partnership", def: "A made-up or exaggerated claim that a token is tied to a well-known company, used to build false trust." },
};

const nl: Glossary = {
  fomo: { term: "FOMO", def: "De angst om iets te missen — de drang om te kopen omdat een prijs oploopt en je bang bent achter te blijven." },
  fud: { term: "FUD", def: "Angst, onzekerheid en twijfel — negatief gepraat dat wordt verspreid om mensen bang te maken zodat ze verkopen." },
  lossAversion: { term: "verliesaversie", def: "De pijn van een verlies ongeveer twee keer zo sterk voelen als het plezier van een even grote winst." },
  tradingPlan: { term: "handelsplan", def: "Een vooraf bepaalde set regels: wat je koopt, en waar je winst neemt of een verlies afkapt." },
  bullMarket: { term: "stierenmarkt", def: "Een aanhoudende periode waarin de prijzen breed stijgen en het optimisme hoog is." },
  bearMarket: { term: "berenmarkt", def: "Een aanhoudende periode waarin de prijzen breed dalen en voorzichtigheid de overhand heeft." },
  altseason: { term: "altseason", def: "Een periode waarin andere munten dan de grootste bijzonder snel stijgen." },
  marketCorrection: { term: "marktcorrectie", def: "Een bescheiden, normale prijsdaling (vaak zo'n 10%) die een stijging onderbreekt zonder die te beëindigen." },
  marketCrash: { term: "marktcrash", def: "Een plotselinge, hevige prijsdaling, veel scherper en dieper dan een normale correctie." },
  stablecoin: { term: "stablecoin", def: "Een token dat is ontworpen om een stabiele waarde vast te houden, meestal één-op-één gekoppeld aan een munteenheid zoals de Amerikaanse dollar." },
  peg: { term: "peg", def: "De vaste waarde die een stablecoin probeert te volgen, zoals één USDC gelijk aan één Amerikaanse dollar." },
  depeg: { term: "depeg", def: "Wanneer een stablecoin wegglijdt van zijn beoogde waarde en niet langer overeenkomt met zijn peg." },
  taxableEvent: { term: "belastbaar feit", def: "Een moment dat de belastingdienst als belastbaar kan behandelen — zoals verkopen, omwisselen of in crypto betaald worden." },
  mica: { term: "MiCA", def: "Markets in Crypto-Assets — het regelboek van de EU dat cryptodiensten en stablecoins reguleert." },
  capitalGains: { term: "meerwaarde", def: "De winst die je maakt wanneer je een bezit verkoopt of omwisselt voor meer dan je ervoor betaalde, die vaak wordt belast." },
  pumpAndDump: { term: "pump-and-dump", def: "Een opzet waarbij mensen een token hypen om de prijs op te drijven, om vervolgens aan de instappende kopers te verkopen en de koers te laten instorten." },
  shilling: { term: "shilling", def: "Een token luidruchtig promoten, vaak terwijl je verbergt dat je het zelf bezit en er winst op maakt als anderen kopen." },
  fakePartnership: { term: "nepsamenwerking", def: "Een verzonnen of overdreven bewering dat een token verbonden is aan een bekend bedrijf, gebruikt om vals vertrouwen te wekken." },
};

const fr: Glossary = {
  fomo: { term: "FOMO", def: "La peur de manquer une occasion — l'envie d'acheter parce qu'un prix s'envole et qu'on redoute de rester sur le carreau." },
  fud: { term: "FUD", def: "Peur, incertitude et doute — un discours négatif diffusé pour effrayer les gens et les pousser à vendre." },
  lossAversion: { term: "aversion à la perte", def: "Ressentir la douleur d'une perte environ deux fois plus fort que le plaisir d'un gain équivalent." },
  tradingPlan: { term: "plan de trading", def: "Un ensemble de règles décidées à l'avance : quoi acheter, et à quel prix prendre ses bénéfices ou couper une perte." },
  bullMarket: { term: "marché haussier", def: "Une période prolongée durant laquelle les prix montent globalement et où l'optimisme est élevé." },
  bearMarket: { term: "marché baissier", def: "Une période prolongée durant laquelle les prix baissent globalement et où la prudence domine." },
  altseason: { term: "saison des altcoins", def: "Une période durant laquelle des coins autres que les plus importants montent particulièrement vite." },
  marketCorrection: { term: "correction de marché", def: "Un repli de prix modéré et normal (souvent d'environ 10 %) qui interrompt une hausse sans y mettre fin." },
  marketCrash: { term: "krach de marché", def: "Une chute de prix soudaine et sévère, bien plus brutale et profonde qu'une correction normale." },
  stablecoin: { term: "stablecoin", def: "Un token conçu pour conserver une valeur stable, généralement ancrée un pour un à une monnaie comme le dollar américain." },
  peg: { term: "ancrage", def: "La valeur fixe qu'un stablecoin cherche à suivre, comme un USDC valant un dollar américain." },
  depeg: { term: "décrochage", def: "Lorsqu'un stablecoin s'éloigne de sa valeur cible et ne correspond plus à son ancrage." },
  taxableEvent: { term: "fait générateur d'impôt", def: "Un moment que le fisc peut considérer comme imposable — par exemple vendre, échanger ou être payé en crypto." },
  mica: { term: "MiCA", def: "Markets in Crypto-Assets — le règlement de l'Union européenne qui encadre les services de cryptos et les stablecoins." },
  capitalGains: { term: "plus-value", def: "Le profit réalisé lorsque vous vendez ou échangez un actif pour plus que ce que vous avez payé, souvent soumis à l'impôt." },
  pumpAndDump: { term: "pump-and-dump", def: "Manœuvre où l'on fait du battage autour d'un token pour en faire monter le prix, puis on le revend aux nouveaux acheteurs en le laissant s'effondrer." },
  shilling: { term: "shilling", def: "Promouvoir bruyamment un token, souvent en cachant qu'on le détient et qu'on profite si d'autres achètent." },
  fakePartnership: { term: "fausse association", def: "Affirmation inventée ou exagérée selon laquelle un token serait lié à une entreprise connue, utilisée pour créer une confiance trompeuse." },
};

const es: Glossary = {
  fomo: { term: "FOMO", def: "El miedo a quedarse fuera: el impulso de comprar porque un precio está subiendo y temes quedarte atrás." },
  fud: { term: "FUD", def: "Miedo, incertidumbre y duda: comentarios negativos que se difunden para asustar a la gente y empujarla a vender." },
  lossAversion: { term: "aversión a la pérdida", def: "Sentir el dolor de una pérdida aproximadamente el doble de fuerte que el placer de una ganancia equivalente." },
  tradingPlan: { term: "plan de trading", def: "Un conjunto de reglas decididas de antemano: qué comprar, y dónde tomar ganancias o cortar una pérdida." },
  bullMarket: { term: "mercado alcista", def: "Un tramo sostenido en el que los precios suben de forma generalizada y predomina el optimismo." },
  bearMarket: { term: "mercado bajista", def: "Un tramo sostenido en el que los precios bajan de forma generalizada y domina la cautela." },
  altseason: { term: "temporada de altcoins", def: "Un periodo en el que monedas distintas de las más grandes suben especialmente rápido." },
  marketCorrection: { term: "corrección de mercado", def: "Una caída de precio moderada y normal (a menudo de alrededor del 10%) que interrumpe una subida sin ponerle fin." },
  marketCrash: { term: "desplome de mercado", def: "Una caída de precio repentina y severa, mucho más pronunciada y profunda que una corrección normal." },
  stablecoin: { term: "stablecoin", def: "Un token diseñado para mantener un valor estable, normalmente anclado uno a uno a una moneda como el dólar estadounidense." },
  peg: { term: "peg", def: "El valor fijo que una stablecoin busca seguir, como que un USDC equivalga a un dólar estadounidense." },
  depeg: { term: "depeg", def: "Cuando una stablecoin se aleja de su valor previsto y deja de coincidir con su peg." },
  taxableEvent: { term: "hecho imponible", def: "Un momento que las autoridades fiscales pueden tratar como sujeto a impuestos, como vender, intercambiar o recibir un pago en criptomonedas." },
  mica: { term: "MiCA", def: "Markets in Crypto-Assets, el reglamento de la Unión Europea que regula los servicios de criptomonedas y las stablecoins." },
  capitalGains: { term: "ganancias de capital", def: "El beneficio obtenido al vender o intercambiar un activo por más de lo que pagaste, que a menudo tributa." },
  pumpAndDump: { term: "pump-and-dump", def: "Un esquema en el que se genera bombo alrededor de un token para empujar su precio al alza y luego se vende a los nuevos compradores, dejando que el precio se desplome." },
  shilling: { term: "shilling", def: "Promocionar un token a viva voz, a menudo ocultando que uno lo posee y se beneficia si otros compran." },
  fakePartnership: { term: "alianza falsa", def: "Una afirmación inventada o exagerada de que un token está vinculado a una empresa conocida, usada para generar una confianza falsa." },
};

/** New glossary terms per locale, keyed by term id. Merge into ./glossary.ts at green-light. */
export const PENDING_GLOSSARY: Record<"en" | "nl" | "fr" | "es", Glossary> = { en, nl, fr, es };
