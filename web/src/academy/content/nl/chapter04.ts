import type { Chapter } from "../../types";

export const chapter04: Chapter = {
  id: "c4",
  number: 4,
  level: "BASIC",
  title: "Basis van risico",
  description: "Wat risico, volatiliteit en verlies betekenen, en de eenvoudige gewoontes die ze klein houden.",
  lessons: [
    {
      id: "c4-l1",
      title: "Wat is risico bij trading?",
      paragraphs: [
        "Risico is simpelweg de kans dat een trade geld verliest in plaats van oplevert. Elke trade heeft twee mogelijke uitkomsten: de prijs beweegt jouw kant op, of hij beweegt tegen je in. Niemand kan vooraf weten welke van de twee gebeurt, dus risico is er altijd. Het doel is nooit om risico volledig weg te nemen, alleen om het klein genoeg te houden zodat een enkele slechte trade je niet hard kan raken.",
        "Deze bot is rond dat idee opgebouwd. Hij dwingt een maximumbedrag per trade af, een maximaal aantal trades per dag en een maximale totale open exposure. Die limieten leggen een plafond op hoeveel er tegelijk mis kan gaan, zelfs als meerdere trades slecht uitpakken.",
        "Een handige manier om over risico na te denken is: wat is het meeste dat ik hier kan verliezen, en kan ik met dat bedrag leven? Als het eerlijke antwoord je ongemakkelijk maakt, is de positie te groot. De omvang verkleinen is de makkelijkste manier om het risico te verkleinen.",
      ],
      example: "Je houdt 1000 XLM aan, ongeveer 100 USDC waard. Je zet het maximum per trade op 10 USDC. Zelfs als een enkele trade volledig fout zou gaan, staat alleen dat stukje van 10 USDC bloot, dus je worstcase op een trade is grofweg een tiende van je wallet, niet het geheel. De overige 90 USDC blijft onaangeroerd en klaar voor betere momenten.",
    },
    {
      id: "c4-l2",
      title: "Wat is volatiliteit en waarom is het risicovol?",
      paragraphs: [
        "Volatiliteit betekent hoeveel en hoe snel een prijs heen en weer springt. Een spaarsaldo bij de bank beweegt nauwelijks, dus dat heeft bijna geen volatiliteit. Crypto is het tegenovergestelde: XLM kan in een enkele dag enkele procenten stijgen of dalen, soms binnen enkele uren. Precies die beweging is waarom mensen ermee traden, en precies daarom is het ook risicovol.",
        "Hoge volatiliteit werkt twee kanten op. Dezelfde uitslag die je positie kan laten groeien, kan hem net zo snel laten krimpen. Als je niet oplet, kan een scherpe beweging een kleine papieren winst veranderen in een echt verlies voordat je reageert.",
        "Het dashboard helpt je dit te voelen. Het waardeert je hele wallet in zowel XLM als USDC, zodat je de totale waarde in realtime kunt zien stijgen en dalen. Die cijfers zien bewegen is de duidelijkste manier om te begrijpen dat volatiliteit niet abstract is, maar je geld dat van omvang verandert.",
      ],
      example: "Stel dat XLM s ochtends 0.100 USDC waard is. Tegen de middag daalt hij 5 procent naar 0.095 USDC. Als je 2000 XLM aanhield, zakte je stack van 200 USDC naar 190 USDC, een uitslag van 10 USDC in een paar uur zonder dat jij iets deed. Die snelheid is volatiliteit, en daarom zijn positiegrootte en stop loss belangrijk.",
    },
    {
      id: "c4-l3",
      title: "Wat is een verlies en hoe beperk je het?",
      paragraphs: [
        "Een verlies treedt op wanneer je eindigt met minder waarde dan waarmee je begon, meestal omdat je kocht en de prijs daarna daalde, of verkocht en hij steeg. Verliezen horen er normaal en onvermijdelijk bij in trading. De vaardigheid zit niet in ze helemaal vermijden, maar in elk verlies klein houden zodat je account overleeft om een andere dag verder te traden.",
        "Deze bot beperkt verliezen op meerdere gelaagde manieren. Een dagelijks verliesbudget verkleint automatisch je positiegroottes naarmate de verliezen zich gedurende de dag opstapelen, zodat een slechte reeks rustiger wordt in plaats van luider. Er is ook een maximaal dagvolume en een maximaal aantal trades per dag, die voorkomen dat je te veel gaat traden wanneer het misgaat.",
        "Voor een enkele positie kun je een stop loss toevoegen, later in detail behandeld, die de trade sluit zodra hij onder een door jou gekozen niveau zakt. Samen veranderen deze tools een mogelijk groot, open verlies in een klein, bekend verlies.",
      ],
      example: "Je koopt voor 50 USDC aan XLM en de prijs begint te glijden. Met een stop loss op 4 procent onder je instap verkoopt de bot zodra je ongeveer 2 USDC in het rood staat, waarmee dat verlies wordt afgetopt. Ondertussen merkt het dagelijks verliesbudget de rode dag op en knipt het je volgende trade terug van 10 USDC naar 5 USDC, zodat de dag geen sneeuwbal kan worden.",
    },
    {
      id: "c4-l4",
      title: "Alleen investeren wat je kunt missen",
      paragraphs: [
        "Alleen investeren wat je kunt missen betekent geld inleggen dat, als het volledig zou verdwijnen, je leven niet zou veranderen. Huur, eten, rekeningen en je noodspaarpot zijn nooit handelsgeld. Als het verliezen van het bedrag echte stress zou veroorzaken of je zou dwingen te lenen, is het te veel.",
        "Deze regel is belangrijk omdat volatiliteit echt is en verliezen wel degelijk gebeuren. Mensen die traden met geld dat ze niet kunnen missen, raken vaak in paniek, houden verliezende trades te lang vast in de hoop dat ze herstellen, of jagen verliezen na met grotere inzetten. Geld dat je echt kunt missen laat je in plaats daarvan kalme, rationele beslissingen nemen.",
        "De bot ondersteunt deze instelling rechtstreeks. Hij start op in read-only modus en biedt een paper trading modus die volledig gesimuleerd is zonder echt geld, zodat je kunt oefenen en het gevoel van risico kunt leren voordat er ook maar een echte munt op het spel staat.",
      ],
      example: "Stel je hebt 1000 USDC aan spaargeld, maar 900 daarvan heb je nodig voor huur en noodgevallen. Het bedrag dat je hier kunt missen is misschien 50 USDC, niet de volle 1000. Je financiert de bot met die 50, zet de limiet per trade laag en begint eerst in paper modus. Als het allemaal zou verdwijnen, zouden je huur en je vangnet nog volledig intact zijn.",
    },
    {
      id: "c4-l5",
      title: "Wat is diversificatie?",
      paragraphs: [
        "Diversificatie betekent niet al je geld in een ding stoppen. Als alles wat je bezit een enkele token is en die token crasht, verlies je op alle fronten tegelijk. Waarde spreiden over meerdere posities betekent dat een daling in de ene wordt opgevangen door de andere.",
        "Een eenvoudige eerste stap is meer dan een asset aanhouden. Deze bot waardeert je wallet in zowel XLM als USDC, en USDC is een stablecoin die ontworpen is om dicht bij een dollar te blijven, dus die beweegt nauwelijks. Een deel van je wallet in USDC houden geeft je een rustig ankerpunt terwijl de rest meebeweegt met de volatielere XLM.",
        "Diversificatie is geen toverkunst en neemt het risico niet weg, maar het maakt de hobbels gladder. Gecombineerd met de exposure-limieten van de bot voorkomt het dat een enkele positie je hele uitkomst bepaalt, wat zowel je geld als je zenuwen stabieler houdt.",
      ],
      example: "Stel dat je alle 100 USDC aan waarde in XLM steekt en hij over nacht 8 procent daalt; je staat dan 8 USDC in het rood zonder iets om het te verzachten. Als je in plaats daarvan 50 USDC in XLM en 50 USDC in stabiele USDC aanhield, kost dezelfde daling van 8 procent in XLM slechts 4 USDC, omdat de helft van je wallet nooit bewoog. Dezelfde markt, de helft van de pijn.",
    },
  ],
  quiz: [
    {
      id: "c4-q1",
      prompt: "Wat betekent risico bij trading eigenlijk?",
      options: [
        {
          text: "Een garantie dat je op elke trade geld verliest",
          explanation: "Onjuist. Risico is geen garantie op verlies; het is de kans dat een trade tegen je in gaat, en veel trades pakken prima uit.",
        },
        {
          text: "De kans dat een trade geld verliest in plaats van oplevert",
          explanation: "Juist. Risico is de mogelijkheid dat de prijs tegen je in beweegt, en daarom topt de bot de omvang per trade en de totale exposure af.",
        },
        {
          text: "Een kost die de exchange rekent om een positie te openen",
          explanation: "Onjuist. Dat beschrijft handelskosten of de spread, niet risico. Risico gaat over onzekere uitkomsten, niet over een vaste kost.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c4-q2",
      prompt: "Waarom wordt hoge volatiliteit als risicovol gezien?",
      options: [
        {
          text: "Omdat de prijs nooit verandert, dus je kunt nooit verkopen",
          explanation: "Onjuist. Dat is het tegenovergestelde van volatiliteit. Volatiliteit betekent dat de prijs veel verandert, niet dat hij stilstaat.",
        },
        {
          text: "Omdat het prijzen alleen maar omhoog duwt",
          explanation: "Onjuist. Volatiliteit werkt twee kanten op; dezelfde snelle beweging die een positie kan laten groeien, kan hem net zo snel laten krimpen.",
        },
        {
          text: "Omdat prijzen snel enkele procenten kunnen uitslaan, waardoor waarde snel kan dalen voordat je reageert",
          explanation: "Juist. XLM kan in een dag enkele procenten bewegen, en die snelheid kan een papieren winst in een echt verlies veranderen voordat je handelt.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c4-q3",
      prompt: "Welke tool helpt het verlies op een enkele positie af te toppen?",
      options: [
        {
          text: "Een stop loss die de trade sluit zodra hij onder een door jou gekozen niveau zakt",
          explanation: "Juist. Een stop loss verandert een open verlies in een klein, bekend verlies door uit te stappen op een niveau dat je vooraf instelt.",
        },
        {
          text: "Meer van de token kopen terwijl hij blijft dalen",
          explanation: "Onjuist. Dat vergroot je exposure en je mogelijke verlies; het is precies het verliezen-najagen-gedrag waar de regels voor waarschuwen.",
        },
        {
          text: "Het dashboard uitzetten zodat je de prijs niet kunt zien",
          explanation: "Onjuist. De prijs negeren beperkt een verlies niet; het verbergt het alleen terwijl de positie verder tegen je in beweegt.",
        },
        {
          text: "Het dagelijks verliesbudget verwijderen zodat trades groot blijven",
          explanation: "Onjuist. Het dagelijks verliesbudget beschermt je door de omvang te verkleinen tijdens een slechte reeks; het verwijderen zou het risico vergroten.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c4-q4",
      prompt: "Wat betekent alleen investeren wat je kunt missen in de praktijk?",
      options: [
        {
          text: "Traden met je huurgeld omdat de bot toch verliezen beperkt",
          explanation: "Onjuist. Huur en rekeningen zijn nooit handelsgeld; limieten verlagen het risico maar nemen het nooit weg, en essentiele middelen moeten veilig blijven.",
        },
        {
          text: "De bot alleen financieren met geld waarvan het totale verlies je leven niet zou raken",
          explanation: "Juist. Geld dat je kunt missen houdt je kalm en rationeel, en daarom biedt de bot ook een paper modus om eerst te oefenen.",
        },
        {
          text: "Alles in een keer investeren zodat een enkele grote winst alle risico dekt",
          explanation: "Onjuist. Alles inzetten negeert diversificatie en exposure-limieten, en een enkele slechte beweging zou de hele wallet kunnen wegvagen.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
