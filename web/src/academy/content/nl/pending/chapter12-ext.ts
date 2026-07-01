// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Microstructuur-uitbreiding voor hoofdstuk 12 ("Geavanceerde Stellar-functies").
// Dit is GEEN losstaand hoofdstuk. Bij groen licht voeg je c12ExtraLessons toe aan
// chapter12.lessons[] (na c12-l5) en c12ExtraQuiz aan chapter12.quiz[] (na
// c12-q5). De id's zetten de bestaande nummering voort: lessen c12-l6/c12-l7, quiz
// c12-q6/c12-q7. De les over maker/taker gebruikt de live-glossariumtermen "maker" en
// "taker" letterlijk, zodat hun eerste voorkomen automatisch naar een tooltip linkt.
import type { Lesson, QuizQuestion } from "../../../types";

export const c12ExtraLessons: Lesson[] = [
  {
    id: "c12-l6",
    title: "Maker- versus taker-dynamiek en hoe die je strategie beïnvloedt",
    paragraphs: [
      "Elke fill op het SDEX-orderboek heeft twee kanten, en het protocol behandelt ze qua kosten heel verschillend, ook al brengt het aan geen van beide een procentuele vergoeding in rekening. Het orderboek wordt gematcht op basis van prijs-dan-tijd-prioriteit: op elk prijsniveau wordt de beste prijs als eerste ingevuld, en onder orders die dezelfde prijs delen, wordt de oudste vóór de nieuwere ingevuld. Juist die ene regel creëert de twee rollen die je moet begrijpen voordat je überhaupt over strategie kunt nadenken.",
      "Een maker is een order dat op het boek blijft staan en wacht. Wanneer je een manageSellOffer of manageBuyOffer indient tegen een prijs die het huidige boek niet kruist, wordt die niet meteen uitgevoerd; hij sluit aan in de wachtrij op zijn prijsniveau en blijft daar staan, en levert zo liquiditeit waartegen iemand anders kan handelen. Doordat hij heeft gewacht, verdient hij zijn prijs: een rustende bid wordt op de bid ingevuld, een rustende ask op de ask. In feite vangt de maker de spread op in plaats van hem te betalen. De prijs die je voor het maker-zijn betaalt, is tijd en fill-risico, want de markt kan wegbewegen voordat iemand naar jou toe kruist, en je order wordt misschien nooit ingevuld.",
      "Een taker is het spiegelbeeld. Wanneer je een order indient tegen een prijs die het bestaande boek kruist, of je hebt gewoon een onmiddellijke fill nodig, dan neem je de beste rustende order aan de andere kant weg. Je krijgt zekerheid van uitvoering binnen de eerstvolgende ledger-sluiting, maar je betaalt daarvoor door de spread te kruisen: kopen op de ask, verkopen op de bid. Bij een edge die in enkelcijferige basispunten wordt gemeten, kan het prijsgeven van een spread van 10 basispunten bij de instap en nog eens bij de uitstap de volledige theoretische winst van een heen-en-weertrade wegvagen. Daarom is het onderscheid tussen maker en taker geen academische boekhouding; het is het verschil tussen een spread die je verdient en een spread die je betaalt.",
      "De strategie volgt daar rechtstreeks uit. Een spread-capture-strategie, wat deze bot uitvoert, wil zo vaak mogelijk maker zijn en is dus maker-first: hij laat zijn order rusten op de beste bid of ask en laat tegenpartijen naar hem toe kruisen, waardoor de spread van een kostenpost een bron van edge wordt. Hij kruist alleen als taker wanneer een onmiddellijke fill werkelijk zwaarder weegt dan de spread, bijvoorbeeld om een positie te sluiten die zijn stop heeft geraakt. Een momentum- of nieuwsgedreven strategie maakt de omgekeerde afweging en accepteert de spread-kosten van de taker om gegarandeerd in de markt te zitten voordat de beweging doorzet. Geen van beide rollen is universeel beter; de juiste hangt ervan af of zekerheid van de fill of prijsverbetering meer waard is voor de trade die vóór je ligt.",
    ],
    example:
      "Het XLM/USDC-boek toont een beste bid van 0,1170 en een beste ask van 0,1180, een spread van 10 basispunten. Als je nu als taker koopt, neem je de ask weg en betaal je 0,1180. Als je als maker handelt, laat je in plaats daarvan een kooporder rusten op 0,1170 en sluit je aan in de bid-wachtrij, achter eventuele oudere orders daar. Wanneer een verkoper later omlaag kruist naar 0,1170, wordt je order ingevuld op 0,1170 binnen die ledger-sluiting. Zelfde asset, zelfde moment: de taker betaalde 0,0010 per XLM aan spread, terwijl de maker die opving, een verschil van de volledige spread van 10 basispunten tussen de twee rollen bij één enkele fill.",
  },
  {
    id: "c12-l7",
    title: "Prijsimpact en hoe je die berekent voor een grote order",
    paragraphs: [
      "Prijsimpact is wat er gebeurt wanneer je order groter is dan de liquiditeit die tegen de beste prijs klaarligt. Op de SDEX is het orderboek een stapel afzonderlijke rustende orders tegen oplopende (of aflopende) prijzen. Een kleine taker-order wordt volledig ingevuld tegen het bovenste niveau en wordt uitgevoerd dicht bij de gequoteerde prijs. Een grote taker-order put het bovenste niveau uit, vult vervolgens het volgende niveau tegen een slechtere prijs, dan het niveau daarna, en loopt zo het boek op tot de hele hoeveelheid is ingevuld. Je gemiddelde uitvoeringsprijs is daardoor slechter dan de prijs die je gequoteerd zag, en het gat tussen die twee is de prijsimpact van je order.",
      "Je kunt de impact vóór je trade rechtstreeks inschatten aan de hand van de weergegeven diepte, want het boek vertelt je precies hoeveel omvang er op elk niveau klaarligt. Loop de niveaus in volgorde af en vul je hoeveelheid gulzig in: neem alles tegen de beste prijs, dan wat je nog nodig hebt tegen de volgende prijs, enzovoort tot je order op is. Vermenigvuldig de hoeveelheid die je op elk niveau neemt met de prijs van dat niveau, tel die producten op, en deel door je totale hoeveelheid om je volumegewogen gemiddelde fill-prijs te krijgen. Vergelijk dat gemiddelde met de beste-prijsquote waarmee je begon, en het verschil, uitgedrukt als percentage, is je geschatte prijsimpact. Hoe dieper het boek nabij de top, hoe kleiner de impact voor dezelfde ordergrootte; een dun boek betekent dat zelfs een bescheiden order meerdere niveaus afloopt.",
      "Prijsimpact, slippage en liquiditeit zijn drie zienswijzen op hetzelfde onderliggende gegeven, en het loont om precies te zijn over hoe ze zich verhouden. Slippage, behandeld in \"Prijzen begrijpen\" (hoofdstuk 2), is het verschil tussen de prijs die je verwachtte en de prijs die je daadwerkelijk kreeg; prijsimpact is de specifieke component van slippage die je eigen order veroorzaakt door diepte te verbruiken, in tegenstelling tot slippage doordat de markt beweegt tussen quote en fill. Liquiditeit is simpelweg hoeveel diepte er nabij de top van het boek is opgestapeld: diepe liquiditeit absorbeert een grote order met weinig impact, dunne liquiditeit niet. \"Tokenbeoordeling op de Stellar-chain\" (hoofdstuk 21) legt uit hoe de app orderboekdiepte optelt tot de liquiditeitssignalen waarop het tokens scoort; die opgetelde diepte is precies dezelfde ladder die je hier afloopt om de impact te schatten.",
      "Bij een grote order is de praktische reactie de impact te verkleinen in plaats van hem te accepteren. Door een grote order in de loop van de tijd op te splitsen in kleinere stukken, laat je elk stuk dichter bij de top van een zich aanvullend boek invullen, in plaats van in één keer één diep gat af te lopen. Door de order als maker te laten rusten op een limietprijs, in plaats van als taker te kruisen, vermijd je het aflopen van het boek volledig, ten koste van zekerheid over de fill. En de instelbare slippage-tolerantie van de app op het formulier voor Handmatig handelen is je vangrail: die begrenst hoe ver de fill van de quote mag afwijken, zodat een order waarvan de geschatte impact je tolerantie overschrijdt, wordt geweigerd voordat hij wordt uitgevoerd tegen een prijs die je nooit bedoeld hebt.",
    ],
    example:
      "Je wilt 5.000 XLM kopen als taker. De ask-ladder aan de USDC-kant toont 2.000 XLM aangeboden tegen 0,1180, nog eens 2.000 tegen 0,1185, en 3.000 tegen 0,1195. Je order vult 2.000 tegen 0,1180, 2.000 tegen 0,1185, en de laatste 1.000 tegen 0,1195 in, wat 236,0 + 237,0 + 119,5 = 592,5 USDC kost. Deel door 5.000 en je gemiddelde fill-prijs is 0,1185, tegenover de 0,1180 die je bovenaan gequoteerd zag. Dat is 0,42 procent prijsimpact, volledig veroorzaakt doordat je order het boek afloopt. Door hem op te splitsen in vijf orders van 1.000 XLM, of door een limietorder te laten rusten op 0,1180, zou je die impact telkens verkleinen.",
  },
];

