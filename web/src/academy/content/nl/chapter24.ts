// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// BASIC chapter on Stablecoins and USDC: what a stablecoin is, what USDC is and
// who backs it, why it works as a portfolio base, the real risks (depeg), and
// how to use it in this app. Authored to the exact same shape as
// content/en/chapter22.ts. The only addition is the per-chapter `whoFor`
// one-liner, typed via a local intersection so the live Chapter interface stays
// untouched until integration. New BASIC glossary terms introduced here
// (stablecoin, peg, depeg) live in glossary.pending.ts, NOT in the live
// glossary, and are spelled verbatim in the prose so the first occurrence
// auto-links to a tooltip.
import type { Chapter } from "../../types";

export const chapter24: Chapter & { whoFor: string } = {
  id: "c24",
  number: 24,
  level: "BASIC",
  whoFor: "Voor iedereen die een veilige thuisbasis voor zijn geld zoekt",
  title: "Stablecoins en USDC",
  description:
    "Wat een stablecoin is, wat USDC is en wie erachter staat, waarom het werkt als een stabiele basis voor je portefeuille, de echte risico's, en hoe je het in deze app gebruikt.",
  lessons: [
    {
      id: "c24-l1",
      title: "Wat is een stablecoin?",
      paragraphs: [
        "Een stablecoin is een token dat is ontworpen om een stabiele waarde vast te houden in plaats van op en neer te schommelen. De meeste ervan proberen één gewone munteenheid één-op-één te evenaren, zodat één token altijd bedoeld is om één dollar of één euro waard te zijn. Die streefwaarde heet de peg, en het vasthouden van de peg is de hele bestaansreden van de coin.",
        "Gewone crypto zoals XLM kan op één dag flink stijgen of dalen, wat spannend is maar stressvol als je gewoon wilt dat je geld stil blijft staan. Een stablecoin geeft je het gemak van waarde aanhouden op de blockchain, waar je het direct kunt versturen en verhandelen, terwijl de prijs saai en voorspelbaar blijft.",
        "Zie een stablecoin als een digitale versie van een munteenheid die je al kent. Hij beweegt met de snelheid van het netwerk en woont in je crypto-wallet, maar zijn waarde is bedoeld om gelijk te blijven aan het alledaagse geld dat hij volgt.",
      ],
      example:
        "Stel je een digitale euro voor: precies dezelfde waarde als een euro op je bank, één-op-één, maar hij leeft op de blockchain in plaats van op een bankrekening. Je zou hem in enkele seconden de wereld over kunnen sturen, en zo'n digitale euro zou nog steeds één echte euro waard zijn. Die stabiele één-op-één-waarde is de peg, en een coin die is gebouwd om die vast te houden is een stablecoin.",
    },
    {
      id: "c24-l2",
      title: "Wat is USDC en wie staat erachter?",
      paragraphs: [
        "USDC is een van de meest gebruikte stablecoins, en hij streeft ernaar altijd gelijk te zijn aan één Amerikaanse dollar. Hij wordt uitgegeven door een bedrijf dat Circle heet, wat betekent dat Circle de partij is die nieuwe USDC aanmaakt en belooft elk token als één dollar te honoreren. Op het Stellar-netwerk is USDC een token dat je kunt aanhouden, versturen en verhandelen, net als elk ander.",
        "De belofte werkt alleen als de dollars er echt zijn. Voor elke USDC in omloop zegt Circle een gelijk bedrag aan te houden in veilige reserves, zoals echte Amerikaanse dollars en kortlopende staatsobligaties. Als je ooit je USDC teruggeeft, zou je er een echte dollar voor terug moeten kunnen krijgen, en die dekking is wat de waarde stabiel houdt.",
        "USDC vertrouwen betekent dus eigenlijk erop vertrouwen dat Circle voldoende reserves aanhoudt en er eerlijk over is. Dit is geen financieel advies, en geen enkele reserve is zonder risico, maar het basisidee is eenvoudig: het token is een aanspraak op een echte dollar die ergens veilig staat.",
      ],
      example:
        "Stel je een garderobebalie voor. Je geeft je jas af en krijgt een genummerd kaartje. Het kaartje is niet de jas, maar iedereen behandelt het als precies één jas waard, omdat je erop vertrouwt dat de balie de jas teruggeeft. USDC is dat kaartje, Circle beheert de balie, en de reserves zijn de jassen in de achterkamer. Zolang er voor elk kaartje een echte dollar is, houdt het kaartje zijn waarde.",
    },
    {
      id: "c24-l3",
      title: "Waarom USDC gebruiken als basismunt voor je portefeuille?",
      paragraphs: [
        "Wanneer je meerdere coins bezit waarvan de prijzen allemaal tegelijk bewegen, is het moeilijk om te zien of je het eigenlijk wel goed doet. Een stablecoin lost dit op door je een stabiele meetlat te geven. Omdat USDC dicht bij één dollar blijft, laat het meten van alles ten opzichte daarvan je echte winsten en verliezen duidelijk zien, in plaats van gissen terwijl elke prijs wiebelt.",
        "USDC is ook een plek om waarde te parkeren zonder crypto te verlaten. Als je een coin verkoopt en de opbrengst naar USDC verplaatst, staat je geld buiten de schommelingen van de markt maar zit het nog steeds in je wallet, klaar om binnen enkele seconden opnieuw te handelen. Je hoeft niet uit te cashen naar een bank en te wachten om weer in te stappen.",
        "In deze app is USDC de primaire basismunt, dus het meeste kopen en verkopen wordt gemeten en genoteerd ten opzichte daarvan. Dat maakt het de natuurlijke thuisbasis waar je tussen trades naar terugkeert, en een helder referentiepunt om af te lezen hoe je portefeuille het doet.",
      ],
      example:
        "Zie USDC als de thuisbasis in een spel tikkertje. Je rent naar buiten om een zet te doen, in dit geval een trade, en daarna kun je terugsprinten naar de basis waar je veilig bent en op adem kunt komen. Omdat de basis nooit beweegt, weet je altijd precies hoe ver je bent gereisd, en daarom maakt waarde aanhouden in USDC je winsten en verliezen makkelijk af te lezen.",
    },
    {
      id: "c24-l4",
      title: "Zijn stablecoins altijd stabiel? Risico's uitgelegd",
      paragraphs: [
        "Het woord stabiel is een doel, geen garantie. Een stablecoin kan zijn peg verliezen en voor minder verhandeld worden dan de dollar die hij zou moeten evenaren, en dit heet een depeg. Het kan een paar uur duren of, in het ergste geval, nooit volledig herstellen. De stabiliteit hangt volledig af van de belofte achter de coin die daadwerkelijk standhoudt.",
        "De grootste zorg is het vertrouwen in de uitgever en de reserves. Als mensen vrezen dat het bedrijf niet echt voldoende veilige activa aanhoudt, of er niet bij kan, haasten ze zich om te verkopen en zakt de prijs onder één dollar. Een depeg is meestal een vertrouwenscrisis: zodra houders twijfelen aan de dekking, drijft juist het verkopen dat door die twijfel wordt aangedreven de prijs verder omlaag.",
        "Dit betekent niet dat stablecoins slecht zijn, alleen dat geen enkel token volledig zonder risico is. Het loont de moeite om te weten wie een coin uitgeeft en hoe hij gedekt is voordat je hem als je basis vertrouwt. Dit is uitsluitend educatief en geen financieel advies.",
      ],
      example:
        "In 2022 verloor een stablecoin genaamd UST, die op slimme software leunde in plaats van op echte dollars in reserve, zijn peg en stortte in dagen in van één dollar naar een paar cent, waarmee enorme hoeveelheden waarde werden weggevaagd. Dat is een depeg in zijn meest ernstige vorm. Het is de scherpste herinnering dat stabiel een streven is dat de coin probeert vast te houden, geen natuurwet, en dat de dekking achter een coin echt telt.",
    },
    {
      id: "c24-l5",
      title: "Hoe je USDC in deze app gebruikt voor swaps en trades",
      paragraphs: [
        "Voordat je USDC op Stellar kunt aanhouden, heb je een trustline naar Circle, de uitgever, nodig. Een trustline is een kleine opt-in die het netwerk vertelt dat je bereid bent dat specifieke token aan te houden; het kost een piepkleine XLM-reserve en hoeft maar één keer per token te gebeuren. Deze app kan je door het toevoegen ervan begeleiden, en zolang die niet bestaat kan je wallet simpelweg geen USDC ontvangen.",
        "Zodra je wat USDC aanhoudt, gebruik je het via het JIJ VERKOOPT- en JIJ KOOPT-formulier op het tabblad Handmatig handelen. Om een coin te kopen zet je USDC aan de JIJ VERKOOPT-kant en de coin die je wilt aan de JIJ KOOPT-kant; om terug naar veiligheid te gaan doe je het omgekeerde en houd je weer USDC aan. Je kunt handelen tegen de huidige marktprijs of een limietprijs instellen, en je slippage-tolerantie aanpassen zodat een snel bewegende markt je order niet tegen een verrassend tarief invult.",
        "Omdat USDC de basismunt van de app is, gaan de meeste swaps er van nature in of uit, waardoor het de coin is waarin je tussen trades blijft zitten. Als je een diepere doorloop van het koop- en verkoopformulier en slippage wilt, behandelen de hoofdstukken over handmatig handelen dit stap voor stap.",
      ],
      example:
        "Stel dat je 100 USDC aanhoudt en wat XLM wilt. Je opent het JIJ VERKOOPT- en JIJ KOOPT-formulier, zet USDC aan de verkoopkant en XLM aan de koopkant, controleert de slippage-tolerantie, en bevestigt. Later, om winst vast te leggen en te rusten, gebruik je hetzelfde formulier de andere kant op en verkoop je XLM terug naar USDC. Je waarde is weer thuis in de stabiele basiscoin, klaar voor de volgende zet zodra je besluit die te maken.",
    },
  ],
  quiz: [
    {
      id: "c24-q1",
      prompt: "Wat beschrijft een stablecoin het best?",
      options: [
        {
          text: "Een token ontworpen om een stabiele waarde vast te houden, meestal door één munteenheid één-op-één te evenaren.",
          explanation:
            "Juist. Het hele doel van een stablecoin is stabiel blijven, doorgaans gekoppeld aan één dollar of één euro, zodat hij zich gedraagt als een digitale versie van gewoon geld.",
        },
        {
          text: "Een coin waarvan de prijs bedoeld is om zo snel mogelijk te stijgen.",
          explanation:
            "Nee. Dat beschrijft een speculatief asset. Een stablecoin is het tegenovergestelde: hij streeft ernaar saai en onveranderd te blijven, niet om omhoog te schieten.",
        },
        {
          text: "De oorspronkelijke coin die de netwerkkosten van Stellar betaalt.",
          explanation:
            "Dat is XLM, geen stablecoin. De prijs van XLM beweegt vrij, terwijl een stablecoin is gebouwd om een vaste waarde vast te houden.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c24-q2",
      prompt: "Wie geeft USDC uit en wat hoort het te dekken?",
      options: [
        {
          text: "Niemand geeft het uit; de waarde komt puur voort uit vraag en aanbod.",
          explanation:
            "Nee. USDC wordt niet enkel door marktkrachten gedekt. Een specifiek bedrijf geeft het uit en belooft echte reserves achter elk token.",
        },
        {
          text: "Het Stellar-netwerk zelf maakt het aan en garandeert de dollarwaarde.",
          explanation:
            "Niet helemaal. Stellar is slechts het netwerk waarop USDC leeft. Het netwerk geeft het niet uit en houdt de reserves niet aan.",
        },
        {
          text: "Circle geeft het uit, en elk token hoort gedekt te zijn door echte dollars en veilige reserves.",
          explanation:
            "Juist. Circle maakt USDC aan en zegt een gelijke waarde in veilige activa aan te houden, zodat elk token een aanspraak op een echte dollar is. USDC vertrouwen betekent die dekking vertrouwen.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c24-q3",
      prompt: "Waarom is USDC een goede basismunt om je portefeuille mee te meten?",
      options: [
        {
          text: "Omdat de prijs gestaag stijgt, zodat je bezit altijd groeit.",
          explanation:
            "Nee. USDC is helemaal niet ontworpen om te stijgen; hij blijft dicht bij één dollar. Zijn nut komt voort uit stabiel zijn, niet uit groeien.",
        },
        {
          text: "Omdat hij dicht bij één dollar blijft, wat je een stabiele meetlat geeft en een plek om waarde te parkeren zonder crypto te verlaten.",
          explanation:
            "Juist. Een stabiele waarde laat je winsten en verliezen duidelijk aflezen en de marktschommelingen uitzitten terwijl je in je wallet blijft. In deze app is USDC de primaire basismunt.",
        },
        {
          text: "Omdat hij onder geen enkele omstandigheid ooit waarde kan verliezen.",
          explanation:
            "Niet waar. Zelfs een stablecoin kan van zijn peg afglijden. Zijn waarde is stabiel als doel, geen absolute garantie.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c24-q4",
      prompt: "Wat betekent het wanneer een stablecoin een depeg ondergaat?",
      options: [
        {
          text: "Hij wordt permanent opgewaardeerd tot meer dan één dollar waard.",
          explanation:
            "Nee. Een depeg is geen opwaardering. Het betekent dat de coin is afgedreven van zijn beoogde waarde, meestal naar beneden, en mogelijk niet volledig herstelt.",
        },
        {
          text: "Hij glijdt weg van zijn streefwaarde en evenaart niet langer de dollar die hij zou moeten volgen.",
          explanation:
            "Juist. Een depeg is wanneer een stablecoin zijn peg verliest, vaak omdat houders het vertrouwen in de uitgever of reserves verliezen en zich haasten om te verkopen, waardoor de prijs onder één dollar wordt geduwd.",
        },
        {
          text: "Hij wordt automatisch door het netwerk omgezet in XLM.",
          explanation:
            "Nee. Niets zet de coin om in XLM. Een depeg is simpelweg dat de prijs zijn beoogde één-op-één-waarde niet vasthoudt.",
        },
        {
          text: "De trustline naar de uitgever wordt door de app gesloten.",
          explanation:
            "Nee. Een depeg gaat over de prijs, niet over trustlines, en deze app voegt nooit uit zichzelf een trustline toe of verwijdert er een. Een depeg kan gebeuren terwijl je trustline volledig open blijft.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
