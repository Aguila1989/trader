import type { Chapter } from "../../types";

export const chapter01: Chapter = {
  id: "c1",
  number: 1,
  level: "BASIC",
  title: "Wat is crypto trading?",
  description:
    "Begin vanaf nul: munten, blockchains, het Stellar-netwerk, wallets, en hoe tokens verschillen van munten.",
  lessons: [
    {
      id: "c1-l1",
      title: "Wat is een cryptomunt?",
      paragraphs: [
        "Een cryptomunt is digitaal geld dat leeft op een gedeeld computernetwerk in plaats van binnen één bank. Geen enkel bedrijf is er de eigenaar van. Het netwerk wordt beheerd door veel computers over de hele wereld, die het er allemaal over eens zijn wie wat bezit, zodat het overzicht niet stiekem door één partij kan worden aangepast.",
        "Omdat het digitaal is, kun je het rechtstreeks naar iemand anders sturen, waar ook ter wereld, vaak binnen enkele seconden, zonder een bank om toestemming te vragen. De keerzijde is dat je zelf verantwoordelijk bent voor je eigen geld. Er is geen helpdesk om een fout terug te draaien, dus zorgvuldigheid telt.",
        "Prijzen bewegen omdat mensen kopen en verkopen, net als bij aandelen of vreemde valuta. Met dit dashboard kun je die prijzen volgen en zelf koop- en verkooporders plaatsen op het tabblad Handmatig handelen, of een AI trades laten voorstellen op het tabblad Bot-handel.",
      ],
      example:
        "Stel dat je 100 XLM hebt, de cryptomunt van het Stellar-netwerk. Als elke XLM ongeveer 0,11 USDC waard is, dan is je 100 XLM zo'n 11 USDC waard. Stijgt de prijs naar 0,13 USDC, dan is diezelfde 100 XLM nu 13 USDC waard, ook al is het aantal XLM dat je bezit niet veranderd.",
    },
    {
      id: "c1-l2",
      title: "Wat is een blockchain en waarom is die belangrijk?",
      paragraphs: [
        "Een blockchain is het gedeelde grootboek waarop een cryptomunt draait. Transacties worden gegroepeerd in blokken, en elk nieuw blok wordt gekoppeld aan het vorige, waardoor er een keten ontstaat. Veel computers bewaren een volledige kopie, zodat ze elkaar kunnen controleren en het eens kunnen worden over de waarheid.",
        "Dit is belangrijk omdat het de noodzaak wegneemt om één bedrijf met het overzicht te vertrouwen. Zodra een transactie is bevestigd en aan de keten is toegevoegd, is die uiterst moeilijk te wijzigen of te wissen. De geschiedenis is permanent en openbaar, dus iedereen kan controleren of de cijfers kloppen.",
        "Voor een trader betekent dit dat een afgeronde trade definitief is. Wanneer jij of de bot een order plaatst en die wordt uitgevoerd op de Stellar Decentralized Exchange, dan wordt dat resultaat naar de blockchain geschreven en kan het niet ongedaan worden gemaakt. Juist door die definitiviteit is het zo belangrijk om alles dubbel te checken voordat je bevestigt.",
      ],
      example:
        "Stel dat je 50 XLM naar een vriend stuurt. Het netwerk bundelt jouw overdracht samen met andere in een blok, de computers bevestigen die binnen enkele seconden, en het blok wordt aan de keten toegevoegd. Vanaf dat moment laat het overzicht zien dat er 50 XLM van je account is vertrokken, en niemand, ook jij niet, kan die regel nog herschrijven.",
    },
    {
      id: "c1-l3",
      title: "Wat is het Stellar-netwerk en wat is XLM?",
      paragraphs: [
        "Stellar is de specifieke blockchain waarop deze bot handelt. Het is gebouwd om geld snel en goedkoop te verplaatsen, wat het goed geschikt maakt voor veel kleine trades. Stellar heeft zelfs een ingebouwde exchange, de Stellar Decentralized Exchange, oftewel SDEX, waar kopers en verkopers elkaar rechtstreeks ontmoeten.",
        "XLM, ook wel Lumens genoemd, is het eigen, oorspronkelijke asset van Stellar. Het heeft twee rollen. Het is iets wat je kunt verhandelen, en het is ook de brandstof die de kleine netwerkkosten van elke transactie betaalt. Die kosten bedragen een fractie van een dollarcent, dus vaak handelen is niet duur.",
        "Elk Stellar-account moet ook een kleine minimumhoeveelheid XLM als reserve aanhouden die je niet kunt uitgeven. Dit houdt het netwerk gezond. Het overzicht van je wallet in dit dashboard toont je bezittingen in zowel XLM als USDC, zodat je je waarde in één oogopslag ziet.",
      ],
      example:
        "Je plaatst een verkooporder op de SDEX waarbij je 20 XLM omwisselt voor USDC. Het netwerk rekent netwerkkosten van ongeveer 0,00001 XLM, veel minder dan een cent. Als je precies 21 XLM had, zou je die niet allemaal kunnen verkopen, omdat een minimumreserve van ongeveer 1 XLM op het account moet blijven staan om het actief te houden.",
    },
    {
      id: "c1-l4",
      title: "Wat is een wallet en hoe houd je die veilig?",
      paragraphs: [
        "Een wallet is je account op het netwerk. Hij heeft twee sleutels. De publieke sleutel begint met de letter G en is als je rekeningnummer, veilig om te delen zodat mensen je geld kunnen sturen. De geheime sleutel begint met de letter S en is als het wachtwoord plus de handtekening die elke verplaatsing autoriseert.",
        "De gouden regel is eenvoudig. Wie de geheime sleutel heeft, heeft de controle over het geld. Er is geen bank om te bellen als die lekt. Iedereen die je S-sleutel kopieert, kan je wallet meteen leeghalen, en de blockchain zal die transacties als volkomen geldig beschouwen omdat ze correct zijn ondertekend.",
        "Plak je geheime sleutel dus nooit in een website die je niet vertrouwt, deel hem nooit in een chat of e-mail, en bewaar een privékopie offline. Behandel de G-sleutel als openbaar en de S-sleutel als een goed bewaakt geheim. Dit dashboard ondertekent trades voor je, maar de veiligheid van die sleutel blijft altijd jouw verantwoordelijkheid.",
      ],
      example:
        "Je publieke sleutel ziet er misschien uit als GA5ZSEJ gevolgd door meer letters, en je kunt hem veilig delen zodat een vriend je 10 XLM stuurt. Je geheime sleutel ziet eruit als SDX4K gevolgd door meer tekens. Als iemand een schermafbeelding van die S-sleutel maakt, kan diegene een transactie ondertekenen die al je XLM en USDC wegsluist, en niemand kan dat terugdraaien.",
    },
    {
      id: "c1-l5",
      title: "Wat is een token en hoe verschilt het van een munt?",
      paragraphs: [
        "Mensen zeggen vaak munt en token alsof het hetzelfde betekent, maar er is een nuttig verschil. Een munt is het oorspronkelijke asset van zijn eigen blockchain. XLM is een munt omdat het in Stellar zelf is ingebouwd en de netwerkkosten betaalt.",
        "Een token is een asset dat iemand uitgeeft bovenop een bestaande blockchain. Het rijdt mee op de infrastructuur van Stellar in plaats van een eigen blockchain te hebben. USDC, uitgegeven door een bedrijf dat Circle heet, is een token dat probeert precies één Amerikaanse dollar waard te blijven. Het gebruikt Stellar om te bewegen, maar het is niet de oorspronkelijke munt van Stellar.",
        "Op Stellar moet je, voordat je een niet-oorspronkelijk token zoals USDC kunt aanhouden of verhandelen, eerst een trustline naar de uitgever toevoegen. Een trustline is je account dat zegt dat het ermee akkoord gaat dat specifieke token te houden. De oorspronkelijke munt XLM heeft nooit een trustline nodig, omdat die deel uitmaakt van het netwerk zelf.",
      ],
      example:
        "Om op dit dashboard XLM voor USDC te verhandelen, open je eerst een trustline naar Circle, de uitgever van USDC. Zonder die trustline laat het orderboek je geen USDC ontvangen. Zodra de trustline is ingesteld, kun je bijvoorbeeld 100 XLM omwisselen naar zo'n 11 USDC, waarbij je het USDC-token vasthoudt terwijl je nog steeds de XLM-munt gebruikt voor de kosten.",
    },
  ],
  quiz: [
    {
      id: "c1-q1",
      prompt:
        "Wat is op het Stellar-netwerk het verschil tussen XLM en USDC?",
      options: [
        {
          text: "XLM is de oorspronkelijke munt van Stellar, terwijl USDC een token is dat door Circle bovenop Stellar wordt uitgegeven.",
          explanation:
            "Juist. Een munt hoort bij zijn eigen blockchain en XLM is in Stellar ingebouwd, terwijl USDC een token is dat door Circle wordt uitgegeven en meerijdt op de infrastructuur van Stellar.",
        },
        {
          text: "Het zijn allebei oorspronkelijke munten van twee aparte blockchains.",
          explanation:
            "Niet helemaal. Alleen XLM is de oorspronkelijke munt van Stellar. USDC is een token dat bovenop Stellar wordt uitgegeven, niet de munt van een aparte blockchain.",
        },
        {
          text: "USDC is de oorspronkelijke munt en XLM is een token dat door Circle wordt uitgegeven.",
          explanation:
            "Dit draait de waarheid om. XLM is de oorspronkelijke munt die de netwerkkosten betaalt, en USDC is het token dat door Circle wordt uitgegeven.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c1-q2",
      prompt:
        "Iemand stuurt je een bericht waarin om je geheime sleutel wordt gevraagd, die met een S begint, om je account te helpen herstellen. Wat moet je doen?",
      options: [
        {
          text: "Hem delen, want de supportmedewerkers hebben hem nodig om je te helpen.",
          explanation:
            "Nee. Er is geen helpdesk die je geheime sleutel nodig heeft, en als je hem deelt kan iedereen je wallet leeghalen.",
        },
        {
          text: "Alleen de eerste paar tekens delen om te bewijzen dat het account van jou is.",
          explanation:
            "Toch onveilig. Zelfs gedeeltelijke lekken zijn riskant, en een echte dienst heeft nooit ook maar een deel van je geheime sleutel nodig.",
        },
        {
          text: "Weigeren en hem privé houden, want wie de S-sleutel heeft, heeft de controle over het geld.",
          explanation:
            "Juist. De geheime sleutel autoriseert elke transactie. Iedereen die hem in handen krijgt, kan je geld verplaatsen, en de blockchain kan dat niet terugdraaien.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c1-q3",
      prompt: "Wat beschrijft een blockchain het best?",
      options: [
        {
          text: "Een privédatabase die één bedrijf kan bewerken wanneer het maar wil.",
          explanation:
            "Onjuist. De hele bedoeling van een blockchain is dat geen enkele partij het overzicht beheert of stiekem bewerkt.",
        },
        {
          text: "Een gedeeld overzicht van transacties dat door veel computers wordt bijgehouden, waarbij bevestigde regels permanent zijn.",
          explanation:
            "Juist. Veel computers houden kopieën bij en worden het eens over de waarheid, en zodra een blok is toegevoegd is het uiterst moeilijk te wijzigen, en dat is precies waarom uitgevoerde trades definitief zijn.",
        },
        {
          text: "Een soort cryptomunt die je kunt kopen en verkopen.",
          explanation:
            "Niet helemaal. Een cryptomunt draait op een blockchain, maar de blockchain zelf is het gedeelde grootboek, niet het geld.",
        },
        {
          text: "Een bankrekening die foutieve betalingen automatisch terugdraait.",
          explanation:
            "Nee. Er is geen centrale instantie die betalingen terugdraait. Bevestigde transacties op de blockchain zijn permanent.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c1-q4",
      prompt:
        "Waarom moet elk Stellar-account een kleine hoeveelheid XLM aanhouden, en waar wordt XLM voor gebruikt?",
      options: [
        {
          text: "XLM is alleen nuttig als reservetoken en wordt nooit uitgegeven.",
          explanation:
            "Onjuist. XLM wordt actief verhandeld en betaalt ook de netwerkkosten van elke transactie, het is niet alleen een reserve.",
        },
        {
          text: "XLM betaalt de kleine netwerkkosten en er moet een minimumreserve op het account blijven staan om het actief te houden.",
          explanation:
            "Juist. XLM is de oorspronkelijke munt van Stellar die wordt gebruikt voor kosten van een fractie van een cent, en er moet een kleine reserve overblijven zodat het account open blijft.",
        },
        {
          text: "De reserve is een vergoeding die aan Circle wordt betaald voor het uitgeven van USDC.",
          explanation:
            "Nee. Circle geeft USDC uit, maar de XLM-reserve is een netwerkregel om het account actief te houden, geen betaling aan Circle.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
