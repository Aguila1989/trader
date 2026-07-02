// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// EXPERT hoofdstuk over AI in trading: hoe modellen worden getraind, overfitting,
// ethische en systemische risico's, hoe de transparante AI met mens-in-de-lus van
// Atrium verschilt van een black-box-algoritme, en wanneer je de AI uitschakelt.
// Zelfde vorm als het gold-standard content/en/chapter22.ts, met de
// per-hoofdstuk `whoFor` one-liner getypeerd via een lokale intersectie zodat de
// live Chapter-interface ongemoeid blijft tot integratie. Dit hoofdstuk bezit geen
// nieuwe woordenlijsttermen.
import type { Chapter } from "../../types";

export const chapter36: Chapter & { whoFor: string } = {
  id: "c36",
  number: 36,
  level: "EXPERT",
  whoFor: "Voor traders die een AI verstandig willen vertrouwen — en betwijfelen",
  title: "AI in trading — kansen en gevaren",
  description:
    "Hoe tradingmodellen worden getraind, waar overfitting en look-ahead bias binnensluipen, de ethische en systemische risico's van geautomatiseerd handelen, hoe de transparante AI van Atrium verschilt, en wanneer je hem uitschakelt.",
  lessons: [
    {
      id: "c36-l1",
      title: "Hoe worden AI-tradingmodellen getraind?",
      paragraphs: [
        "Een tradingmodel wordt gefit op historische data. Je kiest features (de inputs die het model leest) en een label (wat het probeert te voorspellen). Features kunnen recente rendementen zijn, orderboekdiepte opgehaald uit Horizon, handelsvolume uit trade-aggregaties, volatiliteit, of een aantal trustlines als graadmeter voor adoptie. Het label is meestal een toekomstige uitkomst: zal de middenprijs over een uur hoger staan, of wordt een doel geraakt vóór een stop. Het model leert precies die statistische afbeelding van features naar label die zijn fout op die verleden data minimaliseert.",
        "De stille aanname is dat morgen rijmt op gisteren. Dat geldt alleen zolang het marktregime stabiel is. Wanneer het regime verandert — de liquiditeit droogt op in een dun XLM/USDC-boek, een stablecoin verliest zijn peg, spreads lopen uit, of een nieuwe AMM-pool herleidt de flow — dan houden de relaties die het model uit het hoofd leerde op met uitbetalen. Dit is regimeverandering, en geen enkele hoeveelheid training op het oude regime bereidt een model daarop voor.",
        "Twee faalmodi domineren in de praktijk. Garbage-in: als de trainingsdata verkeerd zijn — foute tijdstempels, survivorship bias van gedelicteerde tokens, prijzen uit een moment van nul liquiditeit — dan leert het model getrouw de rommel. Look-ahead bias is subtieler en gevaarlijker: informatie lekt terug in de tijd. Als een feature op bar T wordt berekend met data die pas op T+1 bekend kon zijn (een slotkoers die wordt gebruikt om diezelfde slotkoers te 'voorspellen', een label dat over de toekomst is gladgestreken, een fill aangenomen tegen een prijs waartegen niemand had kunnen handelen), dan ziet de backtest er briljant uit omdat het model stiekem valsspeelt. Live bestaat die toekomstige data niet, en de edge verdampt.",
        "Je hiertegen wapenen betekent strikte temporele discipline: elke feature moet berekenbaar zijn met uitsluitend informatie die vóór het beslismoment beschikbaar was, splitsingen moeten chronologisch zijn (schud tijdreeksregels nooit door elkaar), en kosten moeten worden gemodelleerd tegen de prijs waartegen je daadwerkelijk had kunnen handelen, niet de middenprijs. Een model dat zonder die discipline is getraind meet geen vaardigheid — het meet zijn eigen vermogen om te gluren.",
      ],
      example:
        "Stel dat je elke uurbar het label 1 geeft als het rendement van het volgende uur positief is en het model een feature voert die 'volatiliteit van deze bar' heet, maar je berekent die volatiliteit per ongeluk uit de hoogste en laagste koers van de bar die je juist probeert te voorspellen. De hoogste en laagste koers zijn pas bekend zodra het uur voorbij is. Het model leert een bijna-perfecte regel, de equity-curve van de backtest schiet omhoog, en live faalt hij meteen — het volatiliteitsgetal dat het nodig heeft is op het moment dat het moet beslissen simpelweg nog niet beschikbaar. Dat is look-ahead bias die zich verstopt in een onschuldig ogende feature.",
    },
    {
      id: "c36-l2",
      title: "Wat is overfitting en waarom faalt een gebacktestte strategie soms in live trading?",
      paragraphs: [
        "Overfitting is wanneer een model de ruis in zijn trainingsdata leert in plaats van het signaal. Elke prijsreeks is deels echte structuur en deels willekeur. Een model met genoeg parameters, of een strategie die over genoeg knoppen is afgesteld, kan de willekeurige rimpelingen van één specifieke geschiedenis perfect fitten. Het produceert dan een schitterende backtest — een vloeiende equity-curve, hoge Sharpe, minuscule drawdown — die het verleden voortreffelijk beschrijft en de toekomst in het geheel niet voorspelt.",
        "Het verraderlijke teken is de kloof tussen in-sample- en out-of-sample-prestaties. In-sample (de data waarop je hebt gefit) ziet er altijd goed uit; dat is wat fitten doet. Wat telt is out-of-sample: verse data die het model nooit zag, idealiter een later tijdvenster. Als de edge out-of-sample én over een walk-forward-test overleeft — herhaaldelijk trainen op het verleden en valideren op het volgende, onaangeroerde stuk — dan is die misschien echt. Bestaat hij alleen in-sample, dan heb je ruis gecurve-fit. Pas ook op voor de valkuil van meervoudige vergelijkingen: probeer tweehonderd parametercombinaties en een paar zien er door puur toeval prachtig uit, precies zoals je genoeg munten opgooit tot er één tien keer op kop landt.",
        "Zelfs een echte edge kan sneuvelen zodra hij de werkelijkheid raakt, door kosten. Elke fill betaalt iets: de bied-laatspread, slippage wanneer je order het boek beweegt, de AMM-poolvergoeding van 0,30% op Stellar, plus de piepkleine XLM-netwerkkosten. Een backtest die tegen de middenprijs draait negeert dit allemaal. Een strategie die in een wrijvingsloze backtest per trade een paar basispunten opbrengt, kan botweg negatief worden zodra realistische spread en slippage worden afgetrokken — de edge was kleiner dan de kosten om hem te oogsten. Erger nog, kosten schalen met frequentie: een strategie met veel omzet betaalt de spread keer op keer, dus juist de modellen die in een backtest het actiefst lijken, zijn vaak het kwetsbaarst voor echte wrijving.",
        "Dit is geen abstracte waarschuwing die specifiek Atrium betreft. Zijn eigen onderzoeksharnas ontdekte dat een gemeten XLM/USDC-edge alleen significant was bij zeer lage kosten en volledig verdween zodra realistische vergoedingen in rekening werden gebracht — een spel van spread-capture, geen duurzaam voordeel. De eerlijke werkwijze is daarom om eerst out-of-sample-overleving te eisen, dan opnieuw te draaien met pessimistische kostenaannames, en alleen een edge te geloven die beide lat haalt. Niets hiervan is een belofte van winst of beleggingsadvies; het is een discipline om jezelf niet voor de gek te houden.",
      ],
      example:
        "Een klassiek geval: een strategie wordt geoptimaliseerd over een raster van voortschrijdend-gemiddelde-lengtes op één jaar XLM/USDC-data en de 9/21-crossover toont een verbluffend rendement van 4x met vrijwel geen drawdown. Rol hem vooruit naar de volgende zes maanden die hij nooit zag en hij bloedt gestaag leeg. Het paar 9/21 ving geen echt marktritme — het viel toevallig samen met een handvol gelukkige uitslagen in dat specifieke jaar. Voeg de spread en de AMM-vergoeding van 30bps toe die hij bij elke omzet echt zou hebben betaald en zelfs het in-sample-resultaat wordt negatief. De backtest mat geluk plus nul kosten, geen herhaalbare edge.",
    },
    {
      id: "c36-l3",
      title: "Wat zijn de ethische risico's van AI-trading?",
      paragraphs: [
        "Automatisering schaalt de bedoeling — inclusief kwade bedoeling — ver voorbij wat een mens met de hand zou kunnen. Manipulatietactieken die in gereguleerde markten illegaal zijn, worden triviaal snel wanneer een bot ze uitvoert: spoofing (grote orders plaatsen die je nooit van plan bent te vullen, om vraag voor te wenden, en ze dan annuleren), layering, of wash trading (met jezelf handelen om het schijnbare volume op te blazen en echte kopers te lokken). Een AI die ontdekt dat zo'n tactiek winstgevend is in een backtest, zal die graag duizenden keren herhalen tenzij een mens het verbiedt. Dit doen is niet alleen onethisch; in veel rechtsgebieden is het marktmisbruik, en niets hiervan is juridisch advies — het punt is dat het automatiseren van een opzet de legaliteit ervan niet witwast.",
        "Snelheid brengt zijn eigen gevaar met zich mee. Wanneer veel geautomatiseerde deelnemers binnen milliseconden op hetzelfde signaal reageren, kan een kleine schok uitmonden in een flash crash — een gewelddadige, zelfversterkende val en terugkaats, gedreven door algoritmen die elkaars stops raken en tegelijk liquiditeit terugtrekken. Geen enkele speler beoogt de crash; die ontstaat uit de interactie. De flash crash op de aandelenmarkt van 2010 is het klassieke voorbeeld, maar dezelfde dynamiek kan opduiken op elke handelsplaats met geautomatiseerde flow, ook op dunne on-chain-orderboeken.",
        "Het diepste risico is systemisch en komt voort uit gelijkvormigheid. Als duizenden modellen worden getraind op vergelijkbare data met vergelijkbare doelstellingen, convergeren ze naar vergelijkbare posities en gedragen ze zich hetzelfde. Die correlatie is onzichtbaar in kalme markten en dodelijk in stress: iedereen zit long in dezelfde overvolle trade, ieders risicomodel zegt 'afbouwen' bij dezelfde drempel, en iedereen verkoopt tegelijk in hetzelfde verdwijnende bod. Diversiteit van strategie is een collectief goed voor marktstabiliteit; monocultuur is fragiel. Als individuele trader kun je het systeem niet repareren, maar je kunt wel erkennen dat 'de AI zegt kopen' veel minder geruststellend is als elke andere AI het ook zegt — en je kunt je posities zo klein houden dat een overvolle afwikkeling je niet ruïneert.",
      ],
      example:
        "Stel je een dun XLM/USDC-boek voor waar vijftig bots één regel delen: 'als de prijs binnen een minuut 3% daalt, bouw de positie af.' Een bescheiden verkoop duwt de prijs 3% omlaag. Alle vijftig vuren tegelijk, elke verkoop drukt de prijs lager en trekt voor de volgende bot dezelfde regel weer in werking. Binnen seconden gapt de prijs ver onder de reële waarde op vrijwel geen echt nieuws — een flash crash die puur uit gecorreleerde automatisering ontstaat. De bots die pauzeerden, of wier regel net iets anders was, zijn degene die overleefden om de dip te kopen.",
    },
    {
      id: "c36-l4",
      title: "Hoe verschilt de AI in deze app van een algemeen tradingalgoritme?",
      paragraphs: [
        "Een algemeen tradingalgoritme is doorgaans een black box die autonoom handelt: signaal erin, order eruit, geen uitleg, en vaak geen mens in de lus. Atrium is gebouwd op het tegenovergestelde principe — transparantie en controle met mens-in-de-lus. De AI is een analist, geen automatische piloot. Hij stelt voor; jij beslist.",
        "Concreet arriveert elk idee als een voorstel met een vertrouwensscore van 0 tot 100, en de backend voert een voorstel alleen automatisch uit op of boven de drempel die jij instelt. Onder jouw drempel gebeurt er niets zonder jou. Deze lus van voorstellen-en-dan-goedkeuren is omhuld met harde limieten die de AI niet kan overrulen: een handelsplafond en een drawdown-pauzepoort die de activiteit stillegt zodra de verliezen een ingesteld niveau doorbreken. De AI kan willen handelen; hij kan de vangrails die jij hebt geconfigureerd niet overschrijden.",
        "Je vormt zijn gedrag ook via zes onafhankelijke risicofactoren, elk ingesteld op LOW, MED of HIGH: Positiegrootte, Stop-Loss-afstand, Drawdown-tolerantie, Handelsfrequentie, Volatiliteitstolerantie van assets, en Slippage-tolerantie. Deze zijn niet cosmetisch — ze weven zich in de effectieve limieten die de policy-engine afdwingt en in de prompt waarmee de analist redeneert, zodat een behoudend profiel echt kleinere, zeldzamere trades met strakkere stops oplevert. Alles wat de AI beslist wordt gelogd: het subtabblad AI-log in het tabblad Logs registreert elk voorstel met filters, CSV-export en paginering, zodat je kunt controleren waaróm hij handelde in plaats van te vertrouwen op een zwijgzame black box.",
        "Dit hoofdstuk blijft bewust op het niveau van principe. De mechaniek leeft elders in de Academy: het hoofdstuk 'AI Trading Deep Dive' loopt van begin tot eind door hoe de analist een voorstel vormt en scoort, en het hoofdstuk 'AI-risico-instellingen: volledige controle' behandelt elk van de zes factoren en precies hoe ze het gedrag van de AI begrenzen. Wil je het hoe, ga daarheen; hier hebben we alleen het waarom nodig — een transparant, begrensd, door mensen goedgekeurd ontwerp is wat je in staat stelt de AI bewust zowel te vertrouwen als te betwijfelen.",
      ],
      example:
        "Stel dat de analist voorstelt XLM te kopen met een vertrouwen van 62 terwijl jouw drempel voor automatische uitvoering 75 is. In een black-box-algoritme zou die trade simpelweg vuren. In Atrium wordt er niets uitgevoerd — het voorstel wacht op jouw goedkeuring, en zelfs als je het goedkeurt gelden de drawdown-pauzepoort en het handelsplafond nog steeds. Het voorstel, zijn score en jouw beslissing belanden allemaal in de AI-log, zodat je er een week later op kunt filteren, de regel kunt exporteren en precies kunt zien waarom de trade werd voorgesteld en wat jij besloot te doen.",
    },
    {
      id: "c36-l5",
      title: "Wanneer moet je de AI uitschakelen?",
      paragraphs: [
        "De enkele regel achter alle specifieke signalen is deze: schakel de AI uit wanneer de omstandigheden buiten het bereik vallen waarop het model is getraind. Een model is alleen betrouwbaar binnen de verdeling van de data waarvan het heeft geleerd. Duw het in gebied dat het nooit heeft gezien en zijn vertrouwensscore wordt betekenisloos — het kan uiterst zelfverzekerd én volkomen fout zijn, omdat het extrapoleert in plaats van herkent.",
        "Extreme volatiliteit is het eerste alarmsignaal. Wanneer de prijs van een token ver buiten zijn historische bereik uitslaat, beschrijven de statistische relaties die het model leerde niet langer wat er gebeurt. Illiquiditeit is het tweede: op een dun boek of een ondiepe AMM-pool kan de slippage bij uitvoering elke edge overschaduwen, en de door het model aangenomen fill-prijzen worden fictie. Nieuwsschokken zijn het derde — een depeg, een uitgever die verdwijnt, een exchange die stilligt, een regelgevende krantenkop. Dit zijn precies de gebeurtenissen die ontbreken in gladde historische trainingsdata, en ze breken correlaties ogenblikkelijk. Wanneer er iets werkelijk nieuws op de tape verschijnt, wint het oordeel van een mens over de context het van de patroonherkenning van een model.",
        "Er zit ook een gedragsmatig vroegwaarschuwingssysteem in de app zelf. Als je merkt dat er een reeks voorstellen wordt afgewezen door de policy-engine, of herhaaldelijk niet wordt uitgevoerd, of dat de analist voorstellen met lage vertrouwensscores uitspuwt zoals hij vroeger nooit deed, behandel dat dan als het model dat je vertelt dat het in de war is. De subtabbladen AI-log en Handelsgeschiedenis maken dit patroon zichtbaar. De praktische zet is overschakelen naar handmatig: zak onder de drempel voor automatische uitvoering of schakel automatische uitvoering helemaal uit, verklein je posities, en gebruik het tabblad Handmatig handelen met een verstandige slippage-tolerantie totdat de omstandigheden terugkeren naar iets wat het model daadwerkelijk eerder heeft gezien. De AI uitschakelen is geen falen van het gereedschap — het is het verstandig gebruiken, en het is dezelfde discipline als het verruimen van je eigen stops wanneer je onzeker bent.",
      ],
      example:
        "Een stablecoin die je aanhoudt begint 's nachts van zijn peg af te wankelen en de in USDC genoteerde prijzen slaan op hol; het orderboek dunt uit doordat market makers zich terugtrekken. Je AI blijft voorstellen vuren, meerdere worden afgewezen door de drawdown-poort, en de voorstellen die er wel doorheen komen hebben een laag vertrouwen. Die combinatie — een nieuwsgedreven regimebreuk, instortende liquiditeit, en een cluster van afgewezen of falende voorstellen in de AI-log — is het schoolvoorbeeld van het moment om automatische uitvoering uit te schakelen, je posities te verkleinen, en met de hand te handelen totdat de depeg is opgelost en de markt weer leesbaar is.",
    },
  ],
  quiz: [
    {
      id: "c36-q1",
      prompt: "Een feature op tijdstip T in je model wordt berekend met de slotkoers van de bar op tijdstip T, die pas bekend is zodra die bar is afgelopen. De backtest ziet er spectaculair uit maar live storten de resultaten in. Wat is er gebeurd?",
      options: [
        {
          text: "Look-ahead bias: de feature gebruikte informatie die op het beslismoment nog niet beschikbaar was, dus het model gluurde in feite naar de toekomst.",
          explanation:
            "Juist. Data gebruiken die pas op of na T bekend is om de beslissing op T te nemen, laat het model in de backtest 'valsspelen'. Live bestaat die toekomstige data nog niet, dus de schijnbare edge verdwijnt zodra hij de werkelijkheid raakt.",
        },
        {
          text: "Regimeverandering: de markt gedroeg zich in de live-periode eenvoudigweg anders.",
          explanation:
            "Regimeverandering is reëel, maar dat is niet wat hier wordt beschreven. Het probleem hier is structureel — een feature die naar toekomstige data gluurt — en het zou de backtest zelfs over dezelfde periode opblazen. Het live falen is onmiddellijk, geen geleidelijke regimedrift.",
        },
        {
          text: "Overfitting: het model prentte zich de ruis in over te veel parameters.",
          explanation:
            "Overfitting is een aparte faalmodus. Hier zit het probleem in temporele lekkage in één enkele feature, niet in een te flexibel model dat willekeur fit. Zelfs een eenvoudig model zou er met dit lek geweldig uitzien en live falen.",
        },
        {
          text: "Garbage-in: de trainingsprijzen waren verkeerd of beschadigd.",
          explanation:
            "De prijzen kunnen volmaakt schoon zijn. Het gebrek is dat een correcte prijs wordt gebruikt op een moment waarop hij nog niet bekend kon zijn — een timinglek, geen slechte data.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c36-q2",
      prompt: "Je hebt een strategie met een prachtige equity-curve in de backtest. Welke enkele controle onderscheidt een echte edge het best van curve-fitting?",
      options: [
        {
          text: "Bevestig dat de backtest de middenprijs gebruikte zodat de resultaten vrij zijn van ruis.",
          explanation:
            "Andersom. De middenprijs gebruiken verbergt echte kosten zoals spread, slippage en de AMM-vergoeding van 0,30%, wat de resultaten flatteert. Je wilt kosten gemodelleerd tegen de prijs waartegen je daadwerkelijk kon handelen, niet weggestript.",
        },
        {
          text: "Controleer dat de in-sample-prestatie zo hoog mogelijk is.",
          explanation:
            "De in-sample-prestatie is altijd hoog — dat is wat fitten doet. Een geweldig in-sample-resultaat zegt je niets over de vraag of de edge echt is; het is de minst informatieve controle.",
        },
        {
          text: "Test hem out-of-sample op latere data die het model nooit zag, idealiter met een walk-forward-procedure.",
          explanation:
            "Juist. Een edge die overleeft op verse, chronologisch latere data waarop hij nooit is getraind — herhaaldelijk, via walk-forward — is veel waarschijnlijker echt. Bestaat hij alleen in-sample, dan heb je ruis gefit.",
        },
        {
          text: "Probeer nog veel meer parametercombinaties en houd de mooist ogende.",
          explanation:
            "Dit maakt overfitting erger. Honderden combinaties testen garandeert dat er een paar door puur toeval prachtig lijken — de valkuil van meervoudige vergelijkingen — niet dat er ook maar één een echte edge is.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c36-q3",
      prompt: "Vijftig bots op een dun XLM/USDC-boek delen de regel 'bouw de positie af als de prijs binnen een minuut 3% daalt.' Een bescheiden verkoop kantelt de prijs 3% omlaag en de prijs gapt binnen seconden ver onder de reële waarde. Wat illustreert dit?",
      options: [
        {
          text: "Eén manipulator die het orderboek spooft.",
          explanation:
            "Niemand plaatst hier valse orders. De cascade ontstaat doordat veel eerlijke bots tegelijk op dezelfde echte trigger reageren — een emergent effect, geen manipulatie door één speler.",
        },
        {
          text: "Een flash crash gedreven door gecorreleerde automatisering en systemische gelijkvormigheid.",
          explanation:
            "Juist. Wanneer veel modellen zich hetzelfde gedragen, brengt één kleine schok ze allemaal tegelijk in werking, elke verkoop drijft de volgende, wat liquiditeit wegtrekt en de prijs laat gappen. Niemand beoogt de crash; die ontstaat uit gecorreleerd gedrag op een dun boek.",
        },
        {
          text: "Verliesaversie die mensen doet panikeren en op de bodem verkopen.",
          explanation:
            "Dit gaat over geautomatiseerde regels die in milliseconden vuren, niet over een menselijke emotionele reactie. Verliesaversie is een psychologieconcept; het mechanisme hier is gecorreleerde algoritmische uitvoering.",
        },
        {
          text: "Look-ahead bias in de trainingsdata van de bots.",
          explanation:
            "Look-ahead bias is een backtest-fout over toekomstige data die in features lekt. Het heeft niets te maken met live bots die synchroon dezelfde stopregel raken en de prijs laten cascaderen.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q4",
      prompt: "De analist stelt voor XLM te kopen met een vertrouwensscore van 62, maar jouw drempel voor automatische uitvoering is 75. Wat gebeurt er in Atrium?",
      options: [
        {
          text: "De trade vuurt automatisch, omdat de AI een voorstel genereerde.",
          explanation:
            "Zo gedraagt een black-box-automatische-piloot zich, niet Atrium. Een voorstel onder jouw drempel wordt niet automatisch uitgevoerd — het ontwerp met mens-in-de-lus betekent dat er niets gebeurt zonder jouw goedkeuring.",
        },
        {
          text: "Er wordt niets automatisch uitgevoerd; het voorstel wacht op jou, en zelfs bij goedkeuring gelden de drawdown-poort en het handelsplafond nog steeds.",
          explanation:
            "Juist. De backend voert alleen automatisch uit op of boven jouw drempel. Eronder is het voorstel slechts advies dat je kunt goedkeuren of negeren, en de harde plafonds en de drawdown-pauzepoort blijven hoe dan ook van kracht.",
        },
        {
          text: "De AI verhoogt zijn eigen vertrouwen naar 75 zodat de trade kan doorgaan.",
          explanation:
            "De AI kan zijn score niet herschrijven om jouw drempel te halen. De drempel is een vangrail die jij beheert; het hele punt van het ontwerp is dat de AI de limieten die jij instelt niet kan overrulen.",
        },
        {
          text: "De zes risicofactoren worden genegeerd omdat het vertrouwen onder de drempel ligt.",
          explanation:
            "De risicofactoren worden niet omzeild — ze vormen voortdurend de effectieve limieten en het redeneren van de analist. Een score onder de drempel betekent enkel geen automatische uitvoering, niet dat de vangrails worden uitgeschakeld.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q5",
      prompt: "Een stablecoin die je verhandelt begint 's nachts te depeggen, het orderboek dunt uit, en je AI-log toont een cluster van afgewezen en laag-vertrouwde voorstellen. Wat is de verstandige zet?",
      options: [
        {
          text: "Verhoog je drempel voor automatische uitvoering een beetje en laat de AI er doorheen blijven handelen.",
          explanation:
            "Een aanpassing van de drempel lost het kernprobleem niet op: de omstandigheden liggen buiten het getrainde bereik van het model. De vertrouwensscores zijn in dit regime onbetrouwbaar, dus erop leunen — zelfs bij een hogere lat — is misplaatst vertrouwen.",
        },
        {
          text: "Vertrouw het voorstel met het hoogste vertrouwen, want het vertrouwen is het hoogst precies wanneer het model het zekerst is.",
          explanation:
            "Een vertrouwensscore is alleen betekenisvol binnen de dataverdeling waarvan het model heeft geleerd. Tijdens een depeg extrapoleert het model in ongezien gebied, waar het zelfverzekerd fout kan zitten. Hoog vertrouwen is hier geen geruststelling.",
        },
        {
          text: "Schakel automatische uitvoering uit, verklein je posities, en handel handmatig totdat de depeg is opgelost en de markt weer leesbaar is.",
          explanation:
            "Juist. Een nieuwsgedreven regimebreuk plus instortende liquiditeit plus een reeks afgewezen of falende voorstellen is het schoolvoorbeeld van het signaal dat de omstandigheden buiten het bereik van het model liggen. Overschakelen naar handmatig en je posities verkleinen is het gereedschap verstandig gebruiken, niet het opgeven.",
        },
        {
          text: "Doe niets anders — de drawdown-poort handelt alles vanzelf af.",
          explanation:
            "De drawdown-poort is een vangnet dat verliezen beperkt, geen vervanging voor oordeel. Hij vuurt nadat schade zich heeft opgestapeld; de regimebreuk vroeg herkennen en handmatig gaan voorkomt de verliezen die de poort anders zou moeten opvangen.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
