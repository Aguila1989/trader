import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "AI-risico-instellingen: volledige controle",
  description: "Een diepe duik in de zes onafhankelijke risicofactoren, Basis- versus Expert-modus, en hoe exacte numerieke drempels elk AI-voorstel vormgeven.",
  lessons: [
    {
      id: "c11-l1",
      title: "Wat zijn risicofactoren en waarom staan ze los van elkaar?",
      paragraphs: [
        "Het paneel Risico-instellingen staat op het tabblad Bot Trading en biedt zes onafhankelijke risicofactoren: Positiegrootte, Stop Loss-afstand, Handelsfrequentie, Volatiliteitstolerantie van het asset, Drawdown-tolerantie en Slippage-tolerantie. Elk daarvan stuurt een ander punt in de levenscyclus van een trade aan, van welke markten de chain scan überhaupt overweegt, via hoe overtuigd de AI moet zijn, tot hoe groot een order hij mag insturen en hoe ver de beschermende stop ligt. Het is policy, geen strategie: ze vertellen de AI nooit wat hij moet kopen, alleen onder welke voorwaarden hij mag handelen.",
        "De reden dat het zes losse knoppen zijn in plaats van één globale risicoschuif, is dat één enkel risiconiveau te grof is om uit te drukken hoe echte traders denken. Risicobereidheid is niet eendimensionaal. Een trader wil misschien heel strakke stops omdat de recente edge fragiel is, maar tegelijk een hoge handelsfrequentie omdat de strategie afhangt van het pakken van veel kleine spread-capture-kansen. Eén enkele schuif zou strakke stops en lage frequentie aan elkaar koppelen, wat precies de verkeerde koppeling is. Door de factoren te splitsen kun je een conservatieve instelling op de ene as combineren met een agressieve op de andere, zodat de bot jouw werkelijke thesis uitdrukt in plaats van een compromis.",
        "Elke factor wordt live uitgelezen op het moment van het voorstel, nooit gecachet. Wanneer je een waarde verandert, wordt die van kracht bij het allereerste volgende voorstel dat de orchestrator genereert, zonder herstart en zonder te wachten op een sessiegrens. Dat is belangrijk omdat marktomstandigheden sneller verschuiven dan je opnieuw kunt uitrollen, en je wilt de drawdown-pauze midden in een sessie strakker kunnen zetten of het volatiliteitsplafond kunnen versoepelen en dat meteen laten bijten.",
        "Elke numerieke waarde wordt ook in de AI-prompt geschreven, en de volledige numerieke snapshot wordt gelogd naast het voorstel dat eruit voortkwam. Dat geeft je een controleerbaar verslag: voor elk historisch voorstel kun je exact reconstrueren welke zes drempels van kracht waren toen het werd gegenereerd, wat essentieel is wanneer je een overgeslagen of uitgevoerde trade wilt toeschrijven aan een specifieke instelling in plaats van te gokken.",
      ],
      example: "Je gelooft in de spread-capture-edge maar wantrouwt trend-following, dus je zet Handelsfrequentie agressief (lage minimale confidence) terwijl je Stop Loss-afstand strak op 2 procent houdt. Eén globale schuif kan die combinatie niet uitdrukken; zes onafhankelijke factoren wel, en het volgende voorstel respecteert beide tegelijk.",
    },
    {
      id: "c11-l2",
      title: "Positiegrootte — de exacte mechaniek",
      paragraphs: [
        "In de Basis-modus is Positiegrootte een keuze in drie stappen: LOW, MEDIUM, HIGH. LOW reproduceert het huidige conservatieve gedrag van de app exact en is de achterwaarts compatibele standaard. Onder de motorkap schaalt Basis de cap op de ordergrootte als een veelvoud van de geconfigureerde cap: LOW is maal één, MEDIUM is maal drie en HIGH is maal zes. MEDIUM en HIGH schalen het risico alleen omhoog ten opzichte van LOW; er is geen manier om de Basis-modus kleiner te laten zijn dan de conservatieve basislijn.",
        "De Expert-modus-schakelaar inschakelen, met het label exacte numerieke drempels configureren, vervangt de drie stappen door één precieze regelaar: maximale positiegrootte als percentage van het beschikbare saldo. Het bereik is 1 tot 100 procent. De fabrieks-presets zijn LOW 5, MEDIUM 15 en HIGH 30, maar in Expert-modus typ je elk geheel getal binnen het bereik. De betekenis is percentage van het beschikbare saldo, geen vast tokenbedrag, zodat de absolute ordergrootte automatisch meebeweegt met je wallet naarmate die groeit of krimpt. Een instelling van 10 procent op een saldo van 400 XLM autoriseert ongeveer een order van 40 XLM; diezelfde 10 procent op een saldo van 800 XLM autoriseert ongeveer 80.",
        "Het paneel toont een live preview, zodat je die rekensom nooit uit je hoofd hoeft te doen. Het leest je huidige beschikbare saldo en toont een regel in de vorm: bij X XLM beschikbaar is het maximale order ongeveer Y XLM. Terwijl je het percentage sleept of typt, herberekent de preview meteen, waardoor het duidelijk wordt wanneer een schijnbaar bescheiden percentage zich vertaalt naar een ongemakkelijk grote absolute positie op een groot saldo.",
        "Positiegrootte staat niet op zichzelf. Er is een aparte AI-cap per trade die de orchestrator ook afdwingt. Als het percentage dat je kiest een order zou autoriseren dat groter is dan die cap per trade, toont het paneel een waarschuwing, zodat je begrijpt dat de effectieve grootte wordt teruggeklemd naar de cap in plaats van naar jouw percentage. Met andere woorden: de kleinste van de twee limieten wint, en de waarschuwing bestaat zodat het terugklemmen nooit een stille verrassing is. Lees de preview samen met de waarschuwing: de preview vertelt je wat je percentage vraagt, de waarschuwing vertelt je wanneer de AI-cap die zal overrulen.",
      ],
      example: "Je zet Expert-positiegrootte op 25 procent met 600 XLM beschikbaar. De live preview leest ongeveer 150 XLM. Als de AI-cap per trade 100 XLM is, waarschuwt het paneel dat je percentage de cap overschrijdt, en het werkelijke maximale order wordt teruggeklemd naar 100 XLM, niet 150.",
    },
    {
      id: "c11-l3",
      title: "Stop Loss-afstand en Drawdown-tolerantie — de exacte mechaniek",
      paragraphs: [
        "Stop Loss-afstand bepaalt hoe ver onder de entry de beschermende exit ligt. In de Basis-modus verbreedt de standaard stop-afstand met het niveau: MEDIUM en HIGH vermenigvuldigen het geconfigureerde stop-percentage met respectievelijk maal één, maal anderhalf en maal twee-en-een-half, en bij MEDIUM of HIGH krijgt de AI ook de instructie om een trailing stop te verkiezen boven een vaste. In Expert-modus kies je de stop direct op een van twee manieren: een vast percentage vanaf de entry, met een bereik van 0,5 tot 20 procent en presets 2, 5 en 10; of een vast bedrag vanaf de entry, uitgedrukt in XLM. De optie met het vaste bedrag is handig wanneer je in absolute termen redeneert in plaats van in percentages.",
        "Het paneel waarschuwt actief wanneer je stop-afstand heel strak is, want een stop die binnen de normale bid-ask-spread valt, triggert al op ruis alleen. Als je een stop van 0,5 procent plaatst op een markt waarvan de heen-en-weer-spread al dicht bij die breedte ligt, word je op de spread uitgestopt voordat de trade kans heeft gehad om te werken. De waarschuwing is er om te voorkomen dat je een beschermingsmiddel verandert in een gegarandeerd klein verlies.",
        "Drawdown-tolerantie is een circuit breaker op portefeuilleniveau, geen controle per trade. In de Basis-modus pauzeert LOW het AI-handelen na een daling van 5 procent, MEDIUM na 10 procent, en HIGH pauzeert nooit op drawdown. In Expert-modus leest de regelaar: pauzeer het AI-handelen als de portefeuille X procent daalt in 24 uur, met een bereik van 1 tot 50 procent en presets 5, 10 en 25. Er is ook een selectievakje Nooit pauzeren op basis van drawdown, dat exact overeenkomt met Basis HIGH en de breaker volledig uitschakelt.",
        "Het cruciale gedragsdetail is wat pauze betekent. Wanneer de 24-uurs drawdown-drempel wordt doorbroken, worden alleen nieuwe AI-entries gepauzeerd. Risico-verlagende exits zijn altijd nog toegestaan. Dat is bewust: een circuit breaker die de hele bot zou bevriezen, zou je kunnen opsluiten in een verliesgevende positie precies wanneer de omstandigheden verslechteren. Door nieuwe exposure stop te zetten terwijl de uitgang openblijft, stelpt de breaker vers risico zonder te verhinderen dat de bot je uit trades haalt waar je al in zit.",
      ],
      example: "Je zet een Expert vast-percentage-stop van 0,6 procent op een markt waarvan de spread rond 0,5 procent ligt. Het paneel waarschuwt dat de stop heel strak is. Daarnaast neemt, met Drawdown-tolerantie op 10 procent, een vroeg verlies de 24-uurs portefeuilleverandering naar min 11 procent: nieuwe entries pauzeren, maar een voorstel om een bestaande verliesgevende positie te sluiten wordt nog steeds uitgevoerd.",
    },
    {
      id: "c11-l4",
      title: "Handelsfrequentie en Volatiliteitstolerantie van het asset — de exacte mechaniek",
      paragraphs: [
        "Handelsfrequentie is geïmplementeerd als een confidence-gate, want de schoonste manier om de bot vaker of minder vaak te laten handelen is de mate veranderen waarin hij zeker moet zijn voordat hij handelt. De AI scoort elk voorstel van 0 tot 100. In de Basis-modus vereisen LOW en MEDIUM medium-of-beter confidence om automatisch in te sturen, laat HIGH bovendien voorstellen met lage confidence door, en wordt ook de cooldown tussen entries korter bij een hogere frequentie. In Expert-modus is de regelaar expliciet: minimale AI-confidence-score om te handelen, een getal van 50 tot 99 met presets 85, 70 en 55. Let op de omkering waar mensen over struikelen: een lagere drempel betekent een hogere handelsfrequentie, want meer voorstellen halen de lat.",
        "Alleen voorstellen op of boven de drempel worden automatisch uitgevoerd. Alles eronder wordt niet weggegooid; het wordt vastgehouden voor handmatige beoordeling, en de reden wordt in een expliciete, toewijsbare vorm in de log geschreven, zoals: voorstel overgeslagen, confidence 68 minder dan drempel 70. Dat verschil van twee punten is herstelbare informatie. Als je een reeks net-gemiste skips ziet die zich net onder je drempel clusteren, heb je rechtstreeks bewijs dat de drempel een paar punten verlagen echte trades zou hebben toegelaten, en de log laat je die keuze maken op basis van data in plaats van gevoel.",
        "Volatiliteitstolerantie van het asset filtert welke markten de chain scan überhaupt zal overwegen, voordat er een voorstel bestaat. In de Basis-modus versoepelen MEDIUM en HIGH de liquiditeits-gates voor 24-uurs volume en entry-spread, zodat dunnere markten in aanmerking komen. In Expert-modus is de regelaar een hard plafond: maximaal geaccepteerde 24-uurs prijsschommeling in procent, met een bereik van 1 tot 50 en presets 5, 15 en 30. Elk token waarvan de absolute 24-uurs prijsverandering het plafond overschrijdt, wordt door de scan overgeslagen en genoemd in de log van uitgesloten markten, zodat je precies kunt zien welke kandidaten zijn gefilterd en waarom.",
        "Deze twee factoren werken in verschillende stadia en stapelen netjes op elkaar. Volatiliteitstolerantie van het asset is een upstream-gate op het universum van verhandelbare markten; Handelsfrequentie is een downstream-gate op de confidence van voorstellen binnen welke markten ook overbleven. Een laag volatiliteitsplafond kan een instelling met hoge handelsfrequentie uithongeren van kandidaten, want er is simpelweg minder om te scoren. Wanneer de bot stiller is dan je verwacht, controleer dan eerst de log van uitgesloten markten om te zien of het volatiliteitsplafond, en niet de confidence-drempel, de bindende beperking is.",
      ],
      example: "Je zet Expert-handelsfrequentie op een minimale confidence van 70 en Volatiliteitstolerantie van het asset op 5 procent. Een token dat 8 procent schommelt in 24 uur bereikt de scoringsfase nooit en verschijnt in de log van uitgesloten markten. Een ander voorstel wordt wél gescoord op 68 en wordt vastgehouden, gelogd als voorstel overgeslagen, confidence 68 minder dan drempel 70.",
    },
    {
      id: "c11-l5",
      title: "Slippage-tolerantie en factoren combineren — gevorderde strategie",
      paragraphs: [
        "Slippage-tolerantie is de laatste gate vóór uitvoering en beschermt de fill-kwaliteit. In Expert-modus is de regelaar maximaal geaccepteerde slippage in procent, met een bereik van 0,1 tot 10 en presets 0,5, 1,5 en 3. Een voorstel waarvan de verwachte slippage het plafond overschrijdt, wordt regelrecht geblokkeerd. Dit is de factor die de spread-capture-thesis het meest direct verdedigt: als je edge slechts een paar basispunten is, verandert een fill die meer dan dat aan slippage prijsgeeft een winnende setup in een verliezende. Zet dit te los op dunne order books en je betaalt juist de edge weg die de strategie probeert te oogsten; zet het te strak en goede voorstellen op liquide paren worden af en toe alsnog geblokkeerd door een kortstondige verbreding.",
        "Alle zes de factoren delen twee overkoepelende concepten. Ten eerste presets: Conservatief betekent kleine trades, strakke stops, alleen hoge confidence; Gebalanceerd betekent matige exposure over alle factoren; Agressief betekent grotere trades, ruimere stops, vaker handelen. Een preset selecteren laadt in één keer een samenhangende set getallen over elke factor, en elke factor die je daarna met de hand bewerkt, zet de loader om naar Aangepast. Ten tweede verschijnt er een HIGH-waarschuwingsbanner zodra een enkele waarde agressiever is dan de Agressief-preset, zodat één knop voorbij het meest agressieve gebundelde profiel duwen altijd zichtbaar is in plaats van stil.",
        "Het punt van onafhankelijkheid is doelbewuste combinatie, en de combinaties werken op manieren op elkaar in die het waard zijn om door te denken. Om vaak maar klein en veilig te handelen, zet je Handelsfrequentie agressief met een lage minimale confidence-drempel, Positiegrootte laag op een klein percentage van het saldo, en Stop Loss-afstand strak. Om een paar zetten met hoge overtuiging te jagen, doe je het omgekeerde: een hoge confidence-drempel, een groter positiepercentage en een ruimere stop, zodat de grotere positie niet door ruis wordt uitgeschud. Onthoud dat de stadia op elkaar stapelen: het volatiliteitsplafond bepaalt het universum, de confidence-drempel bepaalt welke voorstellen overleven, positiegrootte en slippage bepalen het uiteindelijke order, en drawdown-tolerantie kan nieuwe entries over dat alles heen pauzeren.",
        "Tot slot is het hele systeem achterwaarts compatibel. Met de Expert-modus-schakelaar uit, gedraagt elke factor zich exact zoals de Basis-niveaus LOW, MEDIUM en HIGH dat eerder deden, en LOW blijft de conservatieve basislijn die het oorspronkelijke gedrag van de app reproduceert. Expert-modus is puur additieve precisie: het laat je exacte drempels benoemen, live previews en waarschuwingen zien, en de volledige numerieke snapshot bij elk voorstel laten loggen, zonder de veilige standaarden te veranderen waarop je terugvalt wanneer de schakelaar uit staat. Verander één factor per keer en lees de logs, zodat je elke gedragsverschuiving kunt toeschrijven aan de knop die je hebt verzet.",
      ],
      example: "Je wilt frequente, kleine, strak gestopte trades. Je zet Handelsfrequentie op een minimale confidence van 55, Positiegrootte op 5 procent van het saldo, Stop Loss-afstand op 2 procent en laat Slippage-tolerantie op 0,5 procent staan. De bot stelt vaak voor, doseert elk order bescheiden, stapt snel uit wanneer hij het mis heeft, en blokkeert elke fill die meer dan een half procent zou prijsgeven.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "Waarom zijn er zes onafhankelijke risicofactoren in plaats van één globale risicoschuif?",
      options: [
        { text: "Eén enkel risiconiveau is te grof; onafhankelijke factoren laten je instellingen combineren, zoals strakke stops met een hoge handelsfrequentie, die een globale schuif gedwongen samen zou laten bewegen.", explanation: "Juist. Risicobereidheid is niet eendimensionaal, dus het splitsen van de factoren laat de ene as conservatief zijn terwijl de andere agressief is, wat je werkelijke thesis uitdrukt." },
        { text: "Zes knoppen zijn alleen nodig omdat de AI geen enkel getal uit de prompt kan lezen.", explanation: "Onjuist. De AI ontvangt elke numerieke waarde in de prompt, ongeacht het aantal; de splitsing gaat over expressiviteit, niet over een beperking van de prompt." },
        { text: "Elke factor stuurt een volledig ongerelateerde app aan, en ze delen toevallig alleen één paneel.", explanation: "Onjuist. Alle zes sturen dezelfde levenscyclus van een trade voor deze bot aan; het zijn losse knoppen op één systeem, geen losse apps." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "Wat regelt de factor Positiegrootte in Expert-modus eigenlijk, en hoe werkt die samen met de AI-cap per trade?",
      options: [
        { text: "Hij stelt een vast tokenbedrag per order in dat de AI-cap per trade altijd overrulet.", explanation: "Onjuist. Expert-positiegrootte is een percentage van het saldo, geen vast bedrag, en overrulet de cap niet; de kleinste limiet wint." },
        { text: "Hij stelt de maximale confidence-score in, en de cap wordt genegeerd.", explanation: "Onjuist. Confidence is de factor Handelsfrequentie; Positiegrootte stuurt de ordergrootte aan als percentage van het beschikbare saldo." },
        { text: "Hij stelt de maximale positiegrootte in als percentage van het beschikbare saldo; als dat percentage de AI-cap per trade zou overschrijden, waarschuwt het paneel en wordt het order teruggeklemd naar de cap.", explanation: "Juist. Het percentage beweegt mee met je saldo via de live preview, en de kleinste van de uit het percentage afgeleide grootte en de cap per trade is wat daadwerkelijk wordt uitgevoerd." },
        { text: "Hij verandert alleen de kleur van de order-knop en heeft geen effect op de grootte.", explanation: "Onjuist. Hij bepaalt rechtstreeks de geautoriseerde ordergrootte als percentage van het saldo, getoond in de live preview." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q3",
      prompt: "Je zet Handelsfrequentie in Expert-modus op een minimale confidence van 70. De AI scoort een voorstel op 68. Wat gebeurt er?",
      options: [
        { text: "Het voorstel wordt automatisch uitgevoerd omdat 68 dicht genoeg bij 70 ligt.", explanation: "Onjuist. De drempel is een harde gate; alleen voorstellen op of boven 70 worden automatisch uitgevoerd, en 68 ligt eronder." },
        { text: "Het voorstel wordt permanent verwijderd en nooit vastgelegd.", explanation: "Onjuist. Voorstellen onder de drempel worden vastgehouden voor handmatige beoordeling en de reden wordt expliciet gelogd, niet verwijderd." },
        { text: "Het voorstel wordt vastgehouden voor handmatige beoordeling en de log legt iets vast zoals voorstel overgeslagen, confidence 68 minder dan drempel 70.", explanation: "Juist. Voorstellen onder de drempel worden vastgehouden, niet weggegooid, en de toewijsbare skip-regel laat je net-gemiste gevallen zien die zich net onder je drempel clusteren." },
        { text: "De hele bot pauzeert 24 uur lang.", explanation: "Onjuist. Dat is de circuit breaker van Drawdown-tolerantie, niet de confidence-gate; een enkel voorstel onder de drempel zorgt er alleen voor dat dat ene voorstel wordt vastgehouden." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q4",
      prompt: "Je wilt dat de AI vaak handelt maar met kleine posities en strakke stop losses. Welke Expert-instellingen passen daarbij?",
      options: [
        { text: "Hoge handelsfrequentie via een lage minimale confidence-drempel, een laag positiegrootte-percentage, en een kleine Stop Loss-afstand.", explanation: "Juist. Een lage confidence-drempel laat meer voorstellen toe (hogere frequentie), een laag percentage houdt elk order klein, en een strakke stop beperkt het verlies per trade." },
        { text: "Een hoge minimale confidence-drempel, een hoog positiegrootte-percentage, en een ruime Stop Loss-afstand.", explanation: "Onjuist. Dat is het hoge-overtuigingsprofiel: minder, grotere trades met ruimere stops, het tegenovergestelde van vaak, klein en strak." },
        { text: "Nooit pauzeren op drawdown, maximale slippage, en een grote stop met een vast bedrag.", explanation: "Onjuist. Geen van deze stuurt de handelsfrequentie aan of houdt posities klein; ze gaan over drawdown, fill-kwaliteit en stop-plaatsing in de verkeerde richting." },
        { text: "Alleen een laag volatiliteitsplafond voor het asset, met elke andere factor op standaard.", explanation: "Onjuist. Een laag volatiliteitsplafond verkleint het kandidaten-universum in plaats van de frequentie te verhogen, en doet niets om posities klein of stops strak te maken." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "Hoe gedraagt de Drawdown-tolerantie-breaker zich zodra de 24-uurs drempel is doorbroken, en hoe verhoudt de nooit-pauzeren-optie zich tot de Basis-modus?",
      options: [
        { text: "Hij bevriest de hele bot en blokkeert zowel nieuwe entries als exits tot de volgende dag.", explanation: "Onjuist. Exits worden nooit geblokkeerd; alles bevriezen zou je kunnen opsluiten in een verliesgevende positie, wat het ontwerp specifiek vermijdt." },
        { text: "Hij pauzeert alleen nieuwe AI-entries terwijl risico-verlagende exits altijd nog zijn toegestaan, en het selectievakje Nooit pauzeren op basis van drawdown komt overeen met Basis HIGH.", explanation: "Juist. De breaker stelpt verse exposure zonder exits te verhinderen, en het aanvinken van nooit-pauzeren is gelijk aan het Basis HIGH-niveau dat de breaker uitschakelt." },
        { text: "Hij verdubbelt de positiegrootte om de drawdown sneller terug te winnen.", explanation: "Onjuist. Dat is martingale-gedrag; de breaker verlaagt nieuw risico in plaats van het te verhogen." },
        { text: "Hij versoepelt het slippage-plafond zodat meer trades fillen.", explanation: "Onjuist. Drawdown-tolerantie pauzeert nieuwe entries; het raakt Slippage-tolerantie niet, dat een aparte factor is." },
      ],
      correctIndex: 1,
    },
  ],
};
