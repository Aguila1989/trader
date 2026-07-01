// Plain-language glossary for the Academy's inline "What does this mean?"
// tooltips. Keyed by a stable term id; each locale gives the term as it is
// SPELLED in that language's lessons (so matching works) plus a one-sentence
// beginner definition. The lesson view links the first occurrence of each term.
//
// nl/fr/es are translated to match the localized lesson vocabulary; any locale
// without an entry for a term simply shows no tooltip for it (English fallback
// at the locale level via glossaryFor).
import type { Locale } from "./types";
// New BASIC terms introduced by the Academy expansion (chapters 22–26).
import { PENDING_GLOSSARY } from "./glossary.pending";

export interface GlossaryEntry {
  term: string;
  def: string;
}
export type Glossary = Record<string, GlossaryEntry>;

const en: Glossary = {
  cryptocurrency: { term: "cryptocurrency", def: "Digital money that lives on a shared network instead of in a bank — no single company controls it." },
  blockchain: { term: "blockchain", def: "A shared ledger thousands of computers each hold a copy of, so nobody can secretly change the records." },
  wallet: { term: "wallet", def: "Your account on the network: a public address you can share, plus a secret key only you hold." },
  token: { term: "token", def: "An asset someone issues on top of an existing blockchain (e.g. USDC on Stellar), as opposed to the network's own coin." },
  coin: { term: "coin", def: "The native asset of a blockchain (XLM for Stellar), used to pay its network fees." },
  orderBook: { term: "order book", def: "A live noticeboard of buy and sell offers; the best prices sit at the top." },
  bid: { term: "bid", def: "The highest price a buyer is currently willing to pay." },
  ask: { term: "ask", def: "The lowest price a seller is currently willing to accept." },
  spread: { term: "spread", def: "The gap between the best bid and best ask — a wider spread means a higher hidden cost per trade." },
  slippage: { term: "slippage", def: "Paying a slightly worse price than expected because the market moved as your order filled." },
  liquidity: { term: "liquidity", def: "How easily you can buy or sell without moving the price — like cash (instant) versus a house (slow)." },
  marketOrder: { term: "market order", def: "An order that fills immediately at the best available price." },
  limitOrder: { term: "limit order", def: "An order that only fills at the price you set or better." },
  stopLoss: { term: "stop loss", def: "An automatic instruction to sell if the price falls to a set level — a safety net that caps your loss." },
  trailingStop: { term: "trailing stop", def: "A stop loss that ratchets up as the price rises but never moves down, locking in gains." },
  highWaterMark: { term: "high water mark", def: "The best price seen since a trailing stop was set; the trailing trigger is measured from it." },
  volatility: { term: "volatility", def: "How sharply a price swings up and down — higher volatility means higher risk." },
  drawdown: { term: "drawdown", def: "The drop from a peak portfolio value to a later low point." },
  targetPrice: { term: "target price", def: "The price at which you plan to take profit on a trade." },
  invalidationPrice: { term: "invalidation price", def: "The price that proves the trade idea wrong — typically where you place the stop." },
  trustline: { term: "trustline", def: "An opt-in that lets your Stellar account hold a specific non-native token before you can trade it." },
  pathPayment: { term: "path payment", def: "A Stellar payment that converts one asset to another in a single atomic transaction, hopping through markets." },
  sdex: { term: "SDEX", def: "The Stellar Decentralized Exchange — an order book built into the Stellar network itself." },
  amm: { term: "AMM", def: "An automated market maker: a pool of two assets you swap against, instead of matching another trader's offer." },
  candlestick: { term: "candlestick", def: "A chart bar showing the open, high, low and close price for one time period." },
  secretKey: { term: "secret key", def: "The private key (starts with S) that signs transactions — whoever holds it controls the funds." },
  confidenceScore: { term: "confidence score", def: "The AI's 0–100 conviction in a proposal; the backend only auto-executes scores at or above your threshold." },
  maker: { term: "maker", def: "An order that rests on the book and waits to be filled, capturing the spread instead of paying it." },
  taker: { term: "taker", def: "An order that crosses the spread to fill immediately against a resting offer." },
};