export const c12ExtraQuiz: QuizQuestion[] = [
  {
    id: "c12-q6",
    prompt: "Wat onderscheidt in het SDEX-orderboek een maker van een taker, en waarom is deze bot liever maker?",
    options: [
      {
        text: "Een maker laat een order op het boek rusten en wordt, wanneer iemand naar hem toe kruist, ingevuld tegen zijn eigen prijs en vangt de spread op; een taker kruist het boek voor een onmiddellijke fill en betaalt de spread. De bot is maker-first, zodat hij de spread verdient in plaats van hem te betalen.",
        explanation:
          "Juist. Onder prijs-dan-tijd-prioriteit wordt een rustende maker-order ingevuld tegen zijn geplaatste prijs, waardoor de spread verdiende edge wordt, terwijl een taker de andere kant wegneemt en de spread prijsgeeft voor zekerheid van de fill. Een spread-capture-strategie laat orders daarom maker-first rusten en neemt alleen als taker deel wanneer een onmiddellijke fill zwaarder weegt dan de spread.",
      },
      {
        text: "Een maker betaalt een procentuele commissie aan de exchange terwijl een taker gratis handelt, dus de bot vermijdt maker te zijn om de vergoeding te ontwijken.",
        explanation:
          "Onjuist. De SDEX brengt aan geen van beide kanten een procentuele commissie in rekening, alleen de piepkleine basisvergoeding per operatie; het echte verschil is dat de taker kruist en de spread betaalt terwijl de maker rust en die opvangt, en dat is precies waarom de bot liever maker is.",
      },
      {
        text: "Een taker rust op het boek en wacht, terwijl een maker meteen kruist, en de bot is liever taker omdat rustende orders nooit worden ingevuld.",
        explanation:
          "Onjuist. De rollen zijn omgedraaid: de maker is degene die rust en wacht, de taker is degene die meteen kruist. Rustende maker-orders worden wél ingevuld wanneer een tegenpartij naar hen toe kruist, en de bot is juist maker-first om de spread op die fills op te vangen.",
      },
      {
        text: "Een maker wordt altijd sneller ingevuld dan een taker omdat de nieuwste orders als eerste worden gematcht, dus de bot kiest maker vanwege de snelheid.",
        explanation:
          "Onjuist. Het matchen gebeurt oudste-eerst bij een gegeven prijs, niet nieuwste-eerst, en de taker is de rol met gegarandeerde onmiddellijke uitvoering. De bot verkiest maker vanwege spread capture, en accepteert daarbij tragere en onzekere fills, niet vanwege snelheid.",
      },
    ],
    correctIndex: 0,
  },
  {
    id: "c12-q7",
    prompt: "Een ask-ladder toont 2.000 XLM aangeboden tegen 0,1180, dan 2.000 tegen 0,1185, dan 3.000 tegen 0,1195. Je stuurt een taker-kooporder voor 5.000 XLM. Hoe schat je de prijsimpact in, en hoeveel is die?",
    options: [
      {
        text: "Ga ervan uit dat de hele order wordt ingevuld tegen de topprijs van 0,1180, dus de prijsimpact is nul.",
        explanation:
          "Onjuist. Er rust maar 2.000 XLM tegen 0,1180. Een order van 5.000 XLM put dat niveau uit en loopt op naar slechtere niveaus, dus de gemiddelde fill-prijs ligt boven 0,1180 en de impact is niet nul.",
      },
      {
        text: "Loop de ladder gulzig af, neem 2.000 tegen 0,1180, 2.000 tegen 0,1185 en 1.000 tegen 0,1195, wat een volumegewogen gemiddelde van 0,1185 oplevert, ongeveer 0,42 procent slechter dan de quote van 0,1180.",
        explanation:
          "Juist. De order over de niveaus invullen kost 236,0 + 237,0 + 119,5 = 592,5 USDC voor 5.000 XLM, een gemiddelde van 0,1185. Tegenover de top-of-book-quote van 0,1180 is dat ruwweg 0,42 procent prijsimpact, de kosten van je eigen order die diepte verbruikt terwijl hij het boek afloopt.",
      },
      {
        text: "Gebruik alleen het diepste niveau, 0,1195, als fill-prijs, wat ongeveer 1,3 procent impact oplevert voor de hele 5.000 XLM.",
        explanation:
          "Onjuist. De order wordt niet volledig ingevuld tegen het slechtste niveau; hij vult elk niveau op zijn beurt in tot hij op is, dus je moet volumegewogen rekenen over 0,1180, 0,1185 en 0,1195. Dat levert een gemiddelde van 0,1185 op en ongeveer 0,42 procent impact, niet 1,3 procent.",
      },
    ],
    correctIndex: 1,
  },
];
