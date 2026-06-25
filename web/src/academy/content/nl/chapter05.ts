import type { Chapter } from "../../types";

export const chapter05: Chapter = {
  id: "c5",
  number: 5,
  level: "ADVANCED",
  title: "Stop losses",
  description: "Hoe een stop loss je verlies beperkt, hoe je er handmatig een instelt, hoe de AI ze beheert en wat er gebeurt op het moment dat een stop afgaat.",
  lessons: [
    {
      id: "c5-l1",
      title: "Wat is een stop loss en waarom zou je er een gebruiken?",
      paragraphs: [
        "Een stop loss is een vooraf ingestelde exit. Je bepaalt op voorhand de slechtste prijs die je bereid bent te accepteren, en de bot houdt de markt voor je in de gaten. Op het moment dat de markt dat niveau bereikt, sluit hij de positie zodat een klein verlies nooit stilletjes uitgroeit tot een groot verlies. Het hele idee is om emotie en reactietijd uit de beslissing te halen terwijl je slaapt of weg bent van je dashboard.",
        "Een stop kent richting. Bij een long-positie, waarbij je de munt dus echt aanhoudt, ligt de stop onder de huidige prijs en gaat hij af wanneer de prijs daalt tot of het triggerniveau raakt. Zo bescherm je de waarde die je al aanhoudt in plaats van achter nieuwe entries aan te jagen.",
        "Stops zijn geen gratis verzekering. Zet je de trigger te dicht op de prijs, dan tikt normale ruis je eruit; zet je hem te ver weg, dan slik je een groter verlies. De app houdt ook een achtervang-stop-loss-percentage aan als standaard vangnet, zodat zelfs een onbeschermde positie nog een bodem heeft.",
      ],
      example: "Je houdt 1.000 XLM aan, gekocht op 0,118 USDC. Je zet een stop-trigger op 0,112 USDC. Zolang XLM tussen 0,118 en 0,114 schommelt gebeurt er niets. Zakt de prijs bij een sell-off tot 0,112, dan gaat de stop af en stapt de bot uit, waardoor je verlies wordt beperkt tot ongeveer 6 USDC in plaats van mee te zakken tot 0,100, wat je zo'n 18 USDC zou hebben gekost.",
    },
    {
      id: "c5-l2",
      title: "Hoe stel je een stop loss in deze app in (handmatig)",
      paragraphs: [
        "Open het stop-loss-paneel en gebruik het onderdeel Handmatige stop losses. Er is een schakelaar tussen Regular Stop Loss, een vaste triggerprijs, en Trailing Stop Loss, die de prijs naar boven volgt en die in het volgende hoofdstuk aan bod komt. Kies voor een handmatige stop de optie Regular.",
        "Vul de vier velden in. Kies de Token die je aanhoudt en de Quote waarin je hem prijst, meestal USDC. Voer de Triggerprijs in, het niveau waarop je eruit wilt. Kies daarna hoeveel je wilt sluiten: met Alles verkopen liquideer je de volledige positie, of stel een specifieke Hoeveelheid in om er maar een deel uit te halen en de rest in de markt te houden.",
        "Eenmaal opgeslagen verschijnt de stop in de handmatige lijst met een Annuleren-knop. Hij doet niets tot de prijs de trigger bereikt; annuleren haalt de bescherming meteen weg. Je kunt meerdere stops tegelijk op hetzelfde paar aanhouden, bijvoorbeeld een deelstop hoger op en een volledige achtervang lager op.",
      ],
      example: "Je houdt 2.000 XLM aan en wilt het grootste deel beschermen. Schakel naar Regular Stop Loss, zet Token XLM, Quote USDC, Trigger 0,110 en Hoeveelheid 1.500 in plaats van Alles verkopen. Daalt XLM tot 0,110, dan verkoopt de bot 1.500 XLM en houd je 500 XLM nog in de markt. De stop verschijnt dan in de handmatige lijst, waar je hem kunt Annuleren als je je bedenkt.",
    },
    {
      id: "c5-l3",
      title: "Hoe de AI stop losses automatisch instelt en beheert",
      paragraphs: [
        "Naast handmatige stops kan de AI er ook zelf plaatsen. Die verschijnen in een apart onderdeel AI stop losses, en cruciaal is dat elke stop een notitiekolom heeft die de redenering van de AI uitlegt, zoals waarom hij dat triggerniveau voor die positie koos. Je hoeft nooit te raden waartegen een geautomatiseerde stop beschermt.",
        "De AI gebruikt dezelfde machinerie als jij. Hij kiest een token, een quote, een trigger en een hoeveelheid, en het resultaat is een echte stop in een lijst die je kunt lezen. Het verschil is dat de AI de trigger bepaalt op basis van zijn eigen inschatting van volatiliteit en risico in plaats van een getal dat jij hebt ingetikt.",
        "AI-stops zijn niet voor je afgeschermd. Elke AI-stop in de lijst heeft een Annuleren-knop, net als een handmatige, dus je houdt de controle. Ben je het niet eens met het AI-niveau, dan kun je de stop annuleren en je eigen niveau instellen, of de AI-stop laten staan als extra laag onder je handmatige stop.",
      ],
      example: "Nadat je 1.000 XLM koopt op 0,118, voegt de AI zijn eigen stop toe op 0,113 met de notitie Bodem van de recente 24u-range rond 0,114, stop net onder de steun geplaatst. Je leest die redenering in de notitiekolom, vindt het verstandig en laat hem staan. Had de notitie gezegd trigger op 0,117 gezet, gevaarlijk krap, dan had je op Annuleren kunnen klikken en hem kunnen vervangen door een ruimere stop van jezelf.",
    },
    {
      id: "c5-l4",
      title: "Wat is het verschil tussen een handmatige en een AI stop loss?",
      paragraphs: [
        "Mechanisch zijn ze identiek. Beide zijn richtingbewuste triggers, beide gaan door elke veiligheidscontrole heen wanneer ze afgaan, en beide verschijnen in een lijst met een Annuleren-knop. Het verschil zit alleen in wie de getallen koos en waar de stop wordt vermeld.",
        "Een handmatige stop weerspiegelt jouw oordeel: jij hebt de trigger en hoeveelheid ingetikt, dus hij is precies zo krap of ruim als jij besloot. Een AI-stop weerspiegelt het oordeel van het model en komt met een geschreven onderbouwing in de notitiekolom, die een handmatige stop niet heeft. Ze staan in aparte onderdelen, Handmatige stop losses en AI stop losses, zodat je in een oogopslag ziet welke welke is.",
        "Omdat ze onafhankelijk zijn, kunnen ze naast elkaar bestaan en zelfs overlappen. Beide tegelijk draaien is een veelvoorkomend patroon: je handmatige stop drukt je persoonlijke risicogrens uit, terwijl de AI-stop dient als tweede mening of diepere achtervang. Een van beide annuleren raakt de ander nooit.",
      ],
      example: "Op dezelfde 1.000 XLM zet je een handmatige stop op 0,110 omdat dat jouw comfortgrens is. De AI zet onafhankelijk zijn stop op 0,113 met een notitie over steun. Beide staan in hun eigen lijst. Glijdt XLM weg, dan gaat de AI-stop op 0,113 eerst af; was die geannuleerd, dan ving je handmatige 0,110 de val nog op. Elk heeft zijn eigen Annuleren-knop.",
    },
    {
      id: "c5-l5",
      title: "Wat er gebeurt wanneer een stop loss afgaat — stap voor stap",
      paragraphs: [
        "Eerst detecteert de positiemonitor dat de marktprijs door je trigger is gegaan. Hij wacht niet tot een candle sluit; de doorbraak zelf start de exit. De bot stuurt dan een agressieve sluitorder, geprijsd om de huidige beste prijs te kruisen zodat hij nu meteen vult. Hij blijft bewust niet passief naast een dalende markt liggen, want een dalende markt zou een passieve order ongevuld laten terwijl de verliezen oplopen.",
        "Die sluitorder is nog steeds een echte trade en gaat dus door elke veiligheidscontrole: de kill switch, de whitelist, slippage-limieten en de balanscontrole vooraf. Omdat het sluiten van een positie het risico verlaagt, voert de exit zichzelf onmiddellijk uit, zelfs in de modus waarin elke trade moet worden goedgekeurd. Een stop blijft nooit hangen wachten tot een mens op goedkeuren klikt.",
        "Is de liquiditeit dun, dan vult de order misschien maar gedeeltelijk. De rest blijft liggen, en de stop kan opnieuw afgaan om de klus te klaren, afgeknepen tot ongeveer eens per vijf minuten per paar zodat hij niet de markt overspoelt met orders. Het enige wat een stop tegenhoudt is de kill switch, die alle handel blokkeert, exits inbegrepen, dus een ingeschakelde kill switch betekent dat je stop wel is geregistreerd maar niet afgaat.",
      ],
      example: "Je stop op 1.000 XLM staat op 0,112. De prijs print 0,1119 en breekt erdoorheen. De monitor gaat af en de bot stuurt een verkoop gekruist tegen de huidige beste bid rond 0,1118 zodat hij meteen uitvoert, en passeert de slippage- en balanscontroles. Slechts 600 XLM vult tegen de beschikbare bids; de andere 400 blijven liggen. Ongeveer vijf minuten later, terwijl de prijs nog onder 0,112 staat, gaat de stop opnieuw af en sluit de resterende 400.",
    },
  ],
  quiz: [
    {
      id: "c5-q1",
      prompt: "Wat is het hoofddoel van een stop loss?",
      options: [
        { text: "Automatisch meer van een munt kopen wanneer de prijs stijgt.", explanation: "Onjuist. Een stop loss voor een long-positie is een exit die verkoopt, geen kooporder die bijkoopt op een winnende positie." },
        { text: "Een exit vooraf instellen die een verlies beperkt door de positie te sluiten zodra de prijs een gekozen niveau bereikt.", explanation: "Juist. De trigger wordt op voorhand bepaald zodat een klein verlies niet stilletjes kan uitgroeien tot een groot verlies, zonder dat er reactietijd van jou nodig is." },
        { text: "Garanderen dat je altijd tegen de hoogst mogelijke prijs verkoopt.", explanation: "Onjuist. Een stop beschermt de onderkant; hij vangt geen pieken en een te krappe stop kan je zelfs tijdens normale ruis eruit halen." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q2",
      prompt: "Welke velden vul je in wanneer je een handmatige Regular Stop Loss instelt?",
      options: [
        { text: "Alleen een procentuele daling; de app vult de rest aan.", explanation: "Onjuist. Een vast percentage is het standaard vangnet van de achtervang, niet wat je invult voor een handmatige Regular stop." },
        { text: "Token, Quote, een Triggerprijs, en ofwel Alles verkopen of een specifieke Hoeveelheid.", explanation: "Juist. Je kiest de munt en zijn quote, het triggerniveau, en hoeveel je sluit, met de keuze tussen Alles verkopen of een gedeeltelijke Hoeveelheid." },
        { text: "Een koopprijs en een verkoopprijs die de bot middelt.", explanation: "Onjuist. Een Regular stop is een enkele triggerprijs voor een exit, geen paar prijzen om te middelen." },
        { text: "Alleen de Token; de AI bepaalt de trigger voor je.", explanation: "Onjuist. Dat beschrijft een AI-stop. Een handmatige stop vereist dat je de trigger en hoeveelheid zelf instelt." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q3",
      prompt: "Hoe verschilt een AI stop loss van een handmatige?",
      options: [
        { text: "AI-stops kunnen niet worden geannuleerd, handmatige wel.", explanation: "Onjuist. Elke AI-stop heeft een Annuleren-knop in zijn lijst, net als een handmatige stop." },
        { text: "AI-stops slaan de veiligheidscontroles over die handmatige stops moeten passeren.", explanation: "Onjuist. Beide soorten passeren elke veiligheidscontrole wanneer ze afgaan; de werking is identiek." },
        { text: "De AI koos de getallen en de stop wordt apart vermeld met een notitiekolom die zijn redenering toont.", explanation: "Juist. Mechanisch zijn ze identiek; het verschil is wie de trigger instelde en dat AI-stops een geschreven onderbouwing in hun eigen onderdeel meedragen." },
      ],
      correctIndex: 2,
    },
    {
      id: "c5-q4",
      prompt: "Wanneer een stop loss afgaat, hoe plaatst de bot de sluitorder?",
      options: [
        { text: "Hij stuurt een agressieve order, geprijsd om de huidige beste prijs te kruisen zodat hij nu vult.", explanation: "Juist. De bot blijft niet passief naast een dalende markt liggen; hij kruist de spread om meteen uit te voeren en het verlies te beperken." },
        { text: "Hij legt een passieve order op de triggerprijs en wacht op een koper.", explanation: "Onjuist. Passief liggen in een dalende markt zou de order ongevuld laten terwijl de verliezen oplopen, en dat is precies wat de bot vermijdt." },
        { text: "Hij annuleert de positie meteen zonder dat er een order naar de markt gaat.", explanation: "Onjuist. Sluiten betekent nog steeds een echte order insturen die vult tegen het order book en de veiligheidscontroles passeert." },
        { text: "Hij wacht tot een mens de exit goedkeurt voordat er iets gebeurt.", explanation: "Onjuist. Risicoverlagende sluitingen voeren zichzelf onmiddellijk uit, zelfs in de modus waarin elke trade moet worden goedgekeurd, dus een stop blijft nooit hangen." },
      ],
      correctIndex: 0,
    },
    {
      id: "c5-q5",
      prompt: "Wat gebeurt er met je stop losses terwijl de kill switch is ingeschakeld?",
      options: [
        { text: "Stops gaan gewoon af omdat exits zijn vrijgesteld van de kill switch.", explanation: "Onjuist. De kill switch blokkeert alle handel, stop-loss-exits inbegrepen, dus exits zijn niet vrijgesteld." },
        { text: "Stops worden geregistreerd maar gaan niet af, omdat de kill switch alle handel blokkeert, exits inbegrepen.", explanation: "Juist. Een ingeschakelde kill switch legt elke order stil, dus een doorbroken trigger wordt vastgelegd maar er gaat geen sluitorder uit tot je hem uitschakelt." },
        { text: "Alle stops worden permanent verwijderd op het moment dat de kill switch aangaat.", explanation: "Onjuist. De stops blijven geregistreerd; ze worden alleen opgeschort tot de kill switch wordt losgelaten." },
      ],
      correctIndex: 1,
    },
  ],
};