const nl: Glossary = {
  cryptocurrency: { term: "cryptomunt", def: "Digitaal geld dat op een gedeeld netwerk leeft in plaats van bij een bank, zonder dat een enkel bedrijf het beheert." },
  blockchain: { term: "blockchain", def: "Een gedeeld grootboek waarvan duizenden computers elk een kopie bewaren, zodat niemand de gegevens stiekem kan wijzigen." },
  wallet: { term: "wallet", def: "Je account op het netwerk: een publieke sleutel die je kunt delen, plus een geheime sleutel die alleen jij hebt." },
  token: { term: "token", def: "Een asset dat iemand uitgeeft bovenop een bestaande blockchain (bijvoorbeeld USDC op Stellar), in tegenstelling tot de eigen munt van het netwerk." },
  coin: { term: "munt", def: "Het oorspronkelijke asset van een blockchain (XLM voor Stellar), gebruikt om de netwerkkosten te betalen." },
  orderBook: { term: "orderboek", def: "Een live overzicht van koop- en verkooporders, met de beste prijzen bovenaan." },
  bid: { term: "bid", def: "De hoogste prijs die een koper op dit moment bereid is te betalen." },
  ask: { term: "ask", def: "De laagste prijs die een verkoper op dit moment bereid is te accepteren." },
  spread: { term: "spread", def: "Het verschil tussen de beste bid en de beste ask; een bredere spread betekent een hogere verborgen kost per trade." },
  slippage: { term: "slippage", def: "Een iets slechtere prijs betalen dan verwacht omdat de markt bewoog terwijl je order werd uitgevoerd." },
  liquidity: { term: "liquiditeit", def: "Hoe makkelijk je kunt kopen of verkopen zonder de prijs te verschuiven, zoals contant geld versus een huis." },
  marketOrder: { term: "market-order", def: "Een order die meteen wordt uitgevoerd tegen de beste beschikbare prijs." },
  limitOrder: { term: "limit-order", def: "Een order die alleen wordt uitgevoerd tegen de prijs die je instelt of beter." },
  stopLoss: { term: "stop loss", def: "Een automatische instructie om te verkopen als de prijs tot een ingesteld niveau daalt, een vangnet dat je verlies beperkt." },
  trailingStop: { term: "trailing stop", def: "Een stop loss die meestijgt als de prijs stijgt maar nooit daalt, waardoor winst wordt vastgezet." },
  highWaterMark: { term: "high water mark", def: "De beste prijs sinds een trailing stop is ingesteld; daarvandaan wordt de trailing-trigger gemeten." },
  volatility: { term: "volatiliteit", def: "Hoe sterk een prijs op en neer schommelt; meer volatiliteit betekent meer risico." },
  drawdown: { term: "drawdown", def: "De daling van een piek in de portefeuillewaarde naar een later dieptepunt." },
  targetPrice: { term: "doelprijs", def: "De prijs waarop je van plan bent winst te nemen op een trade." },
  invalidationPrice: { term: "invalidatieprijs", def: "De prijs die bewijst dat het trade-idee fout is, doorgaans waar je de stop plaatst." },
  trustline: { term: "trustline", def: "Een opt-in waarmee je Stellar-account een specifiek niet-oorspronkelijk token mag aanhouden voordat je het kunt verhandelen." },
  pathPayment: { term: "path payment", def: "Een Stellar-betaling die het ene asset in een andere omzet in een enkele atomische transactie, hoppend door markten." },
  sdex: { term: "SDEX", def: "De Stellar Decentralized Exchange, een orderboek dat in het Stellar-netwerk zelf is ingebouwd." },
  amm: { term: "AMM", def: "Een automated market maker: een pool van twee assets waartegen je swapt, in plaats van te matchen met de order van een andere trader." },
  candlestick: { term: "candlestick", def: "Een grafiekbalk die de open-, hoogste, laagste en slotprijs voor een tijdsperiode toont." },
  secretKey: { term: "geheime sleutel", def: "De privesleutel (begint met S) die transacties ondertekent; wie hem heeft, beheert het geld." },
  confidenceScore: { term: "confidence score", def: "De overtuiging van de AI in een voorstel op een schaal van 0 tot 100; de backend voert alleen scores op of boven jouw drempel automatisch uit." },
  maker: { term: "maker", def: "Een order die op het boek blijft staan en wacht om gevuld te worden, en zo de spread vangt in plaats van die te betalen." },
  taker: { term: "taker", def: "Een order die de spread kruist om meteen te vullen tegen een wachtende order." },
};

