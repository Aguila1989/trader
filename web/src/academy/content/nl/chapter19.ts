import type { Chapter } from "../../types";

export const chapter19: Chapter = {
  id: "c19",
  number: 19,
  level: "BASIC",
  title: "Wat is een trustline en moet je er een toevoegen?",
  description: "Trustlines in gewone taal: wat ze zijn, waarom ze 0,5 XLM kosten, de echte risico's, hoe je een token eerst onderzoekt, en hoe je er later een verwijdert.",
  lessons: [
    {
      id: "c19-l1",
      title: "Wat is een trustline?",
      paragraphs: [
        "Op Stellar houdt je account standaard XLM aan, maar het kan geen enkel ander token aanhouden totdat je daar uitdrukkelijk voor kiest. Die keuze heet een trustline. Zie het als een specifieke winkel toestemming geven om iets in je portemonnee te leggen: jij bepaalt precies welke winkels je vertrouwt, en niets anders kan er zomaar iets in stoppen zonder jouw goedkeuring.",
        "Een trustline benoemt precies één token: de assetcode plus het account dat het uitgeeft (de issuer). Het toevoegen van de trustline zegt: \"Ik ben bereid om de versie van dit token van deze specifieke issuer aan te houden.\" Het koopt het token niet, het kost je niet de prijs van het token, en het geeft de issuer geen toegang tot je XLM. Het opent simpelweg een plek zodat het token kan binnenkomen.",
        "Zolang er geen trustline bestaat, mislukt elke poging om je dat token te sturen, of elke trade die het zou leveren, gewoonweg. Het toevoegen van een trustline is dus de noodzakelijke eerste stap voordat je een asset anders dan XLM kunt ontvangen, kopen of verhandelen — en kiezen welke trustlines je opent, is kiezen met welke issuers je in zee wilt gaan.",
      ],
      example: "Je wilt USDC aanhouden. Voordat je ook maar één eenheid kunt ontvangen, heeft je account een trustline nodig naar USDC uitgegeven door het specifieke issuing-account van Circle. Zodra die trustline bestaat, kan USDC in je portemonnee terechtkomen. Zonder trustline krijgt een vriend die je 10 USDC probeert te sturen een foutmelding en komt de betaling nooit aan.",
    },
    {
      id: "c19-l2",
      title: "Waarom kost het toevoegen van een trustline 0,5 XLM?",
      paragraphs: [
        "Het toevoegen van een trustline geeft geen 0,5 XLM uit — het reserveert die. Stellar vereist dat elk account een minimumsaldo aanhoudt, en elke trustline die je opent verhoogt dat minimum met 0,5 XLM. Die 0,5 XLM blijft van jou; ze wordt alleen vergrendeld en kan niet worden uitgegeven of verstuurd zolang de trustline open is.",
        "Deze reserve bestaat om spam tegen te gaan. Omdat elke trustline een vergrendeld saldo kost, kan niemand goedkoop miljoenen lege vermeldingen aanmaken om het netwerk op te blazen. Het houdt de ledger slank en maakt van elke trustline een kleine, bewuste keuze in plaats van iets wat je achteloos rondstrooit.",
        "Het praktische gevolg: veel trustlines openen vergrendelt echte XLM. Tien trustlines reserveren 5 XLM die je niet meer kunt verplaatsen. Wanneer je een trustline sluit die je niet meer nodig hebt, komt die 0,5 XLM weer vrij in je besteedbare saldo.",
      ],
      example: "Je account houdt 20 XLM aan zonder trustlines. Je voegt een trustline toe naar USDC en nog een naar AQUA. Je gereserveerde minimum stijgt met 1 XLM (0,5 per stuk), dus nu is ongeveer 19 XLM min de basisreserve besteedbaar. Verwijder je de AQUA-trustline later, dan komt er 0,5 XLM weer vrij.",
    },
    {
      id: "c19-l3",
      title: "Wat zijn de risico's van het toevoegen van een trustline?",
      paragraphs: [
        "Een trustline koppelt je aan een issuer, en niet elke issuer is betrouwbaar. Het klassieke gevaar is een rug pull: een project trekt houders aan, en vervolgens maakt de issuer een vloed aan nieuwe tokens aan of trekt de liquiditeit weg, waarna de prijs naar nul instort. Je trustline veroorzaakte dit niet, maar het is wel wat je in staat stelde het token aan te houden dat waardeloos werd.",
        "Anonieme issuers zijn een bijzonder waarschuwingssignaal. Als je niet kunt achterhalen wie het project runt, wie de issuing-sleutel beheert, of of het aanbod naar believen kan worden opgeblazen, vertrouw je een onbekende zonder enige verantwoording. Veel waardeloze tokens zijn scam-klonen die de code van een bekende asset kopiëren maar een andere, door de aanvaller gecontroleerde issuer gebruiken.",
        "Een trustline zelf kan je XLM of je andere tokens niet leeghalen — dat deel is veilig. Het risico draait volledig om de waarde van het token dat je kiest aan te houden en het gedrag van de issuer. De enige directe kost is de reserve van 0,5 XLM, die je terugkrijgt wanneer je de trustline sluit.",
      ],
      example: "Een token genaamd \"USDC\" verschijnt met een enorm geadverteerd rendement, maar het issuer-account is splinternieuw, heeft geen website en zou onbeperkt aanbod kunnen aanmaken. Je voegt de trustline toe en koopt in. Een week later maakt de issuer tien miljoen extra eenheden aan en dumpt ze; de prijs daalt 99%. Je XLM liep nooit gevaar, maar de tokens die je kocht zijn nu vrijwel waardeloos.",
    },
    {
      id: "c19-l4",
      title: "Hoe onderzoek je een token voordat je een trustline toevoegt",
      paragraphs: [
        "Begin met de identiteit van de issuer. Een geloofwaardig token publiceert een stellar.toml-bestand op zijn home-domein dat de organisatie benoemt, de website koppelt en het exacte issuing-account vermeldt. Als er geen zo'n bestand is, geen domein, en geen manier om te achterhalen wie erachter zit, beschouw dat dan als een sterke reden om weg te blijven.",
        "Kijk daarna naar liquiditeit en adoptie. Hoeveel accounts hebben er al een trustline naartoe? Is er echt handelsvolume tegen XLM, of is de order book leeg? Een token met duizenden houders en gestaag volume is iets heel anders dan een token met een handvol houders en geen trades. De wekelijkse trustline-scan van de app vat precies deze signalen voor je samen.",
        "Wees ten slotte sceptisch over urgentie en buitensporige beloften. Gegarandeerde hoge rendementen, afteltimers en druk om de trustline toe te voegen \"voordat het te laat is\" zijn klassieke manipulatie. Een degelijk token hoeft je niet op te jagen — neem dus de tijd om de issuer en de cijfers zelf te verifiëren.",
      ],
      example: "Voordat je een nieuw token vertrouwt, open je het home-domein en vind je een stellar.toml met het project, de website en de issuer-sleutel — en die komt overeen met de issuer die je kreeg. Je ziet ook dat het 8.000 houders heeft en een gezonde XLM order book. Dat klopt. Een tweede token heeft geen domein, 12 houders en geen trades; dat wijs je af.",
    },
    {
      id: "c19-l5",
      title: "Hoe verwijder je een trustline die je niet meer wilt",
      paragraphs: [
        "Je zit nooit vast aan een trustline. Er een verwijderen sluit de plek en geeft de reserve van 0,5 XLM weer vrij in je besteedbare saldo. In deze app verwijder je een trustline in het Trustlines-paneel: naast elk aangehouden token staat een knop Verwijderen.",
        "Er is één regel: je kunt een trustline alleen verwijderen wanneer je saldo van dat token exact nul is. Stellar laat je een trustline niet sluiten terwijl je het token nog aanhoudt, omdat het saldo dan zou stranden. Verkoop of verstuur het token dus eerst tot nul, en dan wordt de knop Verwijderen beschikbaar.",
        "Een trustline verwijderen is een normale, omkeerbare opruimstap. Als je later van gedachten verandert, kun je de trustline gewoon opnieuw toevoegen (waarbij je opnieuw de reserve van 0,5 XLM betaalt). Ongebruikte trustlines sluiten is een goede gewoonte: het maakt gereserveerde XLM vrij en verkleint de lijst van issuers waaraan je blootgesteld bent.",
      ],
      example: "Je houdt 0 aan van een token dat je niet meer wilt, maar de trustline staat nog open. In het Trustlines-paneel is de knop Verwijderen actief, dus klik je erop; de trustline sluit en 0,5 XLM keert terug naar je besteedbare saldo. Een ander token toont nog een saldo van 30, dus de knop Verwijderen is uitgeschakeld totdat je die 30 tot nul verkoopt.",
    },
  ],
  quiz: [
    {
      id: "c19-q1",
      prompt: "Wat doet het toevoegen van een trustline eigenlijk?",
      options: [
        { text: "Het koopt het token voor je tegen de huidige marktprijs.", explanation: "Onjuist. Een trustline koopt niets; het stelt je account alleen in staat het token aan te houden. Je moet het nog steeds apart verwerven." },
        { text: "Het laat je account ervoor kiezen om één specifiek token van één specifieke issuer aan te houden.", explanation: "Juist. Een trustline benoemt een token en zijn issuer en opent een plek zodat dat token kan worden ontvangen, gekocht of verhandeld." },
        { text: "Het geeft de issuer van het token toestemming om je XLM uit te geven.", explanation: "Onjuist. Een trustline geeft niemand ooit toegang tot je XLM of andere tokens; het laat je alleen de genoemde asset aanhouden." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q2",
      prompt: "Wat gebeurt er met de 0,5 XLM wanneer je een trustline toevoegt?",
      options: [
        { text: "Ze wordt als vergoeding aan de token-issuer betaald.", explanation: "Onjuist. De issuer ontvangt niets. De 0,5 XLM is geen betaling." },
        { text: "Ze wordt permanent uitgegeven en kan niet worden teruggekregen.", explanation: "Onjuist. Ze wordt niet uitgegeven — ze wordt gereserveerd, en je krijgt ze terug wanneer je de trustline sluit." },
        { text: "Ze wordt gereserveerd (vergrendeld) in je eigen account en komt weer vrij als je de trustline verwijdert.", explanation: "Juist. Elke trustline verhoogt je minimumsaldo met 0,5 XLM; het bedrag blijft van jou maar is vergrendeld totdat de trustline wordt gesloten." },
      ],
      correctIndex: 2,
    },
    {
      id: "c19-q3",
      prompt: "Welke van deze is een echt waarschuwingssignaal (red flag) voordat je een trustline toevoegt?",
      options: [
        { text: "De issuer publiceert een stellar.toml met zijn naam, website en issuing-sleutel.", explanation: "Onjuist. Dat is een goed teken — het stelt je in staat te achterhalen en te verifiëren wie achter het token zit." },
        { text: "De issuer is anoniem, heeft geen website, en het aanbod zou naar believen kunnen worden opgeblazen.", explanation: "Juist. Een niet-identificeerbare issuer met onbeperkt aanbod is een klassieke rug-pull-opzet; er is geen verantwoording als het misloopt." },
        { text: "Het token heeft duizenden houders en een gestage XLM order book.", explanation: "Onjuist. Echte adoptie en liquiditeit zijn geruststellende signalen, geen waarschuwingstekens." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q4",
      prompt: "Wanneer kun je een trustline verwijderen die je niet meer wilt?",
      options: [
        { text: "Pas wanneer je saldo van dat token exact nul is.", explanation: "Juist. Stellar weigert een trustline te sluiten terwijl je het token nog aanhoudt, dus verkoop of verstuur je het eerst tot nul; daarna komt de reserve van 0,5 XLM vrij." },
        { text: "Op elk moment, zelfs met een groot saldo nog aangehouden.", explanation: "Onjuist. Een saldo dat niet nul is blokkeert het verwijderen, omdat sluiten de tokens zou laten stranden." },
        { text: "Nooit — eenmaal toegevoegd is een trustline permanent.", explanation: "Onjuist. Trustlines zijn omkeerbaar; je kunt er een verwijderen (bij saldo nul) en hem later zelfs opnieuw toevoegen." },
      ],
      correctIndex: 0,
    },
  ],
};
