import type { Chapter } from "../../types";

export const chapter15: Chapter = {
  id: "c15",
  number: 15,
  level: "BASIC",
  title: "Inloggen en veilig blijven",
  description:
    "Waarom een handelsapp een login nodig heeft, wat een wachtwoord sterk maakt, waarom we je e-mailadres controleren, en wat je moet doen als je ooit je wachtwoord vergeet.",
  lessons: [
    {
      id: "c15-l1",
      title: "Waarom heb je een login nodig voor een handelsapp?",
      paragraphs: [
        "Met een login zorgt de app ervoor dat jij, en alleen jij, bij je handelsgegevens en de bediening van je wallet kunt. Zonder login zou iedereen die de pagina opent je geschiedenis kunnen zien, je instellingen kunnen wijzigen of kunnen proberen geld te verplaatsen. De login is de voordeur, en je e-mailadres en wachtwoord zijn de sleutel.",
        "Zie je login als de sleutel van je eigen kluisje. In het kluisje zit alles wat persoonlijk is: je trades, je risico-instellingen, je opgeslagen stop-losses. Zolang de sleutel bij jou blijft, kan niemand anders het kluisje openen — ook al staat het in dezelfde ruimte als dat van iedereen.",
        "Voor een handelsapp telt dit zwaarder dan voor de meeste websites, want de app kan echte handelingen uitvoeren met echt geld. Een stevige voordeur is de eerste en belangrijkste beschermingslaag: hij houdt vreemden buiten nog vóór een van de andere veiligheidsfuncties in werking treedt.",
      ],
      example:
        "Stel je voor dat je je computer twee minuten onbeheerd laat in een café. Als de app geen login had, zou de persoon aan het tafeltje naast je hem kunnen openen en beginnen te klikken. Met een login zien ze alleen een inlogscherm dat vraagt om een e-mailadres en wachtwoord die ze niet hebben — je kluisje blijft dicht.",
    },
    {
      id: "c15-l2",
      title: "Wat maakt een wachtwoord sterk?",
      paragraphs: [
        "Een sterk wachtwoord is lang en gevarieerd. Deze app vraagt om minstens 12 tekens, met minstens één hoofdletter, één kleine letter, één cijfer en één speciaal teken (zoals ! of @). Lengte is veruit de belangrijkste factor: elk extra teken maakt een gokaanval een stuk trager.",
        "De vijand van een goed wachtwoord is voorspelbaarheid. Echte woorden, namen, verjaardagen en simpele patronen zoals \"Wachtwoord123!\" zijn het eerste wat een aanvaller probeert. Een wachtwoordzin — meerdere niet-verwante woorden aan elkaar geplakt met een cijfer en een symbool — is zowel sterk als makkelijk te onthouden.",
        "Hergebruik nooit een wachtwoord dat je ergens anders gebruikt. Als een andere website wordt gehackt en je hier hetzelfde wachtwoord gebruikte, zullen aanvallers het ook op je handelsaccount proberen. Een wachtwoordmanager kan een uniek, sterk wachtwoord aanmaken en onthouden, zodat jij dat niet hoeft te doen.",
      ],
      example:
        "Zwak: \"jan2024\" — kort, een naam en een jaartal; in enkele seconden geraden. Sterker: \"Brave-Otter-Citroen-7!\" — vier willekeurige woorden, 20 tekens, met een cijfer en een symbool. Veel moeilijker te raden en toch makkelijk voor de geest te halen.",
    },
    {
      id: "c15-l3",
      title: "Wat is e-mailverificatie en waarom is ze verplicht?",
      paragraphs: [
        "E-mailverificatie is een snelle controle of het e-mailadres waarmee je je hebt aangemeld echt van jou is. Nadat je je registreert, stuurt de app een eenmalige link naar dat adres; door erop te klikken bewijs je dat je post kunt lezen die daarnaartoe wordt gestuurd, en pas dan mag je account inloggen.",
        "Dit beschermt je op twee manieren. Ten eerste voorkomt het dat iemand een account aanmaakt met jouw e-mailadres zonder dat je het weet. Ten tweede zorgt het ervoor dat de app over een werkend adres beschikt om je te bereiken — precies het adres waarnaar later een wachtwoordherstellink zou worden gestuurd.",
        "Als de app niet is ingesteld om e-mail te versturen, wordt verificatie overgeslagen zodat je hem toch kunt gebruiken, en wordt genoteerd dat deze stap was uitgeschakeld. Wanneer e-mail wél is geconfigureerd, is verificatie verplicht en blijft je account in een niet-geverifieerde staat tot je op de link klikt.",
      ],
      example:
        "Je registreert je met \"jij@voorbeeld.com\". De app mailt een link naar die inbox. Tot je de inbox opent en erop klikt, krijg je bij het inloggen \"Bevestig eerst je e-mailadres.\" te zien. Zodra je klikt, is je account bevestigd en kun je gewoon inloggen.",
    },
    {
      id: "c15-l4",
      title: "Wat te doen als je je wachtwoord vergeet",
      paragraphs: [
        "Een wachtwoord vergeten is heel normaal en de app is daarop voorzien. Op het inlogscherm staat een link \"Wachtwoord vergeten?\". Je vult je e-mailadres in, en als er een account voor bestaat, stuurt de app een herstellink naar dat adres. Voor je privacy is de boodschap die je te zien krijgt hetzelfde, of het e-mailadres nu geregistreerd is of niet, zodat nooit wordt verklapt wie een account heeft.",
        "De herstellink is bewust kortstondig — hij werkt één uur en slechts één keer. Zodra je hem gebruikt om een nieuw wachtwoord in te stellen, werkt de link niet meer, zodat een oude e-mail in je inbox niet opnieuw kan worden gebruikt. Je nieuwe wachtwoord moet aan dezelfde sterkte-eisen voldoen als voorheen.",
        "Een nieuw wachtwoord instellen logt ook alle andere actieve sessies uit, dus als iemand binnen was geslopen, sluit het herstel hem buiten. Krijg je ooit een herstelmail die je niet hebt aangevraagd, dan kun je die gerust negeren — er verandert niets tenzij de link daadwerkelijk wordt gebruikt.",
      ],
      example:
        "Je weet je wachtwoord niet meer. Je klikt op \"Wachtwoord vergeten?\", vult je e-mailadres in, en binnen een minuut komt er een link aan. Je opent hem, kiest \"Brave-Otter-Citroen-7!\" als nieuw wachtwoord en je bent weer binnen — en elk apparaat dat nog ingelogd was, wordt voor de veiligheid uitgelogd.",
    },
  ],
  quiz: [
    {
      id: "c15-q1",
      prompt: "Waarom heeft een handelsapp überhaupt een login nodig?",
      options: [
        {
          text: "Zodat alleen jij bij je handelsgegevens en de bediening van je wallet kunt — als een sleutel tot je eigen kluisje.",
          explanation:
            "Juist. De login is de voordeur: hij houdt iedereen behalve jou weg van je gegevens en de bediening van je geld.",
        },
        {
          text: "Zodat de app sneller laadt.",
          explanation: "Nee. Een login draait om toegang en veiligheid, niet om snelheid.",
        },
        {
          text: "Zodat iedereen dezelfde trades en instellingen kan delen.",
          explanation:
            "Nee. Het gaat juist om het tegenovergestelde — je gegevens blijven privé voor jou, ze worden niet gedeeld.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q2",
      prompt: "Welk van deze is het sterkste wachtwoord?",
      options: [
        {
          text: "\"Wachtwoord123!\"",
          explanation:
            "Nee. Het ziet er complex uit, maar het is een van de eerste patronen die aanvallers proberen — een veelvoorkomend woord met een voor de hand liggend cijfer en symbool.",
        },
        {
          text: "\"Brave-Otter-Citroen-7!\"",
          explanation:
            "Juist. Het is lang (20 tekens), combineert verschillende soorten tekens en bestaat uit niet-verwante woorden, dus het is moeilijk te raden en toch makkelijk te onthouden.",
        },
        {
          text: "Je voornaam en geboortejaar",
          explanation:
            "Nee. Namen en datums zijn makkelijk te vinden of te raden en maken een zwak wachtwoord.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c15-q3",
      prompt: "Waarom vraagt de app je om na het registreren je e-mailadres te verifiëren?",
      options: [
        {
          text: "Om te bewijzen dat het adres echt van jou is en dat de app je kan bereiken (bv. voor wachtwoordherstel).",
          explanation:
            "Juist. Verificatie bevestigt dat jij de inbox beheert en geeft de app een werkend adres voor zaken zoals herstellinks.",
        },
        {
          text: "Om je reclame te sturen.",
          explanation: "Nee. Verificatie is een beveiligings- en contactcontrole, geen marketingstap.",
        },
        {
          text: "Om je wachtwoord sterker te maken.",
          explanation:
            "Nee. Het verifiëren van je e-mailadres heeft niets te maken met hoe sterk je wachtwoord is.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q4",
      prompt: "Je bent je wachtwoord vergeten. Wat klopt er over de herstellink die de app stuurt?",
      options: [
        {
          text: "Hij werkt een beperkte tijd en slechts één keer, en het gebruik ervan logt andere sessies uit.",
          explanation:
            "Juist. De link is kortstondig en eenmalig, en het instellen van een nieuw wachtwoord logt elke andere actieve sessie uit.",
        },
        {
          text: "Hij is permanent, dus je kunt dezelfde link opnieuw gebruiken telkens als je het weer vergeet.",
          explanation:
            "Nee. De link verloopt (na ongeveer een uur) en werkt niet meer zodra hij is gebruikt — dat is precies wat hem veilig houdt.",
        },
        {
          text: "Hij vertelt je of het e-mailadres geregistreerd is of niet.",
          explanation:
            "Nee. Voor je privacy is het antwoord in beide gevallen hetzelfde, zodat nooit wordt verklapt wie een account heeft.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
