// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Gevorderd hoofdstuk over de kern-indicatoren van technische analyse: voortschrijdende
// gemiddelden, RSI, MACD, Bollinger Bands, en hoe je een kleine, samenlopende set combineert
// zonder te verdrinken in tegenstrijdige signalen. Geschreven in exact dezelfde vorm als
// content/en/chapter22.ts, met de `whoFor`-oneliner per hoofdstuk getypeerd via een
// lokale intersection zodat de live Chapter-interface ongemoeid blijft. Dit hoofdstuk
// bezit geen nieuwe woordenlijsttermen; het hergebruikt alleen termen uit eerdere hoofdstukken.
import type { Chapter } from "../../types";

export const chapter27: Chapter & { whoFor: string } = {
  id: "c27",
  number: 27,
  level: "ADVANCED",
  whoFor: "Voor traders die klaar zijn om de indicatoren achter de prijs te lezen",
  title: "Technische analyse — kern-indicatoren",
  description:
    "Voortschrijdende gemiddelden, RSI, MACD en Bollinger Bands — wat elk van hen meet, en hoe je een kleine set ervan combineert zonder te verdrinken in tegenstrijdige signalen.",
  lessons: [
    {
      id: "c27-l1",
      title: "Wat is een voortschrijdend gemiddelde (MA) en hoe gebruik je het?",
      paragraphs: [
        "Een voortschrijdend gemiddelde effent een grillige prijs tot één lijn door de laatste N slotkoersen te middelen naarmate de tijd verstrijkt. Het voorspelt niets; het vat samen wat de prijs al heeft gedaan, en filtert de ruis weg zodat een trend beter zichtbaar wordt. Traders letten erop of de prijs boven of onder de lijn ligt, en of de lijn zelf omhoog of omlaag helt.",
        "De twee gangbare types verschillen in hoe ze de data wegen. Een simpel voortschrijdend gemiddelde (SMA) behandelt elke prijs in het venster gelijk. Een exponentieel voortschrijdend gemiddelde (EMA) weegt recente prijzen zwaarder, waardoor het sneller draait wanneer de prijs verandert, maar ook vaker heen en weer schiet. Geen van beide is \"beter\": de SMA is stabieler, de EMA is responsiever, en de keuze hangt af van hoe snel je wilt reageren.",
        "Een uitgewerkt contrast maakt dit concreet. Neem vijf dagelijkse slotkoersen voor XLM in USDC: 0,100, 0,104, 0,108, 0,112, 0,126. De SMA over 5 perioden is hun gewone gemiddelde, 0,110. Een EMA over 5 perioden leunt veel zwaarder op de laatste 0,126 en komt uit rond 0,116 — merkbaar hoger, omdat de recente sprong domineert. Als de prijs daarna daalt, zakt de EMA eerder terug dan de SMA.",
        "In Atrium zou je deze trends volgen op de tokendetailpagina, waar de prijsgrafiek tabbladen voor uur, dag, week en jaar biedt met candlesticks en volume. Een langer tabblad (week of jaar) met een tragere SMA toont de onderliggende trend; een korter tabblad (uur of dag) met een EMA reageert op bewegingen binnen de dag. Dit is puur het lezen van een grafiek — Atrium tekent geen indicatoren en plaatst geen orders voor je.",
      ],
      example:
        "Twee mensen beschrijven een heuvelachtige weg. De SMA-wandelaar middelt de laatste vijf wegwijzers en noemt de weg \"licht stijgend\". De EMA-wandelaar leunt het zwaarst op het nieuwste bord, waarop net \"steile klim\" stond, en noemt het \"snel stijgend\". Beiden hebben gelijk over dezelfde data; de EMA reageert simpelweg sneller op de meest verse informatie, ten koste van overreageren op één enkele hobbel.",
    },
    {
      id: "c27-l2",
      title: "Wat is RSI (Relative Strength Index)?",
      paragraphs: [
        "RSI is een momentum-oscillator die de snelheid van recente prijsveranderingen meet op een vaste schaal van 0 tot 100. Hij vergelijkt de gemiddelde grootte van opwaartse bewegingen met die van neerwaartse bewegingen over een terugblikvenster, klassiek 14 perioden. Een hoge stand betekent dat kopers sterk hebben gedomineerd; een lage stand betekent dat verkopers dat deden. Omdat hij begrensd is, is RSI in één oogopslag af te lezen.",
        "De conventionele signalen zijn de niveaus van 70 en 30. Boven 70 wordt het asset overbought genoemd — het is snel gestegen en is misschien toe aan een pauze of terugval. Onder 30 wordt het oversold genoemd — het is snel gedaald en is misschien toe aan een opveer. Sommige traders letten ook op de middenlijn van 50 als ruwe trendscheiding, en zoeken naar divergentie, waarbij de prijs een nieuwe piek maakt maar de RSI niet, wat suggereert dat de beweging aan kracht verliest.",
        "De cruciale kanttekening is dat overbought niet \"nu verkopen\" betekent, en oversold niet \"nu kopen\". In een sterke trend kan de RSI dagen of weken boven 70 blijven plakken terwijl de prijs blijft klimmen, en elk 70-signaal short verkopen zou je droogleggen. RSI is het betrouwbaarst in een zijwaarts bewegende, schommelende markt; in een krachtige trend blijft hij uitgerekt en misleiden de extremen. Behandel hem als een beschrijving van momentum, niet als een op zichzelf staande trigger.",
        "Op de tokendetailpagina van Atrium zou je naar het dagtabblad kunnen schakelen, de candlesticks lezen en opmerken dat een token dat op zwaar volume omhoog schiet waarschijnlijk een hoge RSI toont — nuttige context, maar op zichzelf geen reden om tegen de trend in te handelen.",
      ],
      example:
        "Tijdens een snelle XLM-rally raakt de RSI op de daggrafiek 78. Een trader die reflexmatig short verkoopt \"omdat het overbought is\" wordt uitgestopt terwijl de prijs nog een week doorstijgt met de RSI nog altijd rond 80. Diezelfde stand van 78 tijdens een vlakke, schommelende week — waarin de prijs telkens stokt en terugzakt — zou een veel betrouwbaarder signaal zijn geweest dat de opmars overdreven ver was doorgeschoten.",
    },
    {
      id: "c27-l3",
      title: "Wat is MACD en wat vertelt het je over momentum?",
      paragraphs: [
        "MACD (Moving Average Convergence Divergence) zet twee voortschrijdende gemiddelden om in een momentumlezing. De MACD-lijn is het verschil tussen een snelle EMA en een trage EMA, klassiek de 12-perioden minus de 26-perioden. Wanneer het snelle gemiddelde zich boven het trage uitwerkt, bouwt het momentum zich op aan de opwaartse kant; wanneer het eronder zakt, keert het momentum omlaag. Het punt waar de MACD-lijn nul kruist, markeert waar de twee gemiddelden elkaar daadwerkelijk kruisen.",
        "Een tweede lijn, de signaallijn, is een EMA over 9 perioden van de MACD-lijn zelf — een geëffende versie ervan. Het kerngebeuren is de kruising: wanneer de MACD-lijn omhoog door de signaallijn kruist, wordt dat gelezen als versterkend opwaarts momentum, en een kruising omlaag als verzwakkend momentum. Deze signalen lopen achter, omdat ze zijn opgebouwd uit gemiddelden van eerdere prijzen, dus ze bevestigen een verschuiving in plaats van die vroegtijdig aan te kondigen.",
        "Het histogram is het derde onderdeel: staafjes die het gat tussen de MACD-lijn en de signaallijn tonen. Groeiende staafjes betekenen dat de twee lijnen uit elkaar lopen en dat het momentum versnelt; krimpende staafjes betekenen dat ze naar elkaar toe bewegen en dat het momentum vervaagt, wat vaak aan de kruising zelf voorafgaat. Het histogram lezen is een manier om een omslag een tel eerder te zien aankomen dan de lijnen daadwerkelijk kruisen.",
        "Zoals elke indicator hier beschrijft MACD het momentum in prijzen die Atrium op de tokendetailgrafiek uitzet; het plaatst nooit een trade. Elke daaruit volgende beslissing loopt nog steeds door de gewone tools van de app en, bij Bot-handel, door de betrouwbaarheidsdrempel en risicofactoren van de AI-analist.",
      ],
      example:
        "XLM genoteerd in USDC is aan het wegglijden geweest, en de MACD-histogramstaafjes onder nul beginnen dag na dag te krimpen, nog voordat de prijs draait — het neerwaartse momentum vervaagt. Een paar dagen later kruist de MACD-lijn omhoog door zijn signaallijn, wat de verschuiving bevestigt die het histogram al aankondigde. Een trader die het histogram in de gaten hield, had een vooruitwaarschuwing; wie op de kruising wachtte, kreeg een later maar sterker bevestigd signaal.",
    },
    {
      id: "c27-l4",
      title: "Wat zijn Bollinger Bands?",
      paragraphs: [
        "Bollinger Bands omhullen een voortschrijdend gemiddelde met twee volatiliteitsbanden. De middenlijn is doorgaans een SMA over 20 perioden. De boven- en onderband liggen een vast aantal standaarddeviaties ervandaan — meestal twee. Omdat de standaarddeviatie groeit wanneer de prijs wijd uitslaat en krimpt wanneer die tot rust komt, verbreden de banden zich automatisch in volatiele periodes en knijpen ze samen in rustige. Ze zijn een beeld van hoe uitgerekt en hoe volatiel de prijs op dat moment is.",
        "Twee kenmerken krijgen de meeste aandacht. Een squeeze is wanneer de banden scherp vernauwen, wat wijst op ongewoon lage volatiliteit — een opgewonden veer. Het vertelt je dat een grotere beweging statistisch waarschijnlijker wordt, maar het vertelt je cruciaal genoeg niet de richting. Een aanraking van de boven- of onderband betekent dat de prijs ver van zijn recente gemiddelde af staat; in een schommelende markt gaat dat vaak vooraf aan een terugveer naar het midden, maar in een sterke trend kan de prijs \"langs de band lopen\" en die dicht volgen terwijl hij doorgaat.",
        "De eerlijke grenzen doen ertoe. Bollinger Bands voorspellen niet waar de prijs heen gaat. Een squeeze voorspelt dat de volatiliteit zou moeten toenemen, niet of de uitbraak omhoog of omlaag loopt. Een bandaanraking is geen automatisch omkeersignaal. Ze beschrijven volatiliteit en afstand-tot-het-gemiddelde — werkelijk nuttige context, maar niet meer dan dat. Een bandaanraking koppelen aan een RSI-stand of een MACD-omslag geeft je veel meer dan de banden alleen.",
        "Dit alles zou je aflezen van de candlestickgrafiek van Atrium op de tokendetailpagina, waarbij je een tijdvenster-tabblad kiest dat bij je horizon past — een weektabblad voor een swingblik, een uurtabblad voor volatiliteit binnen de dag.",
      ],
      example:
        "Op de XLM/USDC-weekgrafiek knijpen de Bollinger Bands na twee rustige weken samen tot een strakke squeeze — de volatiliteit is weggevloeid. Dagen later breekt de prijs scherp uit de bandbreedte en waaieren de banden wijd open. De squeeze waarschuwde terecht dat er een grote beweging aankwam; hij zei nooit welke kant op, dus een trader die puur op de squeeze op een richting inzette, gokte maar wat.",
    },
    {
      id: "c27-l5",
      title: "Hoe combineer je indicatoren zonder jezelf in de war te brengen",
      paragraphs: [
        "De meest voorkomende beginnersfout is indicator-overload: een dozijn tools op één grafiek stapelen tot ze elkaar tegenspreken, en dan verstijven. RSI zegt oversold, MACD zegt neerwaarts momentum, de banden zeggen squeeze — en je hebt geen idee wat te doen. Meer indicatoren toevoegen voegt geen extra zekerheid toe. De meeste zijn opgebouwd uit dezelfde prijs- en volumedata, dus een scherm vol ervan herhaalt grotendeels zichzelf terwijl het aanvoelt als onafhankelijke bevestiging.",
        "De oplossing is een kleine, bewust samenlopende set die verschillende dingen meet. Een verstandig drietal: één trendtool (een voortschrijdend gemiddelde), één momentumtool (RSI of MACD) en één volatiliteitstool (Bollinger Bands). Samenloop betekent dat je pas handelt wanneer ze het eens zijn — bijvoorbeeld: prijs boven een stijgende MA (trend omhoog), RSI die herstelt uit oversold (momentum draait) en een bandsqueeze die opwaarts oplost (volatiliteit die zich in jouw richting uitbreidt). Wanneer ze het oneens zijn, is het eerlijke antwoord meestal om niets te doen.",
        "Bepaal je set en je regels vooraf, in een rustig moment, precies zoals hoofdstuk 22 over Handelspsychologie aanraadt voor een handelsplan. Zo voorkom je dat je naar een verse indicator grijpt telkens wanneer je niet houdt van wat de huidige zeggen — een vorm van bevestiging zoeken die regelrecht terugleidt naar overload. Minder tools die je diepgaand begrijpt, verslaan er vele die je oppervlakkig leest.",
        "In de praktijk zou je deze samenloop rechtstreeks aflezen van de tokendetailgrafiek van Atrium, tijdvenster-tabbladen omschakelen en candlesticks en volume controleren, en vervolgens elke beslissing via het handmatige formulier laten lopen of, bij Bot-handel, afwegen tegen de betrouwbaarheidsscore van de AI-analist. Dit is educatieve inhoud, geen financieel advies — geen enkele indicator of combinatie garandeert een uitkomst.",
      ],
      example:
        "Een trader die XLM/USDC volgt, gebruikt slechts drie tools. De prijs ligt boven een stijgende MA over 50 perioden, de RSI is van 32 terug omhoog door 40 geklommen, en een Bollinger-squeeze is net opwaarts uitgebroken — drie verschillende dingen (trend, momentum, volatiliteit) die allemaal dezelfde kant op wijzen, dus de trade heeft echte samenloop. Een week later is alleen de MA het eens, terwijl RSI en de banden neutraal zijn; met verdeelde signalen is de gedisciplineerde zet om aan de kant te blijven in plaats van het te forceren.",
    },
  ],
  quiz: [
    {
      id: "c27-q1",
      prompt: "Gegeven de vijf slotkoersen 0,100, 0,104, 0,108, 0,112, 0,126, hoe verhoudt een EMA over 5 perioden zich tot de SMA over 5 perioden van 0,110?",
      options: [
        {
          text: "De EMA is hoger dan 0,110, omdat hij de meest recente 0,126 zwaarder weegt.",
          explanation:
            "Juist. Een EMA leunt op recente prijzen, dus de laatste sprong naar 0,126 trekt hem boven de gelijkgewogen SMA van 0,110 — precies waarom een EMA sneller op verse bewegingen reageert.",
        },
        {
          text: "De EMA is lager dan 0,110, omdat hij de meest recente prijs weggooit.",
          explanation:
            "Andersom. Een EMA gooit de nieuwste prijs niet weg; hij benadrukt die juist. Die recente 0,126 trekt de EMA omhoog, niet omlaag.",
        },
        {
          text: "De EMA is gelijk aan 0,110, omdat beide gemiddelden altijd hetzelfde getal opleveren.",
          explanation:
            "Nee. Ze komen alleen overeen wanneer de prijzen vlak zijn. Bij een stijgende reeks laten de verschillende wegingen de EMA en SMA uiteenlopen.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q2",
      prompt: "De RSI op de daggrafiek zit al meer dan een week boven 70 vastgeplakt terwijl de prijs blijft klimmen. Wat vertelt dit je?",
      options: [
        {
          text: "Het is een gegarandeerd verkoopsignaal — de prijs moet omkeren op het moment dat de RSI 70 kruist.",
          explanation:
            "Dit is de klassieke RSI-val. In een sterke trend kan de RSI lang overbought blijven, en elk 70-signaal short verkopen legt een trader droog.",
        },
        {
          text: "De RSI is kapot en moet op dit token volledig genegeerd worden.",
          explanation:
            "Niet waar. De RSI werkt precies zoals bedoeld — hij weerspiegelt aanhoudend sterk momentum. De fout is te verwachten dat zijn extremen als omkeertriggers werken in een trend.",
        },
        {
          text: "In een sterke trend kan de RSI lang overbought blijven; zijn extremen zijn veel betrouwbaarder in schommelende markten dan in trends.",
          explanation:
            "Juist. Overbought betekent niet \"nu verkopen\". De 70/30-extremen van de RSI zijn het betrouwbaarst in zijwaartse bandbreedtes; in een krachtige trend blijft hij uitgerekt en misleidt hij.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c27-q3",
      prompt: "Wat stelt het MACD-histogram voor, en waarom letten traders erop?",
      options: [
        {
          text: "Het toont het gat tussen de MACD-lijn en de signaallijn; krimpende staafjes kunnen waarschuwen voor een vervagende beweging voordat de lijnen daadwerkelijk kruisen.",
          explanation:
            "Juist. Het histogram is de afstand tussen de twee lijnen. Staafjes die naar nul krimpen betekenen dat het momentum samenkomt, wat vaak aan de kruising zelf voorafgaat — een vroege waarschuwing.",
        },
        {
          text: "Het toont het ruwe handelsvolume voor elke candle.",
          explanation:
            "Nee. Volume is een aparte reeks (Atrium zet die uit op de tokengrafiek). Het MACD-histogram is het gat tussen de MACD-lijn en zijn signaallijn.",
        },
        {
          text: "Het toont het accountsaldo in USDC in de loop van de tijd.",
          explanation:
            "Nee. Het histogram heeft niets met je saldo te maken; het is puur het verschil tussen de MACD-lijn en de signaallijn.",
        },
        {
          text: "Het voorspelt het exacte toekomstige prijsdoel van het asset.",
          explanation:
            "Geen enkele indicator voorspelt een exacte prijs. Het histogram beschrijft momentum door het gat tussen twee lijnen te meten — het voorspelt niets precies.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q4",
      prompt: "Er verschijnt een Bollinger Band-squeeze op de grafiek. Wat mag je daar legitiem uit concluderen?",
      options: [
        {
          text: "De prijs staat op het punt te stijgen, want een squeeze is een bullish signaal.",
          explanation:
            "Een squeeze zegt niets over de richting. Hem als bullish lezen is gokken; de uitbraak kan net zo goed omlaag gaan.",
        },
        {
          text: "De volatiliteit is ongewoon laag en een grotere beweging wordt statistisch binnenkort waarschijnlijker — maar de squeeze vertelt je niet de richting.",
          explanation:
            "Juist. Smalle banden betekenen lage volatiliteit, een opgewonden veer. Het verhoogt de kans op een grotere beweging maar zwijgt over omhoog versus omlaag — daarom koppelen traders het aan andere tools.",
        },
        {
          text: "Het token heeft zijn trustline verloren en kan niet langer verhandeld worden.",
          explanation:
            "Niet gerelateerd. Een squeeze is een volatiliteitslezing op de prijsgrafiek; trustlines zijn een opt-in op accountniveau om een token te houden en hebben niets met bandbreedte te maken.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c27-q5",
      prompt: "Je grafiek heeft tien indicatoren en drie ervan spreken elkaar nu tegen. Wat is de verstandige reactie?",
      options: [
        {
          text: "Voeg nog drie indicatoren toe totdat een meerderheid het eens is.",
          explanation:
            "Dit is indicator-overload. De meeste indicatoren zijn opgebouwd uit dezelfde prijsdata, dus er meer op stapelen herhaalt grotendeels informatie terwijl het aanvoelt als verse bevestiging.",
        },
        {
          text: "Kies welke indicator ook maar zegt wat je hoopte te horen.",
          explanation:
            "Dat is bevestiging zoeken — de tool eruit pikken die je vooringenomenheid vleit. Het verlaat elk op regels gebaseerd proces en leidt regelrecht terug naar verwarring.",
        },
        {
          text: "Snoei terug tot een kleine samenlopende set — één trend-, één momentum-, één volatiliteitstool — en handel pas wanneer ze het eens zijn, blijf anders aan de kant.",
          explanation:
            "Juist. Een bewust kleine set die verschillende dingen meet, geeft echte samenloop. Wanneer ze het oneens zijn, is de eerlijke zet meestal om niets te doen, en de set hoort rustig vooraf gekozen te worden als onderdeel van een handelsplan.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