const fr: Glossary = {
  cryptocurrency: { term: "cryptomonnaie", def: "De l'argent numerique qui vit sur un reseau partage plutot que dans une banque, sans qu'une seule entreprise le controle." },
  blockchain: { term: "blockchain", def: "Un registre partage dont des milliers d'ordinateurs detiennent chacun une copie, de sorte que personne ne peut modifier les donnees en secret." },
  wallet: { term: "portefeuille", def: "Votre compte sur le reseau : une cle publique que vous pouvez partager, plus une cle secrete que vous seul detenez." },
  token: { term: "token", def: "Un actif emis par quelqu'un par-dessus une blockchain existante (par exemple l'USDC sur Stellar), par opposition au coin natif du reseau." },
  coin: { term: "coin", def: "L'actif natif d'une blockchain (le XLM pour Stellar), utilise pour payer les frais de reseau." },
  orderBook: { term: "carnet d'ordres", def: "Un tableau en direct des offres d'achat et de vente, les meilleurs prix se trouvant en haut." },
  bid: { term: "bid", def: "Le prix le plus eleve qu'un acheteur est actuellement pret a payer." },
  ask: { term: "ask", def: "Le prix le plus bas qu'un vendeur est actuellement pret a accepter." },
  spread: { term: "spread", def: "L'ecart entre le meilleur bid et le meilleur ask ; un spread plus large signifie un cout cache plus eleve par trade." },
  slippage: { term: "slippage", def: "Payer un prix un peu moins bon que prevu parce que le marche a bouge pendant l'execution de votre ordre." },
  liquidity: { term: "liquidite", def: "La facilite avec laquelle vous pouvez acheter ou vendre sans deplacer le prix, comme du liquide face a une maison." },
  marketOrder: { term: "ordre au marche", def: "Un ordre qui s'execute immediatement au meilleur prix disponible." },
  limitOrder: { term: "ordre a cours limite", def: "Un ordre qui ne s'execute qu'au prix que vous fixez ou a un meilleur prix." },
  stopLoss: { term: "stop loss", def: "Une instruction automatique de vendre si le prix tombe a un niveau defini, un filet de securite qui plafonne votre perte." },
  trailingStop: { term: "trailing stop", def: "Un stop loss qui remonte quand le prix monte mais ne redescend jamais, verrouillant les gains." },
  highWaterMark: { term: "high water mark", def: "Le meilleur prix vu depuis qu'un trailing stop a ete place ; le seuil suiveur se mesure a partir de lui." },
  volatility: { term: "volatilite", def: "L'ampleur des oscillations d'un prix vers le haut et le bas ; plus de volatilite signifie plus de risque." },
  drawdown: { term: "drawdown", def: "La baisse depuis un sommet de la valeur du portefeuille jusqu'a un creux ulterieur." },
  targetPrice: { term: "prix cible", def: "Le prix auquel vous prevoyez de prendre votre profit sur un trade." },
  invalidationPrice: { term: "prix d'invalidation", def: "Le prix qui prouve que l'idee de trade est fausse, generalement la ou vous placez le stop." },
  trustline: { term: "trustline", def: "Un accord explicite qui autorise votre compte Stellar a detenir un token non natif precis avant de pouvoir le trader." },
  pathPayment: { term: "path payment", def: "Un paiement Stellar qui convertit un actif en un autre dans une seule transaction atomique, en passant par plusieurs marches." },
  sdex: { term: "SDEX", def: "Le Stellar Decentralized Exchange, un carnet d'ordres integre au reseau Stellar lui-meme." },
  amm: { term: "AMM", def: "Un teneur de marche automatise : un pool de deux actifs contre lequel vous swappez, au lieu de matcher l'offre d'un autre trader." },
  candlestick: { term: "chandelier", def: "Une barre de graphique montrant le prix d'ouverture, le plus haut, le plus bas et la cloture pour une periode." },
  secretKey: { term: "cle secrete", def: "La cle privee (qui commence par S) qui signe les transactions ; quiconque la detient controle les fonds." },
  confidenceScore: { term: "confidence score", def: "La conviction de l'IA dans une proposition, sur une echelle de 0 a 100 ; le backend n'execute automatiquement que les scores au niveau de votre seuil ou au-dessus." },
  maker: { term: "maker", def: "Un ordre qui se pose sur le carnet et attend d'etre execute, captant le spread au lieu de le payer." },
  taker: { term: "taker", def: "Un ordre qui croise le spread pour s'executer immediatement face a une offre en attente." },
};

