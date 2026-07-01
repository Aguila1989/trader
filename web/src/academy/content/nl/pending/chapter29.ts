// PENDING — do not activate until green light.
// Advanced chapter on Trading Strategies (day/swing/HODL, dollar-cost averaging,
// risk/reward ratio, position sizing, and the power of doing nothing). Authored
// to the exact same shape as content/en/chapter01.ts, with the per-chapter
// `whoFor` one-liner typed via a local intersection so the live Chapter
// interface stays untouched until integration. This chapter owns no new glossary
// terms; it naturally reuses vocabulary introduced in earlier chapters.
import type { Chapter } from "../../../types";

export const chapter29: Chapter & { whoFor: string } = {
  id: "c29",
  number: 29,
  level: "ADVANCED",
  whoFor: "Voor traders die een stijl en positiegrootte kiezen die bij hen past",
  title: "Handelsstrategieën",
  description:
    "Day trading versus swing trading versus HODL, dollar-cost averaging, de risk/reward-verhouding, positiegrootte en de onderschatte kracht van niets doen.",
  lessons: [
    {
      id: "c29-l1",
      title: "Day trading versus swing trading versus HODL — wat past bij jou?",
      paragraphs: [
        "Deze drie stijlen verschillen vooral in tijdshorizon. Een day trader opent en sluit posities binnen enkele uren, met als doel kleine bewegingen binnen de dag te vangen, en houdt zelden iets aan tot de volgende dag. Een swing trader houdt posities dagen of weken aan, rijdt mee op één trend of ommekeer, en accepteert dat prijzen springen terwijl hij slaapt. Een HODLer koopt en houdt maanden of jaren aan, negeert de ruis en zet in op de langetermijnthese van een asset zoals XLM of een token waarvoor hij een trustline heeft geopend.",
        "De inspanning schaalt mee met de snelheid. Day trading vraagt uren geconcentreerde schermtijd, snelle uitvoering en strakke discipline op kosten en slippage — op Stellar kost elke fill een kleine netwerkvergoeding plus AMM-poolkosten van 0,30% of de SDEX-spread, en die kosten stapelen zich op wanneer je vaak handelt. Swing trading vereist een dagelijkse check en geduld tijdens dalingen. HODL vraagt bijna geen dagelijkse aandacht, maar wel de emotionele kracht om door diepe dips heen vast te houden zonder in paniek te verkopen.",
        "Temperament is de echte doorslaggevende factor. Als voortdurend schermkijken je stress bezorgt, zal day trading je slopen, hoe goed de setups er ook uitzien. Als je het niet kunt verdragen om een positie een week lang in het rood te zien staan, schudt swing trading je vroegtijdig uit. Wees eerlijk over de tijd die je hebt en de volatiliteit die je aankunt, en kies dan de traagste stijl die nog bij je doelen past — trager betekent doorgaans minder gedwongen fouten en lagere cumulatieve kosten.",
      ],
      example:
        "Stel dat je XLM aanhoudt en meer blootstelling aan USDC wilt. Een day trader zou vóór de lunch vijf kleine XLM/USDC-heen-en-weertjes kunnen scalpen, en telkens kosten betalen. Een swing trader zou één instap op een dip zetten en een week aanhouden voor een grotere beweging. Een HODLer zou simpelweg de XLM behouden en af en toe het week- of jaartabblad op de tokendetailpagina bekijken. Dezelfde asset, drie totaal verschillende levensstijlen — de juiste is die welke je kunt volhouden zonder op te branden.",
    },
    {
      id: "c29-l2",
      title: "Wat is dollar-cost averaging (DCA)?",
      paragraphs: [
        "Dollar-cost averaging betekent dat je een vast bedrag van een asset koopt volgens een vast schema, ongeacht de prijs die dag. In plaats van te proberen de perfecte instap te timen, verplicht je jezelf om bijvoorbeeld elke week of maand voor 50 USDC aan XLM te kopen. Wanneer de prijs laag is, koopt je vaste bedrag meer eenheden; wanneer die hoog is, koopt het er minder. Na verloop van tijd vlakt je gemiddelde kostprijs af, en je zet nooit per ongeluk je hele inleg in op het allerslechtste moment.",
        "Het doel van DCA is om emotie en timing uit de beslissing te halen. Omdat de aankoop mechanisch verloopt, kan FOMO je niet aanzetten om een piek te veel te kopen en kan angst je niet tegenhouden om een dip te kopen — het schema heeft al voor je beslist. Je ruilt de kans op een perfect getimede eenmalige instap in voor consistentie en veel minder slapeloze nachten. Het werkt het best voor assets waar je op de lange termijn in gelooft, niet voor munten die je niet door een neergang heen zou willen aanhouden.",
        "In deze app is er geen knop voor automatisch terugkerende aankopen, dus DCA is een discipline die je zelf uitvoert: een terugkerende agenda-herinnering om bij elk interval dezelfde JIJ VERKOOPT USDC / JIJ KOOPT XLM-order van dezelfde omvang te plaatsen. Merk op dat elke aankoop in de meeste rechtsgebieden een aparte belastbare gebeurtenis is, dus houd je administratie bij — dit is educatieve richtlijn, geen belastingadvies, en de regels verschillen per land.",
      ],
      example:
        "Denk aan een spaarplan waarbij je elke maand 50 EUR opzijzet, wat de markt ook doet. Je bestudeert geen grafieken vóór elke storting; je stort gewoon jaar in, jaar uit op de eerste van de maand. Dalen de prijzen, dan koopt je 50 EUR stilletjes meer; stijgen ze, dan koopt het minder. DCA in XLM is precies dezelfde gewoonte: elke maand vast 50 USDC, prijs genegeerd, emotie verwijderd.",
    },
    {
      id: "c29-l3",
      title: "Wat is een risk/reward-verhouding en hoe bereken je die?",
      paragraphs: [
        "De reward/risk-verhouding vergelijkt hoeveel je kunt winnen met hoeveel je kunt verliezen op één trade. Je berekent die als de afstand van je instap tot je koersdoel gedeeld door de afstand van je instap tot je stop-loss. Een verhouding van 3:1 betekent dat je potentiële beloning drie keer je potentiële risico is — je riskeert één eenheid om te proberen er drie te verdienen.",
        "Deze verhouding is belangrijker dan je winpercentage. Met een reward/risk van 3:1 kun je vaker fout dan goed zitten en er toch bovenop komen, omdat elke winst meerdere verliezen betaalt. Een trade die slechts 1:1 of slechter biedt, dwingt je om de meeste keren te winnen alleen al om quitte te spelen, en dat is een fragiele manier van handelen. Veel traders stellen een minimum in, zoals het afwijzen van elke setup onder 2:1, zodat de rekensom over veel trades in hun voordeel blijft.",
        "Het hoofdstuk Koersdoel en invalidatieprijs, eerder in de Academy, laat zien hoe je deze twee niveaus op een echte trade in deze app plaatst — het koersdoel is waar je these zich uitbetaalt en de invalidatie is de prijs die bewijst dat je het mis had. De AI-analist gebruikt hetzelfde idee: de reward/risk die uit die niveaus volgt, bepaalt of een voorstel doorgang vindt, zodat een trade met te weinig beloning voor zijn risico eruit wordt gefilterd voordat die ooit je vertrouwensdrempel bereikt. Zet eerst de niveaus, en laat de verhouding je dan vertellen of de trade de moeite waard is.",
      ],
      example:
        "Je koopt XLM voor 0,12 USDC. Je stelt een koersdoel van 0,15 in (een winst van 0,03) en een stop-loss van 0,11 (een verlies van 0,01). Reward/risk = 0,03 / 0,01 = 3:1. Zelfs als slechts 4 van elke 10 van zulke trades het koersdoel raken en 6 de stop raken, hou je over tien trades ongeveer +12 − 6 = +6 eenheden risico over — winstgevend ondanks dat je vaker verliest dan wint. Dat is de stille kracht van het aandringen op een gunstige verhouding.",
    },
    {
      id: "c29-l4",
      title: "Wat is positiegrootte en waarom is die cruciaal?",
      paragraphs: [
        "Positiegrootte is beslissen hoeveel van je portefeuille je in één trade steekt, zodat één verlies je niet ernstig kan schaden. De gangbare regel is om slechts een klein percentage — vaak 1% tot 2% — van je totale portefeuille op één positie te riskeren. Cruciaal is dat je de omvang bepaalt vanuit het risico, niet vanuit het enthousiasme: kies eerst je stop-loss, en reken dan uit hoe groot een positie mag zijn zodat die stop je bij een treffer slechts je gekozen percentage kost.",
        "Dit is wat je in het spel houdt. Een trader die 2% per trade riskeert, kan tien keer op rij verliezen en toch het grootste deel van zijn portefeuille intact hebben om te herstellen; een trader die groot inzet op overtuiging kan door één slechte keuze worden weggevaagd. Goede positiegrootte maakt van een reeks verliezen geen catastrofe maar een overleefbare dip, en daarom beschouwen professionals het als belangrijker dan het uitkiezen van winnaars.",
        "In deze app bepaalt de risicofactor Positiegrootte van de AI precies dit. Op LAAG stelt de AI kleine, behoudende stukjes van je saldo per trade voor; MIDDEN en HOOG staan geleidelijk grotere posities toe. Hij werkt samen met een harde handelslimiet en een drawdown-pauzegrens, zodat de AI nooit stilletjes je hele wallet op één idee kan inzetten. Het hoofdstuk AI-risico-instellingen: volledige controle behandelt de precieze mechaniek van alle zes de factoren — hier volstaat het te weten dat de hendel Positiegrootte je veiligheidsgordel is.",
      ],
      example:
        "Je portefeuille is 1.000 USDC en je begrenst het risico op 2% (20 USDC) per trade. Je wilt XLM kopen voor 0,12 met een stop op 0,11 — een risico van 0,01 per eenheid. Als je je risicobudget van 20 USDC deelt door het risico van 0,01 per eenheid, krijg je een positie van 2.000 XLM (240 USDC). Als de stop wordt geraakt, verlies je precies 20 USDC — 2% — en geen fortuin. Dezelfde rekensom, of je nu met de hand de omvang bepaalt op het tabblad Handmatig handelen of leunt op de LAAG-instelling van de AI-factor Positiegrootte.",
    },
    {
      id: "c29-l5",
      title: "Wanneer je niets moet doen — de kracht van stablecoins aanhouden",
      paragraphs: [
        "Cash is een positie. Ervoor kiezen om in een stablecoin zoals USDC te blijven zitten en helemaal geen trade te plaatsen, is een legitieme en vaak winnende beslissing — geen gebrek aan daadkracht. Wanneer markten grillig, richtingloos zijn of alleen setups met een slechte reward/risk bieden, is de trade met de hoogste verwachte waarde vaak géén trade. In USDC blijven zitten houdt je kapitaal droog en klaar voor een écht goede kans, in plaats van het weg te laten lekken aan marginale kansen.",
        "Het gevaar de rest van de tijd is overtrading. Elke onnodige trade betaalt kosten en spread, nodigt slippage uit en geeft emotie opnieuw de kans om je een fout in te sturen. Actie forceren uit verveling of FOMO is hoe goede saldi langzaam slinken. Niets doen kost op Stellar bijna niets, afgezien van de gemiste kans op een beweging die je oversloeg — en een gemiste winst is veel goedkoper dan een gedwongen verlies.",
        "In de praktijk betekent dit dat je je er prettig bij moet voelen om je saldo periodes lang in USDC aan te houden, de tokendetailgrafieken en de AI-voorstellen te volgen, en pas in te stappen wanneer een setup je eigen lat haalt. De AI respecteert dit ook: de drawdown-pauzegrens stopt bewust het handelen na een vastgesteld verlies en dwingt een afkoelperiode af. Geduld is een strategie, en USDC is waar je wacht.",
      ],
      example:
        "Over een vlakke, zijwaartse week brengt de AI drie voorstellen naar boven, elk met een middelmatige reward/risk van ongeveer 1,2:1 en een vertrouwen onder je drempel. Een rusteloze trader neemt alle drie, betaalt op elk kosten, en eindigt de week licht in de min. Jij doet niets, houdt je saldo in USDC en blijft vlak. Wanneer de volgende week eindelijk een zuivere 3:1-setup verschijnt, heb je het volledige saldo klaar om erin te stappen — beloond voor je geduld.",
    },
  ],
  quiz: [
    {
      id: "c29-q1",
      prompt: "Je hebt een veeleisende voltijdbaan, houdt niet van staren naar grafieken, en kunt een positie gemakkelijk door een moeilijke week heen aanhouden. Welke stijl past waarschijnlijk het best bij jou?",
      options: [
        {
          text: "Day trading, omdat elke positie binnen de dag sluiten de veiligste aanpak is.",
          explanation:
            "Day trading vraagt uren geconcentreerde schermtijd en snelle uitvoering, en de frequente fills stapelen netwerk-, pool- en spreadkosten op. Het past noch bij je agenda, noch bij je afkeer van grafiekkijken.",
        },
        {
          text: "Swing trading of HODL, omdat beide een hands-off schema verdragen en het aanhouden door kortetermijndips heen.",
          explanation:
            "Juist. Beide stijlen vragen slechts af en toe een check en belonen het temperament om drawdowns zonder paniek uit te zitten — een veel betere match voor een druk iemand die comfortabel door een moeilijke week heen aanhoudt.",
        },
        {
          text: "Welke stijl ook het hoogste theoretische rendement heeft, ongeacht je temperament.",
          explanation:
            "Verkeerde bril. Een stijl die je niet kunt volhouden leidt tot gedwongen fouten en burn-out. De beste match is de traagste stijl die nog aan je doelen voldoet, gekozen rond je tijd en tolerantie.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q2",
      prompt: "Wat beschrijft dollar-cost averaging (DCA) het best?",
      options: [
        {
          text: "Een vast bedrag kopen volgens een vast schema, ongeacht de huidige prijs.",
          explanation:
            "Juist. Net als het elke maand storten van 50 EUR in een spaarplan, koopt DCA elk interval hetzelfde bedrag — meer eenheden als het goedkoop is, minder als het duur is — waardoor timing en emotie uit de beslissing verdwijnen.",
        },
        {
          text: "Wachten op de enige laagste prijs van het jaar en dan alles in één keer kopen.",
          explanation:
            "Dat is eenmalige markttiming, het tegenovergestelde van DCA. Niemand prikt betrouwbaar de jaarbodem, en DCA bestaat juist om dat niet nodig te hebben.",
        },
        {
          text: "Een vaste fractie van je bezit verkopen telkens als de prijs stijgt.",
          explanation:
            "Dat beschrijft een uitschaal- of winstnemingsregel, geen DCA. Dollar-cost averaging gaat over gestaag, gepland kopen, niet over door de prijs uitgelokt verkopen.",
        },
        {
          text: "Je aankoopomvang verdubbelen na elke verliesweek om sneller te herstellen.",
          explanation:
            "Dat is een martingale-achtige averaging-down-inzet, die het risico gevaarlijk laat groeien. DCA houdt het bedrag bewust vast, precies zodat het nooit opzwelt.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c29-q3",
      prompt: "Je stapt in XLM voor 0,12 USDC, zet een koersdoel op 0,18 en een stop-loss op 0,10. Wat is de reward/risk-verhouding?",
      options: [
        {
          text: "1:1 — de trade is een muntworp.",
          explanation:
            "Onjuist. De beloning (0,18 − 0,12 = 0,06) en het risico (0,12 − 0,10 = 0,02) zijn niet gelijk, dus het zit ver van 1:1.",
        },
        {
          text: "3:1 — beloning van 0,06 gedeeld door risico van 0,02.",
          explanation:
            "Juist. De afstand tot het koersdoel is 0,06 en de afstand tot de stop is 0,02, dus 0,06 / 0,02 = 3:1. Je riskeert één eenheid om te proberen er drie te verdienen, en je kunt vaker fout dan goed zitten en toch winst maken.",
        },
        {
          text: "0,33:1 — je riskeert drie om er één te verdienen.",
          explanation:
            "Dat draait de formule om. Reward/risk deelt de afstand-tot-koersdoel door de afstand-tot-stop, wat 3:1 geeft; de omgekeerde 1:3 zou een slechte setup zijn die je meestal moet afwijzen.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q4",
      prompt: "Waarom wordt positiegrootte zo cruciaal geacht, en hoe helpt de risicofactor Positiegrootte van de app daarbij?",
      options: [
        {
          text: "Ze garandeert dat elke trade winstgevend is door alleen winnende instappen te kiezen.",
          explanation:
            "Geen enkele positiegrootteregel kan een winnaar garanderen. Positiegrootte bepaalt hoeveel een verlies je kost, niet of de trade wint.",
        },
        {
          text: "Ze begrenst hoeveel één enkel verlies je kan schaden; de factor Positiegrootte op LAAG stelt kleine, behoudende stukjes per trade voor.",
          explanation:
            "Juist. Slechts een klein percentage per trade riskeren laat je een reeks verliezen overleven. De AI-factor Positiegrootte (LAAG/MIDDEN/HOOG) schaalt de fractie van het saldo per trade, samen met een harde handelslimiet en een drawdown-pauzegrens.",
        },
        {
          text: "Ze laat de AI je hele wallet inzetten op zijn ene idee met het hoogste vertrouwen.",
          explanation:
            "Het tegenovergestelde van goede positiegrootte. Een harde handelslimiet en de drawdown-grens bestaan juist zodat de AI nooit de hele wallet op één keuze kan inzetten.",
        },
        {
          text: "Ze maakt een stop-loss volledig overbodig.",
          explanation:
            "Andersom — de positiegrootte wordt afgeleid van je stop-loss. Je kiest eerst de stop, en bepaalt dan de omvang zodat een treffer je slechts je gekozen kleine percentage kost.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q5",
      prompt: "Markten zijn grillig en elke beschikbare setup biedt slechts een middelmatige reward/risk onder je lat. Wat is vaak de sterkste zet?",
      options: [
        {
          text: "Toch een paar trades forceren zodat je kapitaal altijd aan het werk is.",
          explanation:
            "Dit is overtrading. Elke marginale trade betaalt kosten en spread, nodigt slippage uit en geeft emotie opnieuw de kans om te falen — een betrouwbare manier om een saldo te laten leeglopen.",
        },
        {
          text: "Niets doen en je saldo in USDC aanhouden tot er een écht goede setup verschijnt.",
          explanation:
            "Juist. Cash is een positie. In een stablecoin blijven zitten houdt je kapitaal droog en klaar, vermijdt gedwongen slechte trades en kost bijna niets afgezien van een overgeslagen beweging — veel goedkoper dan een gedwongen verlies.",
        },
        {
          text: "Overschakelen naar day trading om winst uit de kleine bewegingen te persen.",
          explanation:
            "Sneller handelen in een richtingloze markt vermenigvuldigt de kosten en fouten in plaats van ze te verminderen. Grillige omstandigheden van lage kwaliteit vragen om geduld, niet om meer activiteit.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
