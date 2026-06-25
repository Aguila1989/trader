import type { Chapter } from "../../types";

export const chapter03: Chapter = {
  id: "c3",
  number: 3,
  level: "BASIC",
  title: "Je eerste trade",
  description: "Plaats je eerste handmatige trade: lees het JE VERKOOPT / JE KOOPT formulier, kies market of limit, begrijp de kosten en verstuur tokens veilig.",
  lessons: [
    {
      id: "c3-l1",
      title: "Wat betekent het om een token te kopen en te verkopen?",
      paragraphs: [
        "Elke trade is eigenlijk een swap. Je geeft een token weg die je al bezit en krijgt er een andere token voor terug. Er is achter de schermen geen aparte cash-rekening, dus om iets te kopen moet je iets anders uitgeven dat je al bezit.",
        "In deze app wordt de swap altijd als een verkoop weergegeven. Je kiest een token onder JE VERKOOPT en daarna de token die je wilt onder JE KOOPT. Intern behandelt de bot dit als het verkopen van de JE VERKOOPT-asset in ruil voor de JE KOOPT-asset, ook al voelt het alsof je gewoon iets koopt.",
        "Omdat je alleen kunt weggeven wat je bezit, toont de JE VERKOOPT dropdown alleen tokens die al in je wallet zitten. Staat een token er niet bij, dan heb je er niets van om uit te geven, dus swap eerst ernaartoe vanuit iets dat je wel bezit.",
      ],
      example: "Je bezit 500 XLM en wilt wat USDC. Je zet JE VERKOOPT op XLM en JE KOOPT op USDC, en geeft 100 XLM uit. De bot verkoopt 100 XLM voor USDC tegen de geldende koers. Om later terug naar XLM te gaan, swap je de andere kant op: JE VERKOOPT USDC, JE KOOPT XLM.",
    },
    {
      id: "c3-l2",
      title: "Wat is het verschil tussen een market order en een limit order?",
      paragraphs: [
        "Het formulier heeft een Limit- en Market-schakelaar. De app omschrijft ze zo: Limit blijft rusten op de prijs die je instelt en wordt alleen gevuld tegen die prijs of beter. Market wordt direct gevuld tegen de huidige beste prijs in het orderboek.",
        "Een market order is snel en eenvoudig. Hij neemt de beste prijs van dit moment, dus hij vult bijna altijd, maar je hebt geen controle over de exacte koers die je krijgt. Met een limit order noem je je eigen prijs en wacht je af, maar hij vult alleen als de markt die prijs bereikt, en mogelijk vult hij helemaal nooit.",
        "Wanneer je Limit kiest, moet je een prijs intypen. Wanneer je Market kiest, gebruikt de bot de live beste bid voor je, dus is er geen prijs nodig. Beginners starten vaak met kleine market orders om te leren en schakelen daarna over op limits voor geduld en controle.",
      ],
      example: "USDC wordt verhandeld rond 0.085 XLM per stuk. Een market order om XLM te verkopen vult direct rond 0.085. Een limit order die pas USDC koopt zodra XLM-per-USDC daalt naar 0.080 blijft rusten in het orderboek en vult alleen als de prijs daar komt; gebeurt dat nooit, dan gebeurt er niets.",
    },
    {
      id: "c3-l3",
      title: "Hoe lees je de JE VERKOOPT / JE KOOPT interface in deze app",
      paragraphs: [
        "Het formulier lees je van boven naar beneden. JE VERKOOPT is de token die je weggeeft, gekozen uit een dropdown met tokens die je bezit. JE KOOPT is de token die je ontvangt, gekozen uit het volledige samengestelde token-universum. Een live samenvatting herhaalt dit als Je verkoopt X, je koopt Y, zodat er geen verwarring is.",
        "Het Price-veld toont de JE KOOPT hoeveelheid per 1 eenheid van JE VERKOOPT. Available balance vertelt je hoeveel van de JE VERKOOPT token je kunt uitgeven. Slippage-tolerantie, in procent, geeft aan hoe ver de prijs mag afwijken voordat de order wordt geannuleerd om je te beschermen.",
        "Een Advanced-sectie voegt een optionele Target price en Invalidation price toe. Dit zijn geheugensteuntjes voor je eigen plan en ze zijn optioneel. Elke order doet ook een balance pre-check voordat hij wordt getekend, zodat de bot weigert een trade in te dienen die je in werkelijkheid niet kunt financieren.",
      ],
      example: "Je zet JE VERKOOPT op XLM, JE KOOPT op USDC, Price 0.085 en Slippage 1 procent. Available balance toont 500 XLM. Je vult 100 XLM in. De samenvatting zegt Je verkoopt 100 XLM, je koopt ongeveer 8.5 USDC. Beweegt de koers meer dan 1 procent voordat hij vult, dan wordt de order geannuleerd in plaats van je een slechtere deal te geven.",
    },
    {
      id: "c3-l4",
      title: "Wat is een trading fee en hoeveel rekent Stellar aan?",
      paragraphs: [
        "Op veel exchanges betaal je een procentuele fee op elke trade, soms één of twee procent. Stellar werkt anders. De SDEX, de gedecentraliseerde exchange waarop deze bot handelt, rekent helemaal geen procentuele trading fee. Je betaalt alleen een minieme netwerkkost plus de spread.",
        "De netwerkkost wordt in XLM betaald en wordt per operatie aangerekend. De huidige basiskost is 100 stroops, oftewel 0.00001 XLM per operatie, een fractie van een dollarcent. Een stroop is de kleinste eenheid van XLM, een tienmiljoenste van één XLM.",
        "De echte kost om in de gaten te houden is de spread, het gat tussen de beste koop- en verkoopprijs. Een brede spread overbruggen kost veel meer dan de netwerkkost. Stem de omvang van je trades dus af op de spread, niet op de netwerkkost, die vrijwel verwaarloosbaar is.",
      ],
      example: "Je plaatst één market order om XLM te verkopen voor USDC. De netwerkkost is 100 stroops, oftewel 0.00001 XLM, ruim onder een cent. Er komt geen procentuele afroming bovenop. Is de spread tussen koop- en verkoopprijs 0.3 procent, dan is die spread, niet de fee, je belangrijkste handelskost op de swap.",
    },
    {
      id: "c3-l5",
      title: "Hoe verstuur je tokens veilig naar een andere wallet",
      paragraphs: [
        "Naast handelen heeft de wallet een Send and Pay-functie om tokens naar een ander adres te verplaatsen. Je voert een publieke sleutel als bestemming in, die begint met de letter G, en kiest daarna de asset, het bedrag en een optionele memo. Sommige exchanges hebben die memo nodig om je storting bij te schrijven, dus sla hem niet over als erom gevraagd wordt.",
        "Stellar-betalingen zijn onomkeerbaar. Tik je het verkeerde adres in, dan is er geen undo en geen helpdesk om de fondsen terug te halen. Controleer de bestemming dus teken voor teken en plak nooit een adres dat je niet hebt bevestigd via een betrouwbare bron.",
        "Voor elke niet-native asset, zoals USDC, moet de ontvanger al een trustline voor die asset hebben, anders mislukt de betaling. De veilige gewoonte is altijd dezelfde: stuur eerst een minuscuul testbedrag, bevestig dat het aankomt, en stuur dan de rest.",
      ],
      example: "Je wilt 200 USDC naar een vriend sturen wiens adres begint met GBXY en eindigt op 7QWP. Je stuurt eerst 1 USDC als test. Die komt aan, wat zowel het adres bevestigt als dat hun wallet een USDC-trustline heeft. Pas daarna stuur je de resterende 199 USDC, met de memo die hun exchange vroeg.",
    },
  ],
  quiz: [
    {
      id: "c3-q1",
      prompt: "Wat gebeurt er in deze app eigenlijk wanneer je JE VERKOOPT XLM en JE KOOPT USDC invult?",
      options: [
        { text: "Je verkoopt XLM in ruil voor USDC.", explanation: "Juist. Elke trade is een swap, en de app stelt het altijd voor als het verkopen van de JE VERKOOPT-asset voor de JE KOOPT-asset." },
        { text: "Je stort XLM op een aparte cash-rekening.", explanation: "Fout. Er is geen aparte cash-rekening; een trade swapt de ene token direct voor de andere." },
        { text: "Je leent USDC tegen onderpand van je XLM.", explanation: "Fout. Er wordt niets geleend. Je geeft simpelweg XLM weg en ontvangt USDC." },
      ],
      correctIndex: 0,
    },
    {
      id: "c3-q2",
      prompt: "Wat doet een Market order volgens de app?",
      options: [
        { text: "Hij blijft rusten tot de prijs een door jou ingetypt niveau bereikt.", explanation: "Fout. Dat beschrijft een limit order, die alleen vult tegen je ingestelde prijs of beter." },
        { text: "Hij vult direct tegen de huidige beste prijs in het orderboek.", explanation: "Juist. Een market order neemt meteen de live beste prijs, dus hij vult bijna altijd." },
        { text: "Hij annuleert de trade als er een fee van toepassing is.", explanation: "Fout. Het ordertype heeft niets te maken met annuleren vanwege fees." },
        { text: "Hij garandeert exact de prijs die je wilde.", explanation: "Fout. Een market order geeft snelheid, geen prijscontrole; de koers kan bewegen terwijl hij vult." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q3",
      prompt: "Waarom toont de JE VERKOOPT dropdown alleen bepaalde tokens?",
      options: [
        { text: "Hij toont alleen tokens die de bot aanraadt om te kopen.", explanation: "Fout. JE VERKOOPT gaat over wat je weggeeft, niet over aanbevelingen." },
        { text: "Hij toont alleen tokens zonder netwerkkost.", explanation: "Fout. De netwerkkost geldt voor operaties, ongeacht welke token je verkoopt." },
        { text: "Hij toont alleen tokens die je al bezit, omdat je alleen kunt uitgeven wat je hebt.", explanation: "Juist. Je kunt alleen tokens in je wallet verkopen, dus de dropdown is beperkt tot assets die je bezit." },
      ],
      correctIndex: 2,
    },
    {
      id: "c3-q4",
      prompt: "Hoeveel rekent de Stellar SDEX aan trading fees?",
      options: [
        { text: "Een vast tarief van één procent op elke trade.", explanation: "Fout. De SDEX rekent helemaal geen procentuele trading fee." },
        { text: "Geen procentuele trading fee; alleen een minieme netwerkkost per operatie van 100 stroops plus de spread.", explanation: "Juist. De basiskost is 100 stroops, oftewel 0.00001 XLM per operatie, en de echte kost om in de gaten te houden is de spread." },
        { text: "Een fee van twee procent betaald in USDC.", explanation: "Fout. Er is geen procentuele afroming, en de netwerkkost wordt in XLM betaald, niet in USDC." },
        { text: "Helemaal niets, zelfs geen netwerkkost.", explanation: "Fout. Er is nog steeds een minieme netwerkkost van 100 stroops per operatie, ook al is er geen procentuele trading fee." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q5",
      prompt: "Wat is de veiligste eerste stap voordat je een groot bedrag aan USDC naar een andere wallet stuurt?",
      options: [
        { text: "Stuur eerst een minuscuul testbedrag om het adres en de trustline te bevestigen.", explanation: "Juist. Betalingen zijn onomkeerbaar, dus een kleine test bevestigt dat het adres klopt en dat de ontvanger een USDC-trustline heeft voordat je de rest stuurt." },
        { text: "Stuur het volledige bedrag meteen zodat het niet onderschept kan worden.", explanation: "Fout. Stellar-betalingen zijn onomkeerbaar; een verkeerd adres kan niet ongedaan worden gemaakt, dus haasten is riskant." },
        { text: "Sla de memo over om de overdracht privé te houden.", explanation: "Fout. Sommige exchanges hebben de memo nodig om je storting bij te schrijven, dus hem overslaan kan de fondsen kosten." },
        { text: "Gebruik een adres dat je hebt gevonden zonder de bron te bevestigen.", explanation: "Fout. Bevestig de bestemming altijd via een betrouwbare bron, want een verkeerd adres betekent permanent verlies." },
      ],
      correctIndex: 0,
    },
  ],
};
