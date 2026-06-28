import type { Chapter } from "../../types";

export const chapter14: Chapter = {
  id: "c14",
  number: 14,
  level: "BASIC",
  title: "Je account en je gegevens",
  description:
    "Wat een gebruikersaccount is, hoe je tradinggegevens gescheiden worden gehouden van die van alle anderen, en wat ermee gebeurt als je ooit je account verwijdert.",
  lessons: [
    {
      id: "c14-l1",
      title: "Wat is een gebruikersaccount en waarom is dat belangrijk?",
      paragraphs: [
        "Een account is je eigen, persoonlijke ruimte binnen de app. Het is de manier waarop het dashboard weet welke trades, settings, stop losses en geschiedenis bij jou horen en bij niemand anders. Zodra je inlogt op je account, is alles wat je ziet en alles wat de bot doet uitsluitend aan jou gekoppeld.",
        "Zie je account als een persoonlijk kluisje. Alleen jij hebt de sleutel. Alles wat je erin stopt — je tradinggeschiedenis, je risico-instellingen, je opgeslagen stop losses — blijft in jouw kluisje, en geen enkele andere gebruiker kan het openen of zien wat erin zit.",
        "Dit is belangrijk omdat traden persoonlijk is. Je beslissingen, je cijfers en je fouten gaan niemand anders iets aan. Een account houdt je informatie privé en zorgt ervoor dat de bot handelt op basis van jouw settings, niet die van iemand anders.",
      ],
      example:
        "Stel dat twee mensen deze app gebruiken. De een stelt een voorzichtige risicolimiet in en handelt alleen met kleine bedragen. De ander laat de AI agressiever traden. Omdat elke persoon zijn eigen account heeft — zijn eigen kluisje — raakt de limiet van de voorzichtige trader nooit vermengd met die van de agressieve trader. Elk account houdt zijn eigen settings, zijn eigen geschiedenis en zijn eigen wallet volledig gescheiden.",
    },
    {
      id: "c14-l2",
      title: "Hoe je tradinggegevens gescheiden worden gehouden van andere gebruikers",
      paragraphs: [
        "Achter de schermen wordt elk stukje informatie dat de app opslaat — een trade, een logregel, een stop loss, een setting — gemarkeerd met het id van het account waartoe het behoort. Wanneer je het dashboard opent, leest de app alleen de regels terug die met jouw id zijn gemarkeerd.",
        "Dit is wat voorkomt dat kluisjes in elkaar lekken. Ook al staan de gegevens van iedereen in dezelfde database, jouw trades kunnen nooit op het scherm van een andere gebruiker verschijnen, omdat de app alles eerst op jouw account filtert.",
        "Het betekent ook dat je daglimieten, je gerealiseerde winst en verlies en je scanresultaten alleen worden berekend op basis van je eigen activiteit. Iemand anders die op dezelfde server handelt, verandert je cijfers niet met ook maar één cent.",
      ],
      example:
        "Stel dat de database 10.000 trades van veel gebruikers bevat. Wanneer je je geschiedenis opent, vraagt de app alleen om de trades die met jouw account-id zijn gemarkeerd, dus zie je er misschien maar 40 — die van jou. De overige 9.960 blijven voor jou onzichtbaar, net zoals jouw trades onzichtbaar blijven voor iedereen anders.",
    },
    {
      id: "c14-l3",
      title: "Wat gebeurt er met je gegevens als je je account verwijdert?",
      paragraphs: [
        "Het verwijderen van je account verwijdert je kluisje en alles wat de app erin bewaart. Je opgeslagen trades, settings, stop losses, meldingen en logs worden uit de gegevens van de app gewist, zodat ze door niemand meer kunnen worden gelezen.",
        "Eén ding dat verwijdering niet ongedaan kan maken, is de blockchain zelf. Zoals je in het eerste hoofdstuk zag, is een trade die al op Stellar is afgewikkeld permanent en openbaar. Het verwijderen van je account wist de kopie van je geschiedenis in de app, maar het kan het openbare grootboek van trades die al on-chain hebben plaatsgevonden niet herschrijven.",
        "Je wallet staat ook los van je account. Je geld leeft op het Stellar-netwerk onder je eigen sleutels, niet binnen deze app, dus het verwijderen van je account raakt je munten niet. (Inloggen en een account verwijderen komen in een latere stap; deze les legt uit wat dat wel en wat dat niet met je gegevens zal doen.)",
      ],
      example:
        "Stel dat je je account verwijdert na een maand traden. De app vergeet je settings, je stop losses en je opgeslagen geschiedenis — ze zijn weg uit het dashboard. Maar als je je oude trades opzoekt in een openbare Stellar-explorer, staan ze er nog steeds, omdat de blockchain zijn eigen permanente overzicht bijhoudt dat geen enkele app kan wissen.",
    },
  ],
  quiz: [
    {
      id: "c14-q1",
      prompt: "Waarom geeft de app elke persoon zijn eigen account?",
      options: [
        {
          text: "Zodat iedereen één gezamenlijke set settings en geschiedenis kan delen.",
          explanation:
            "Nee. Het doel van aparte accounts is juist het tegenovergestelde: de settings en geschiedenis van elke persoon zijn voor hem privé, niet gedeeld.",
        },
        {
          text: "Zodat de trades, settings en geschiedenis van elke persoon privé en gescheiden blijven, als een persoonlijk kluisje dat alleen hij kan openen.",
          explanation:
            "Juist. Een account is je persoonlijke kluisje: je gegevens horen bij jou en geen enkele andere gebruiker kan ze zien of wijzigen.",
        },
        {
          text: "Zodat de app je trades aan andere gebruikers kan tonen om te vergelijken.",
          explanation:
            "Nee. Je trades zijn privé voor je account en worden nooit aan andere gebruikers getoond.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c14-q2",
      prompt:
        "De gegevens van veel gebruikers staan in dezelfde database. Hoe voorkomt de app dat je de trades van een andere gebruiker ziet?",
      options: [
        {
          text: "De app markeert elke regel met een account-id en leest alleen de regels terug die met die van jou zijn gemarkeerd.",
          explanation:
            "Juist. Elke trade, log en setting draagt het account-id van de eigenaar, en de app filtert op jouw id, zodat je alleen je eigen gegevens ziet.",
        },
        {
          text: "De app vertrouwt er gewoon op dat elke gebruiker niet naar de gegevens van de anderen kijkt.",
          explanation:
            "Nee. De scheiding berust niet op vertrouwen. De app filtert technisch elke uitlezing op je account-id.",
        },
        {
          text: "De app bewaart slechts de gegevens van één gebruiker tegelijk en verwijdert die van alle anderen.",
          explanation:
            "Nee. De gegevens van alle gebruikers kunnen tegelijk worden opgeslagen; de app houdt ze gescheiden op account-id in plaats van die van iemand te verwijderen.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c14-q3",
      prompt: "Je verwijdert je account nadat je een tijdje hebt gehandeld. Wat gebeurt er?",
      options: [
        {
          text: "De app wist je opgeslagen settings, stop losses en geschiedenis, maar trades die al op Stellar zijn afgewikkeld blijven op de openbare blockchain staan, en het geld in je wallet blijft onaangeroerd.",
          explanation:
            "Juist. Verwijdering wist je gegevens uit de app, maar het blockchain-overzicht van eerdere on-chain trades is permanent, en je munten leven in je wallet, niet in de app.",
        },
        {
          text: "Elke trade die je ooit hebt gedaan, wordt ook van de blockchain gewist.",
          explanation:
            "Nee. De blockchain is permanent en openbaar; geen enkele app kan een trade wissen die al on-chain is afgewikkeld.",
        },
        {
          text: "Je munten worden samen met je account verwijderd.",
          explanation:
            "Nee. Je geld leeft op het Stellar-netwerk onder je eigen sleutels, dus het verwijderen van je account raakt je munten niet.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