const es: Glossary = {
  cryptocurrency: { term: "criptomoneda", def: "Dinero digital que vive en una red compartida en lugar de en un banco, sin que una sola empresa lo controle." },
  blockchain: { term: "blockchain", def: "Un libro de registro compartido del que miles de computadoras guardan cada una una copia, de modo que nadie puede cambiar los datos a escondidas." },
  wallet: { term: "billetera", def: "Tu cuenta en la red: una clave publica que puedes compartir, mas una clave secreta que solo tu tienes." },
  token: { term: "token", def: "Un activo que alguien emite sobre una blockchain existente (por ejemplo USDC en Stellar), a diferencia de la moneda propia de la red." },
  coin: { term: "moneda", def: "El activo nativo de una blockchain (XLM en Stellar), usado para pagar las comisiones de red." },
  orderBook: { term: "libro de ordenes", def: "Un tablero en vivo de ofertas de compra y de venta, con los mejores precios arriba." },
  bid: { term: "bid", def: "El precio mas alto que un comprador esta dispuesto a pagar en este momento." },
  ask: { term: "ask", def: "El precio mas bajo que un vendedor esta dispuesto a aceptar en este momento." },
  spread: { term: "spread", def: "La diferencia entre el mejor bid y el mejor ask; un spread mas amplio significa un mayor coste oculto por trade." },
  slippage: { term: "slippage", def: "Pagar un precio algo peor del esperado porque el mercado se movio mientras se ejecutaba tu orden." },
  liquidity: { term: "liquidez", def: "Lo facil que es comprar o vender sin mover el precio, como el efectivo frente a una casa." },
  marketOrder: { term: "orden market", def: "Una orden que se ejecuta de inmediato al mejor precio disponible." },
  limitOrder: { term: "orden limit", def: "Una orden que solo se ejecuta al precio que fijas o a uno mejor." },
  stopLoss: { term: "stop loss", def: "Una instruccion automatica de vender si el precio cae a un nivel definido, una red de seguridad que limita tu perdida." },
  trailingStop: { term: "trailing stop", def: "Un stop loss que sube cuando el precio sube pero nunca baja, asegurando las ganancias." },
  highWaterMark: { term: "high water mark", def: "El mejor precio visto desde que se fijo un trailing stop; el trigger del trailing se mide a partir de el." },
  volatility: { term: "volatilidad", def: "Cuanto oscila un precio hacia arriba y hacia abajo; mas volatilidad significa mas riesgo." },
  drawdown: { term: "drawdown", def: "La caida desde un maximo del valor de la cartera hasta un minimo posterior." },
  targetPrice: { term: "precio objetivo", def: "El precio al que planeas tomar ganancias en un trade." },
  invalidationPrice: { term: "precio de invalidacion", def: "El precio que demuestra que la idea del trade es erronea, normalmente donde colocas el stop." },
  trustline: { term: "trustline", def: "Un consentimiento que permite a tu cuenta de Stellar mantener un token no nativo concreto antes de poder operarlo." },
  pathPayment: { term: "path payment", def: "Un pago de Stellar que convierte un activo en otro en una unica transaccion atomica, saltando por varios mercados." },
  sdex: { term: "SDEX", def: "El Stellar Decentralized Exchange, un libro de ordenes integrado en la propia red de Stellar." },
  amm: { term: "AMM", def: "Un creador de mercado automatizado: un pool de dos activos contra el que intercambias, en lugar de emparejar la oferta de otro trader." },
  candlestick: { term: "vela", def: "Una barra de grafico que muestra el precio de apertura, maximo, minimo y cierre de un periodo de tiempo." },
  secretKey: { term: "clave secreta", def: "La clave privada (empieza con S) que firma las transacciones; quien la tenga controla los fondos." },
  confidenceScore: { term: "confidence score", def: "La conviccion de la IA en una propuesta, en una escala de 0 a 100; el backend solo ejecuta automaticamente las puntuaciones que igualan o superan tu umbral." },
  maker: { term: "maker", def: "Una orden que queda en reposo en el libro y espera a ejecutarse, capturando el spread en lugar de pagarlo." },
  taker: { term: "taker", def: "Una orden que cruza el spread para ejecutarse de inmediato contra una oferta en espera." },
};

export const GLOSSARY: Partial<Record<Locale, Glossary>> = {
  en: { ...en, ...PENDING_GLOSSARY.en },
  nl: { ...nl, ...PENDING_GLOSSARY.nl },
  fr: { ...fr, ...PENDING_GLOSSARY.fr },
  es: { ...es, ...PENDING_GLOSSARY.es },
};

/** The glossary for a locale, falling back to English when not yet translated. */
export function glossaryFor(locale: Locale): Glossary {
  return GLOSSARY[locale] ?? en;
}
