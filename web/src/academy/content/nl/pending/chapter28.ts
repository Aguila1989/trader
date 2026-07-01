// PENDING — do not activate until green light.
// Technical Analysis — Chart Patterns. An ADVANCED chapter on reading structure
// straight off the chart: support and resistance, trends, classic chart
// patterns, Fibonacci retracements, and applying them on this app's price
// graph. Authored to the exact same shape as content/en/chapter01.ts, with the
// per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms already taught in earlier chapters.
import type { Chapter } from "../../../types";

export const chapter28: Chapter & { whoFor: string } = {
  id: "c28",
  number: 28,
  level: "ADVANCED",
  whoFor: "Voor traders die structuur rechtstreeks van de grafiek willen aflezen",
  title: "Technische analyse — Grafiekpatronen",
  description:
    "Steun en weerstand, trends, klassieke grafiekpatronen, Fibonacci-retracements, en hoe je ze toepast op de prijsgrafiek van deze app.",
  lessons: [
    {
      id: "c28-l1",
      title: "Wat zijn steun en weerstand?",
      paragraphs: [
        "Steun en weerstand zijn prijsniveaus waar de markt zich telkens weer heeft bedacht. Denk aan een vloer en een plafond. Steun is de vloer: een prijs waar de markt steeds naartoe zakt maar moeilijk onder raakt, omdat er daar genoeg kopers instappen. Weerstand is het plafond: een prijs waar de markt steeds naartoe stijgt maar moeilijk boven raakt, omdat er genoeg verkopers opduiken. Beide zijn geheugen in actie, en markeren de niveaus waarop eerdere massa's besloten dat een prijs goedkoop of duur was.",
        "Deze niveaus ontstaan omdat traders ze onthouden. Als XLM/USDC drie keer is teruggekaatst op 0,11, dan letten kopers op een vierde kaats en plaatsen verkopers hun orders er net boven, waardoor het niveau zichzelf versterkt. Op de Stellar Decentralized Exchange is dat letterlijk zo: het on-chain orderboek laat rustende biedingen zien die zich rond steun samentroepen en laatprijzen rond weerstand, en de orderboekdiepte van de app is een van de manieren waarop ze de liquiditeit van een token beoordeelt.",
        "Niveaus houden niet eeuwig stand. Wanneer de prijs beslist door een vloer of plafond heen sluit op sterk volume, breekt dat niveau en wisselt het vaak van rol. Gebroken weerstand wordt regelmatig nieuwe steun, en gebroken steun wordt nieuwe weerstand, omdat de massa haar verwachtingen opnieuw op het nieuwe niveau verankert. Een zwakke prik erdoorheen die snel weer omkeert is eerder een valse doorbraak dan een echte, dus wachten op bevestiging telt.",
      ],
      example:
        "Op de detailpagina van het token XLM/USDC stokt de prijs een week lang bij drie afzonderlijke opwaartse pogingen rond 0,12 — dat is weerstand, een plafond. Bij de vierde poging sluit een kaars netjes boven 0,12, met een sprong in de volumebalken. In de twee dagen erna zakt de prijs terug naar 0,12 en houdt daar stand. Het oude plafond is omgeklapt tot vloer: weerstand werd steun, en het niveau dat je in de gaten hield telt nog steeds, alleen met omgekeerde rol.",
    },
    {
      id: "c28-l2",
      title: "Wat is een trend en hoe herken je die?",
      paragraphs: [
        "Een trend is de algehele richting waarin de prijs drijft, los van de kleine zigzags onderweg. De zuivere manier om een trend af te lezen is te kijken naar de swingpunten — de lokale toppen en dalen. Een opwaartse trend maakt hogere toppen en hogere bodems: elke rally duwt net voorbij de vorige top, en elke terugval stopt boven de vorige dip. Een neerwaartse trend is het spiegelbeeld: lagere toppen en lagere bodems, waarbij elke kaats sneller faalt en elke daling dieper gaat.",
        "Wanneer geen van beide patronen opgaat — toppen en bodems landen ongeveer op dezelfde plek — beweegt de markt zijwaarts in een range, kaatsend tussen horizontale steun en weerstand in plaats van te trenden. Trends leven ook op verschillende tijdschalen tegelijk: een token kan in een opwaartse trend van meerdere maanden zitten en daarbinnen toch een neerwaartse trend van twee dagen laten zien. Daarom verandert de tijdshorizon die je kiest het antwoord, en daarom is je trade meebewegen met de grotere trend meestal beter dan ertegen vechten.",
        "Een trend is pas intact zolang zijn structuur niet breekt. Een opwaartse trend wordt in twijfel getrokken op het moment dat de prijs een lagere bodem maakt en een eerder swingdal doorbreekt; een neerwaartse trend wordt in twijfel getrokken wanneer de prijs een hogere top maakt. Die structuurbreuk is jouw objectieve signaal dat de richting mogelijk verandert, in plaats van een onderbuikgevoel dat het ver genoeg is gelopen.",
      ],
      example:
        "Terwijl je XLM/USDC in de weekweergave leest, trek je de swings na: 0,10, terug naar 0,09, omhoog naar 0,115, terug naar 0,10, omhoog naar 0,13. Elke top is hoger dan de vorige (0,115, daarna 0,13) en elke bodem is ook hoger (0,09, daarna 0,10) — schoolvoorbeeld van hogere toppen en hogere bodems, dus de trend is opwaarts. Als de volgende terugval in plaats daarvan onder 0,10 zou breken tot een lagere bodem, dan zou de opwaartse trendstructuur in twijfel staan en zou je je aannames aanscherpen.",
    },
    {
      id: "c28-l3",
      title: "Veelvoorkomende grafiekpatronen",
      paragraphs: [
        "Grafiekpatronen zijn terugkerende vormen die verklappen wat een massa op het punt staat te doen. Een kop-schouderpatroon is een toppatroon: drie toppen waarbij de middelste (de kop) het hoogst is en de twee buitenste (de schouders) lager en ongeveer even hoog. Een lijn getrokken onder de twee dips ertussen is de halslijn. Wanneer de prijs onder die halslijn sluit, is dat een signaal dat de opwaartse trend waarschijnlijk is uitgeput en dat een daling kan volgen. Draai de hele vorm ondersteboven — een bodem, een lagere bodem, dan een hogere bodem — en je hebt een omgekeerd kop-schouderpatroon, een bodempatroon dat hint op een ommekeer naar boven.",
        "Een dubbele top ziet eruit als de letter M: de prijs stijgt naar een top, valt terug, stijgt naar bijna precies dezelfde top, en faalt opnieuw. Dat tweemaal afgewezen plafond suggereert dat de kopers uitgeput zijn, en een daling onder de middelste dip bevestigt dat. Een dubbele bodem is het spiegelbeeld, een W-vorm: twee mislukte pogingen om lager te duwen, wat hint dat de verkopers uitgeput zijn en er een stijging kan aanbreken. Beide patronen zijn eigenlijk gewoon steun of weerstand die tweemaal standhoudt, getekend als een memorabele vorm.",
        "Een vlag is een korte pauze binnen een sterke beweging. Na een scherpe ren drijft de prijs zijwaarts of licht tegen de beweging in, in een kleine schuine rechthoek — de vlag — die hangt aan de steile beginbeweging die de vlaggenmast vormt. Doorgaans lost dit zich op in de richting van de oorspronkelijke beweging, alsof de markt even op adem kwam voordat ze verderging. Geen van deze vormen is een garantie; het zijn kansen die groter worden wanneer het volume en de bredere trend meebewegen, en ze falen vaak genoeg om een stop loss onmisbaar te maken.",
      ],
      example:
        "In de dagweergave van een token zie je drie toppen rond 0,14, 0,16 en 0,14 — een duidelijk kop-schouderpatroon, met de halslijn getrokken over de twee dips op ongeveer 0,125. De prijs sluit vervolgens onder 0,125 terwijl de volumebalken opzwellen. Het patroon is getriggerd: de eerdere opwaartse trend geeft een uitputtingssignaal af, en een trader die het tabblad Handmatig handelen van de app gebruikt zou een stop loss net boven de rechterschouder kunnen zetten om het risico te begrenzen mocht de doorbraak vals blijken.",
    },
    {
      id: "c28-l4",
      title: "Wat zijn Fibonacci-retracements en hoe gebruik je ze?",
      paragraphs: [
        "Na een sterke beweging loopt de prijs zelden in een rechte lijn — hij trekt een stuk terug voordat hij, soms, hervat. Fibonacci-retracements zijn een set horizontale niveaus die veel traders gebruiken om in te schatten hoe diep die terugval kan gaan. Je verankert het gereedschap van het begin van een beweging tot het einde, en het tekent lijnen op vaste percentages van dat bereik. De niveaus waar traders het meest op letten zijn 38,2%, 50% en 61,8% — een retracement van 38,2% is een ondiepe dip, 61,8% is een diepe die het grootste deel van de beweging teruggeeft.",
        "Het idee is dat deze verhoudingen fungeren als mogelijke steun in een opwaartse trend (of weerstand in een neerwaartse trend), zones waar een terugval kan stokken en de trend kan hervatten. Het 50%-niveau is niet echt een Fibonacci-getal, maar wordt volgens conventie meegenomen omdat prijzen zo vaak ongeveer de helft van een beweging teruggeven. Goed gebruikt zijn deze niveaus kandidaten om in de gaten te houden, geen bevelen: een plek om naar een kaats te zoeken, idealiter waar een Fibonacci-niveau samenvalt met een steun- of weerstandsniveau dat je al onafhankelijk had vastgesteld.",
        "Pas op dat je er niet te veel op leunt. Fibonacci-niveaus zijn deels zelfvervullend — ze werken deels omdat genoeg traders naar dezelfde lijnen kijken — en het is makkelijk om ze uit selectief gekozen swingpunten te tekenen tot er eentje lijkt te passen. Behandel een niveau dat samenvalt met eerdere structuur of een rond getal als betekenisvoller, bevestig altijd met prijsactie in plaats van blind bij een lijn te kopen, en bescherm het idee met een stop loss voor het geval de terugval een volledige omkering wordt.",
      ],
      example:
        "XLM/USDC loopt van 0,10 op naar 0,15, een beweging van 0,05. Als je het Fibonacci-gereedschap verankert van 0,10 tot 0,15, komt het 38,2%-niveau rond 0,131, het 50%-niveau rond 0,125 en het 61,8%-niveau rond 0,119. De prijs trekt terug en stabiliseert precies rond 0,125 — het 50%-niveau — dat toevallig ook een oude weerstandsrichel is van vorige maand. Twee onafhankelijke signalen die op dezelfde prijs wijzen maken 0,125 een geloofwaardiger plek om op een hervatting van de opwaartse trend te letten dan een losse Fibonacci-lijn zou zijn.",
    },
    {
      id: "c28-l5",
      title: "Hoe gebruik je de prijsgrafiek in deze app voor technische analyse",
      paragraphs: [
        "Op de detailpagina van een token komt dit allemaal samen. De prijsgrafiek heeft tabbladen voor uur, dag, week en jaar, en elk tabblad is een andere lens op hetzelfde asset. Het hoofdstuk De markt lezen behandelt al hoe de grafiek zelf en de kaarsen werken, dus deze les gaat ervan uit dat je die kunt lezen en richt zich alleen op het toepassen van steun en weerstand, trends en patronen over die vier tabbladen heen.",
        "Werk van boven naar beneden. Begin op het jaartabblad om de dominante trend te zien en de grote steun- en weerstandsniveaus die op de lange termijn hebben standgehouden — de grote vloeren en plafonds die respect verdienen. Zak naar het weektabblad om de swingtoppen en -bodems te plaatsen die de huidige trend bepalen, en daarna naar het dagtabblad om het patroon te vinden dat je zou kunnen verhandelen, zoals een dubbele bodem of een vlag. Gebruik ten slotte het uurtabblad om een instap nabij een niveau te timen, en let daarbij op een doorbraak of een kaats in plaats van te gokken. Lees de volumebalken ernaast: een doorbraak van steun of weerstand op stijgend volume is veel overtuigender dan een op dun volume.",
        "Zodra de grafiek je een niveau vertelt, zet je dat om in een plan met de eigen tools van de app. Een steunniveau dat je vertrouwt wordt een stop-lossprijs op het tabblad Handmatig handelen; een weerstandsniveau wordt een doelprijs; en de afstand tussen je instap en je invalidatieprijs is precies de reward-to-risk die de app controleert voordat ze een trade doorlaat. Dit is educatie, geen financieel advies — patronen beschrijven kansen, nooit zekerheden, dus elke aflezing heeft nog steeds een vastgelegde uitstap nodig.",
      ],
      example:
        "Je wilt XLM/USDC verhandelen. Op het jaartabblad is de trend duidelijk opwaarts, met langetermijnsteun op 0,09. Het weektabblad toont hogere toppen en hogere bodems die nog steeds intact zijn. Het dagtabblad tekent een vlag die pauzeert na een rally, en het uurtabblad toont dat de prijs op stijgend volume terugkaatst op de onderrand van de vlag bij 0,118. Je koopt rond 0,118, zet de stop loss net eronder op 0,115 (invalidatie), en zet een doel op de eerdere top van 0,14 — een aflezing die tabblad voor tabblad is opgebouwd en daarna is aangesloten op de stop-loss- en doeltools van de app.",
    },
  ],
  quiz: [
    {
      id: "c28-q1",
      prompt: "De prijs stijgt op XLM/USDC herhaaldelijk naar 0,12 maar sluit er telkens niet bovenuit. Wat fungeert 0,12 als, en wat gebeurt er vaak als de prijs er uiteindelijk beslist boven sluit?",
      options: [
        {
          text: "Het is steun (een vloer); een sluiting erboven betekent dat de vloer is ingestort.",
          explanation:
            "De rollen zijn omgedraaid. Een niveau waar de prijs telkens niet bovenuit weet te stijgen is een plafond — weerstand — geen vloer. Steun is het niveau waar de prijs steeds naartoe zakt maar boven standhoudt.",
        },
        {
          text: "Het is weerstand (een plafond); eenmaal gebroken klapt het vaak om tot nieuwe steun.",
          explanation:
            "Juist. Een herhaaldelijk afgewezen niveau boven de prijs is weerstand. Wanneer de prijs er beslist doorheen sluit, verankert de massa zich opnieuw en fungeert het oude plafond bij de volgende terugval vaak als nieuwe vloer.",
        },
        {
          text: "Het is weerstand, en eenmaal gebroken verdwijnt het volledig en doet het er nooit meer toe.",
          explanation:
            "Half goed op het etiket, fout op de nasleep. Gebroken weerstand verdwijnt zelden zomaar; ze wisselt gewoonlijk van rol en wordt steun, dus het niveau blijft ertoe doen.",
        },
        {
          text: "Het is een Fibonacci-niveau, dus er is geen bevestiging of volume nodig om de doorbraak te verhandelen.",
          explanation:
            "Nee. Dit is een gewoon horizontaal weerstandsniveau, geen Fibonacci-retracement, en elke doorbraak blind verhandelen zonder volume of bevestiging vraagt erom in een valse doorbraak te belanden.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q2",
      prompt: "Je trekt de swingpunten na op het weektabblad en vindt: 0,10, 0,09, 0,115, 0,10, 0,13. Hoe zou je deze trend classificeren?",
      options: [
        {
          text: "Een neerwaartse trend, omdat de prijs bij 0,10 begon en er terugvallen waren.",
          explanation:
            "Terugvallen alleen maken nog geen neerwaartse trend. Een neerwaartse trend vereist lagere toppen en lagere bodems; hier stijgen zowel de toppen (0,115 dan 0,13) als de bodems (0,09 dan 0,10).",
        },
        {
          text: "Een zijwaartse range, omdat de prijs steeds op en neer kaatst.",
          explanation:
            "Een range betekent dat toppen en bodems ongeveer op hetzelfde niveau landen. Hier is elke top en elke bodem geleidelijk hoger, dus het is een trend, geen range.",
        },
        {
          text: "Een opwaartse trend, omdat de swings hogere toppen (0,115 dan 0,13) en hogere bodems (0,09 dan 0,10) tonen.",
          explanation:
            "Juist. De bepalende structuur van een opwaartse trend is hogere toppen en hogere bodems, en beide zijn hier aanwezig, dus de trend is opwaarts totdat een lagere bodem die structuur breekt.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c28-q3",
      prompt: "In de dagweergave zie je drie toppen — een lagere, een hogere middelste, dan weer een lagere — met een lijn getrokken onder de twee dips ertussen. De prijs sluit vervolgens onder die lijn op stijgend volume. Welk patroon is dit en wat suggereert het?",
      options: [
        {
          text: "Een kop-schouderpatroon als toppatroon; een sluiting onder de halslijn signaleert dat de opwaartse trend mogelijk uitgeput raakt en dat een daling kan volgen.",
          explanation:
            "Juist. Drie toppen met een hogere kop in het midden en een halslijn onder de dips is een kop-schouderpatroon. Onder de halslijn sluiten, zeker op stijgend volume, is de trigger die waarschuwt voor een mogelijke ommekeer naar beneden.",
        },
        {
          text: "Een dubbele bodem (W-vorm) die signaleert dat de verkopers uitgeput zijn en een stijging waarschijnlijk is.",
          explanation:
            "Verkeerde vorm. Een dubbele bodem is een W van twee mislukte bodems, een bodempatroon. Drie toppen met de middelste het hoogst is een top, en hier brak de prijs naar beneden, niet naar boven.",
        },
        {
          text: "Een bull-vlag, wat betekent dat de eerdere beweging na een korte pauze simpelweg omhoog doorgaat.",
          explanation:
            "Een vlag is een kleine zijwaartse pauze die aan een steile mast hangt, geen drie afzonderlijke toppen met een halslijn. En een doorbraak onder de halslijn wijst naar beneden, het tegenovergestelde van een vlag die omhoog doorgaat.",
        },
        {
          text: "Een omgekeerd kop-schouderpatroon, een bodempatroon dat hint op een ommekeer naar boven.",
          explanation:
            "Een omgekeerd kop-schouderpatroon is deze vorm ondersteboven — een bodem, een lagere bodem, dan een hogere bodem — en het breekt naar boven. Wat hier is beschreven is de standaard, rechtopstaande versie die naar beneden breekt.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c28-q4",
      prompt: "Na een ren van 0,10 naar 0,15 teken je een Fibonacci-retracement en stabiliseert de prijs nabij het 61,8%-niveau, dat ook samenvalt met een oude weerstandsrichel. Hoe zou je dit moeten behandelen?",
      options: [
        {
          text: "Onmiddellijk kopen zonder stop, want een 61,8%-Fibonacci-niveau houdt altijd stand.",
          explanation:
            "Geen enkel niveau houdt altijd stand. Een retracement van 61,8% is juist een diepe terugval die het grootste deel van de beweging teruggeeft, en kopen zonder stop laat je onbeschermd als de terugval een volledige omkering wordt.",
        },
        {
          text: "Behandel het als een geloofwaardiger zone om op een kaats te letten omdat twee onafhankelijke signalen samenvallen, en bevestig nog steeds met de prijs en gebruik een stop loss.",
          explanation:
            "Juist. Een Fibonacci-niveau is slechts een kandidaat om in de gaten te houden, maar het gewicht ervan groeit wanneer het overlapt met onafhankelijke structuur zoals eerdere weerstand. Je bevestigt nog steeds met prijsactie en beschermt het idee met een stop.",
        },
        {
          text: "Negeer het, want Fibonacci-niveaus zijn betekenisloos en beïnvloeden de prijs nooit.",
          explanation:
            "Te afwijzend. Fibonacci-niveaus zijn deels zelfvervullend omdat veel traders naar dezelfde lijnen kijken, dus ze kunnen ertoe doen — zeker waar ze samenvallen met echte structuur — ook al zijn ze geen toverij.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q5",
      prompt: "Je wilt technische analyse toepassen op de prijsgrafiek van een token in deze app, die tabbladen heeft voor uur, dag, week en jaar. Wat is de meest verstandige werkwijze?",
      options: [
        {
          text: "Gebruik alleen het uurtabblad, want kortetermijndetail is het enige dat telt voor welke trade dan ook.",
          explanation:
            "Alleen op het uurtabblad werken is kortzichtig. Je zou de dominante trend missen en de grote langetermijnsteun en -weerstand die het week- en jaartabblad onthullen, en je zou makkelijk tegen het grotere plaatje in handelen.",
        },
        {
          text: "Werk van boven naar beneden: het jaartabblad voor de dominante trend en grote niveaus, het weektabblad voor de swings van de huidige trend, het dagtabblad voor een patroon, en het uurtabblad om een instap te timen — en lees daarbij overal het volume.",
          explanation:
            "Juist. Breed beginnen en versmallen houdt je trade in lijn met de grotere trend, vindt een verhandelbaar patroon, en timet de instap nabij een niveau, met volume dat elke doorbraak bevestigt — waarna het niveau een stop loss of doel in de app wordt.",
        },
        {
          text: "Kies welk enkel tabblad ook maar een vorm laat zien die je bevalt en negeer de rest.",
          explanation:
            "Selectief één vleiende tijdshorizon uitkiezen is hoe traders zichzelf voor de gek houden. Een patroon op het dagtabblad kan de ene kant op wijzen terwijl de jaartrend de andere kant op wijst; de tabbladen zijn bedoeld om samen te lezen, van boven naar beneden.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
