// PENDING — do not activate until green light.
// Crypto en belastingen: een BASIC-hoofdstuk in gewone taal over of je crypto
// moet aangeven, wat als belastbaar feit telt, hoe je je administratie bijhoudt
// met het tabblad Logboeken van deze app, en wat MiCA voor jou als dagelijkse
// gebruiker betekent. Opgesteld in exact dezelfde vorm als content/en/chapter22.ts,
// met de per-hoofdstuk `whoFor` one-liner getypeerd via een lokale intersectie
// zodat de live Chapter-interface ongemoeid blijft tot integratie. Nieuwe
// BASIC-glossariumtermen die hier worden geïntroduceerd (belastbaar feit, MiCA,
// meerwaarde) staan in glossary.pending.ts, NIET in het live glossarium, en
// worden letterlijk in de tekst gespeld zodat de eerste vermelding automatisch
// aan een tooltip koppelt. Alleen educatief — geen fiscaal, juridisch of
// financieel advies.
import type { Chapter } from "../../../types";

export const chapter25: Chapter & { whoFor: string } = {
  id: "c25",
  number: 25,
  level: "BASIC",
  whoFor: "Voor traders die aan de goede kant van de fiscus willen blijven",
  title: "Crypto en belastingen",
  description:
    "Of je crypto moet aangeven, wat als belastbaar feit telt, hoe je met deze app een nette administratie bijhoudt, en wat MiCA voor jou als gebruiker betekent.",
  lessons: [
    {
      id: "c25-l1",
      title: "Moet je crypto aangeven bij de belastingdienst?",
      paragraphs: [
        "In de meeste landen is het eerlijke antwoord ja. Belastingdiensten behandelen crypto steeds vaker als elk ander bezit, dus winsten, inkomsten en bepaalde swaps moeten mogelijk allemaal in je belastingaangifte worden opgenomen. De precieze regels verschillen sterk van land tot land, en ze veranderen vaak, dus dit hoofdstuk is algemene educatie en geen fiscaal advies.",
        "Wat telt, wanneer het telt en hoeveel je verschuldigd bent, hangt allemaal af van waar je woont. Sommige plaatsen belasten elke winst, sommige belasten alleen winsten boven een drempel, en een enkele belast persoonlijke crypto nauwelijks. Omdat de details zo verschillen, is de enige veilige gewoonte om de regels van je eigen land te controleren of een gekwalificeerde boekhouder te raadplegen voordat je iets aanneemt.",
        "Het goede nieuws is dat crypto aangeven meestal eenvoudig is zodra je een fatsoenlijke administratie bijhoudt. De traders die in de problemen komen zijn zelden degenen die zorgvuldig hebben aangegeven; het zijn degenen die aannamen dat niemand meekeek en helemaal geen geschiedenis bijhielden.",
      ],
      example:
        "Beschouw crypto zoals je een bijverdienste uit het verhuren van een logeerkamer zou beschouwen. Je vindt het misschien klein en privé, maar de fiscus wil er over het algemeen toch van weten. Het negeren laat het niet verdwijnen; het verandert een eenvoudig formulier alleen maar in een probleem voor later. Bij twijfel kost een kort gesprek met een boekhouder veel minder dan een onverwachte belastingaanslag.",
    },
    {
      id: "c25-l2",
      title: "Wat is een belastbaar feit bij crypto?",
      paragraphs: [
        "Een belastbaar feit is elk moment dat de belastingdienst als belastbaar kan behandelen. Bij crypto zijn de gebruikelijke feiten: een token verkopen voor gewoon geld, het ene token omwisselen voor het andere, en crypto ontvangen als betaling voor werk of diensten. Elk daarvan kan iets opleveren dat je moet aangeven, zelfs de swap waarbij nooit gewoon contant geld je bankrekening raakt.",
        "Simpelweg een token aanhouden is meestal geen belastbaar feit. Als je XLM of USDC koopt en het gewoon in je wallet bewaart, laten de meeste belastingstelsels je met rust totdat je het daadwerkelijk verkoopt, omwisselt of uitgeeft. De belasting geldt vaak voor je meerwaarde — de winst tussen wat je betaalde en wat je kreeg toen je het bezit uiteindelijk van de hand deed.",
        "Daarom kan een swap mensen verrassen. Het ene token voor het andere ruilen voelt als het verplaatsen van dingen binnen je eigen wallet, maar veel belastingdiensten zien het als het verkopen van het eerste bezit en het kopen van het tweede, dus een winst op het eerste token kan daar meteen al meetellen. De regels verschillen per land, dus zie dit als een reden om een administratie bij te houden, niet als een definitief oordeel voor jouw situatie.",
      ],
      example:
        "Stel dat je een zeldzame postzegel kocht voor 50 USDC en die later rechtstreeks omwisselde voor een munt van 90 USDC. Je hebt nooit contant geld ontvangen, en toch heb je duidelijk afstand gedaan van iets dat meer waard was dan je betaalde. Veel belastingstelsels zien een cryptoswap op dezelfde manier: de 40 USDC winst is reëel ook al kwam er geen geld op je rekening, en dat moment is het belastbaar feit.",
    },
    {
      id: "c25-l3",
      title: "Hoe houd je je transacties bij voor de belastingen?",
      paragraphs: [
        "Een goede administratie is het hele spel. Voor elke trade wil je over het algemeen de datum, welke tokens erbij betrokken waren, de bedragen, de prijs op dat moment, en eventuele netwerkkosten die je betaalde. Met die informatie kan je boekhouder, of je belastingsoftware, je winsten uitwerken zonder giswerk. Het maanden later uit je geheugen proberen te reconstrueren is pijnlijk en foutgevoelig.",
        "Deze app maakt dat gemakkelijker dan de meeste. Het tabblad Logboeken heeft een subtabblad Handelsgeschiedenis dat je activiteit vastlegt, en de knop voor CSV-export laat je die geschiedenis downloaden als een spreadsheetbestand dat je aan een boekhouder kunt geven of in belastingtools kunt importeren. Eén keer per jaar een nette CSV exporteren, of zelfs één keer per kwartaal, is een van de eenvoudigste gewoonten die je kunt opbouwen.",
        "Omdat tokens op Stellar zich over het SDEX-orderboek en AMM-liquiditeitspools kunnen verplaatsen, en omdat path payments automatisch over markten heen springen, kan je spoor uit meerdere kleine stappen bestaan. Door de geëxporteerde administratie te bewaren kun je precies laten zien wat er is gebeurd, zonder dat je de techniek eronder hoeft uit te leggen.",
      ],
      example:
        "Stel je een schoenendoos voor waarin je elk bonnetje gooit zodra je het krijgt. Bij de belastingaangifte kiep je hem om en alles is er al, gedateerd en compleet. Het tabblad Logboeken is jouw schoenendoos: in plaats van trades op stukjes papier te krabbelen, druk je op CSV-export en krijg je een net, gedateerd bestand van elke transactie dat klaar is om over te dragen.",
    },
    {
      id: "c25-l4",
      title: "Wat is MiCA en wat betekent het voor jou als gebruiker?",
      paragraphs: [
        "MiCA staat voor Markets in Crypto-Assets, het regelboek van de Europese Unie voor cryptodiensten en stablecoins. Het is een wet die gemeenschappelijke standaarden vastlegt in alle EU-landen, zodat cryptobedrijven, vooral die stablecoins zoals USDC uitgeven of exchanges beheren, duidelijkere regels moeten volgen in plaats van in een grijze zone te opereren.",
        "Voor jou als dagelijkse gebruiker komt MiCA vooral tot uiting als meer consumentenbescherming en meer transparantie. Bedrijven die eronder vallen krijgen te maken met duidelijkere eisen over hoe ze werken, wat ze moeten bekendmaken, en hoe ze je geld beschermen. Het doel is dat de diensten die je gebruikt een tikje veiliger en een tikje minder wilde westen zijn, niet dat je persoonlijke handel ingewikkelder wordt.",
        "MiCA gaat over hoe cryptobedrijven worden gereguleerd, wat niet helemaal hetzelfde is als hoe je persoonlijke winsten worden belast; die belastingregels komen nog altijd van je eigen land. Deze les houdt het bewust luchtig, en niets ervan is juridisch advies. Wil je de diepere details over regelgeving, dan gaat het hoofdstuk Regelgeving op Expert-niveau veel verder.",
      ],
      example:
        "Beschouw MiCA als de veiligheids- en etiketteringsregels voor voedsel in een supermarkt. Je leest de regelgeving zelf niet, maar omdat die bestaat, moeten de producten in het schap aan basisnormen voldoen en je vertellen wat erin zit. Op dezelfde manier werkt MiCA op de achtergrond zodat de cryptodiensten die je gebruikt aan gemeenschappelijke regels moeten voldoen, wat je een beetje meer vertrouwen geeft in wat je koopt.",
    },
  ],
  quiz: [
    {
      id: "c25-q1",
      prompt: "Moet je in de meeste landen je crypto-activiteit doorgaans aangeven bij de belastingdienst?",
      options: [
        {
          text: "Nee, crypto is volledig privé en geen enkel land vraagt er ooit naar.",
          explanation:
            "Niet waar. De meeste belastingdiensten behandelen crypto nu als andere bezittingen en verwachten dat winsten of inkomsten worden aangegeven. Aannemen dat niemand meekijkt is precies hoe mensen in de problemen komen.",
        },
        {
          text: "Ja, in de meeste landen, al verschillen de precieze regels — dus het is verstandig om lokale regels te controleren of een boekhouder te raadplegen.",
          explanation:
            "Juist. Crypto aangeven is meestal verplicht, maar de specifieke regels verschillen per land en veranderen vaak, dus je eigen regels controleren of een gekwalificeerde boekhouder raadplegen is de veilige gewoonte.",
        },
        {
          text: "Alleen als je meer dan een miljoen winst maakt.",
          explanation:
            "Nee. Sommige landen hebben wel drempels, maar die verschillen sterk en liggen meestal veel lager dan dat. Er is geen enkele wereldwijde grens, en daarom controleer je je lokale regels.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c25-q2",
      prompt: "Welke van deze zaken telt het meest waarschijnlijk als een belastbaar feit?",
      options: [
        {
          text: "Het ene token omwisselen voor het andere, zoals XLM ruilen voor USDC.",
          explanation:
            "Juist. Veel belastingdiensten behandelen een swap als het verkopen van het eerste bezit en het kopen van het tweede, dus een winst op het eerste token kan precies op dat moment worden belast, ook al was er geen gewoon contant geld bij betrokken.",
        },
        {
          text: "Simpelweg een token in je wallet aanhouden zonder het te verkopen of om te wisselen.",
          explanation:
            "Meestal niet. Alleen aanhouden wordt over het algemeen met rust gelaten totdat je het bezit daadwerkelijk verkoopt, omwisselt of uitgeeft. De belasting geldt doorgaans wanneer je het van de hand doet, niet terwijl je het aanhoudt.",
        },
        {
          text: "De app openen om naar een prijsgrafiek te kijken.",
          explanation:
            "Nee. Naar prijzen of grafieken kijken verplaatst geen bezittingen en levert niets op om aan te geven. Voor een belastbaar feit is een echte vervreemding, betaling of inkomst nodig.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c25-q3",
      prompt: "Wat is de eenvoudigste manier om je transactiegeschiedenis uit deze app te halen voor je belastingadministratie?",
      options: [
        {
          text: "Proberen elke trade aan het einde van het jaar te herinneren.",
          explanation:
            "Trades uit je geheugen reconstrueren is pijnlijk en foutgevoelig. Datums, bedragen en prijzen zijn moeilijk nauwkeurig te herinneren, en dat is precies de fout die een goede administratie voorkomt.",
        },
        {
          text: "Een schermafbeelding van de prijsgrafiek maken.",
          explanation:
            "Een schermafbeelding van een grafiek toont een prijs, niet je daadwerkelijke trades. Het bevat geen van de datums, bedragen of kosten die een boekhouder nodig heeft om je winsten uit te werken.",
        },
        {
          text: "Het subtabblad Handelsgeschiedenis van het tabblad Logboeken en de CSV-export gebruiken om een gedateerd bestand van je transacties te downloaden.",
          explanation:
            "Juist. Het tabblad Logboeken legt je activiteit vast, en de CSV-export geeft je een nette, gedateerde spreadsheet die je aan een boekhouder kunt geven of in belastingtools kunt importeren — net als het omkiepen van een schoenendoos met bonnetjes die al gesorteerd is.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
