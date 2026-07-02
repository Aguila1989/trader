// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Chapter 31 (Tokenomics): supply, market cap, minting and burning, and using
// tokenomics as a complementary lens on an AI trustline suggestion. Authored to
// the same shape as content/en/chapter22.ts, ADVANCED level, with the per-chapter
// `whoFor` one-liner typed via a local intersection so the live Chapter interface
// stays untouched until integration. This chapter owns no new glossary terms.
import type { Chapter } from "../../types";

export const chapter31: Chapter & { whoFor: string } = {
  id: "c31",
  number: 31,
  level: "ADVANCED",
  whoFor: "Voor traders die een token beoordelen op de supply, niet op de hype",
  title: "Tokenomics",
  description:
    "Supply, marktkapitalisatie en inflatie via minting en burning — en hoe je tokenomics als lens gebruikt wanneer de AI een nieuwe trustline voorstelt.",
  lessons: [
    {
      id: "c31-l1",
      title: "Wat is tokenomics?",
      paragraphs: [
        "Tokenomics is de economie van een token: hoeveel eenheden er bestaan, hoe er nieuwe worden aangemaakt (uitgifte), wie ze aanhoudt (verdeling), en welk gedrag het ontwerp beloont (prikkels). Het is het reglement dat de geldhoeveelheid van één enkel asset bepaalt, vastgesteld door wie het uitgeeft. Op Stellar heeft XLM zijn eigen vaste monetaire beleid, terwijl elke uitgever een eigen token kan minten en zijn eigen regels in een stellar.toml-bestand kan vastleggen.",
        "De vier pijlers zijn belangrijk omdat prijs slechts de helft van de waarde is. Een token kan er op de grafiek actief uitzien en toch stilletjes verwaterd worden doordat een uitgever er meer van bijmaakt, of zo sterk geconcentreerd zijn dat een handvol wallets de markt naar believen kan bewegen. De supply en verdeling lezen vertelt je of de prijs die je ziet een schaars, breed verspreid asset weerspiegelt, of een overvloedig asset dat door enkele insiders wordt gecontroleerd.",
        "Je hebt geen spreadsheet nodig om te beginnen. Drie vragen dekken het grootste deel: hoeveel tokens zijn er nu in omloop, hoeveel kunnen er ooit bestaan, en wie profiteert er wanneer de supply verandert. Tokenomics is simpelweg de discipline om die vragen te stellen voordat je een token je kapitaal toevertrouwt. Dit is educatief materiaal, geen financieel advies — het doel is je te helpen een token te lezen, niet je te vertellen welke je moet kopen.",
      ],
      example:
        "Denk aan een concertzaal. Het aantal stoelen dat op de tickets staat gedrukt is de supply, de kassa die beslist of er meer worden gedrukt is de uitgifte, wie die tickets vasthoudt is de verdeling, en de voordelen die bij een plaats op de eerste rij horen zijn de prikkels. Twee optredens kunnen dezelfde ticketprijs vragen, maar het optreden dat stilletjes extra tickets blijft drukken maakt elk bestaand ticket minder waard. Tokenomics is het zaalplan lezen voordat je betaalt.",
    },
    {
      id: "c31-l2",
      title: "Wat is circulerende supply versus maximale supply?",
      paragraphs: [
        "Circulerende supply is het aantal tokens dat op dit moment daadwerkelijk beschikbaar en verhandelbaar is. Maximale supply is het grootste aantal dat ooit kan bestaan onder de regels van het token. Het verschil daartussen zijn de tokens die zijn toegezegd maar nog niet zijn vrijgegeven — vastgezet in vestingschema's voor het team, gereserveerd voor toekomstige beloningen, of gewoon nog niet gemint.",
        "Stel je een stad voor. De woningen die mensen vandaag kunnen huren of kopen zijn de circulerende supply. Het volledige bouwplan in de boeken van de gemeente — elk perceel dat is bestemd voor toekomstige bouw — is de maximale supply. Als een stad 10.000 bewoonde woningen heeft maar een plan voor 100.000, dan weet je dat er een golf nieuwe woningen aankomt. Die toekomstige bouw zal concurreren met de woningen die er vandaag staan en kan de prijs ervan drukken, ook al is er nog niets gebouwd.",
        "Voor een token is die toekomstige uitbouw verwateringsrisico. Als de circulerende supply een klein deel is van de maximale supply, staan er grote tranches tokens gepland om vrij te komen, en elke vrijgave voegt verkopers aan de markt toe. Een token dat vandaag goed handelt kan maandenlang wegzakken puur omdat het supplyschema nieuwe eenheden blijft vrijgeven. Vergelijk altijd de twee cijfers voordat je een prijs als hoog of laag beoordeelt.",
      ],
      example:
        "Een token handelt op 2 USDC met 50 miljoen tokens in omloop, maar de maximale supply is 500 miljoen. Slechts 10 procent is vrijgegeven. De resterende 450 miljoen komen de komende drie jaar vrij voor het team en vroege investeerders. Zelfs als de vraag gelijk blijft, kan die gestage stroom nieuwe verkopers de prijs drukken — dus de 2 USDC die je vandaag betaalt concurreert niet alleen met de houders van vandaag, maar met negen keer zoveel tokens die in de pijplijn wachten.",
    },
    {
      id: "c31-l3",
      title: "Wat is marktkapitalisatie en hoe bereken je die?",
      paragraphs: [
        "Marktkapitalisatie is de totale waarde van de circulerende supply van een token: market cap = prijs x circulerende supply. Het beantwoordt een grotere vraag dan prijs alleen — niet wat één eenheid kost, maar wat de hele verhandelbare pool waard is. Een market cap van 50 miljoen USDC betekent dat de markt op dit moment alle circulerende tokens samen op ongeveer dat bedrag waardeert.",
        "Daarom is een lage prijs per token niet hetzelfde als goedkoop. De prijs hangt volledig af van hoe de supply is verdeeld. Een token op 0,001 USDC met 100 miljard eenheden in omloop heeft een market cap van 100 miljoen USDC — veel groter dan een token op 200 USDC met slechts 100.000 eenheden, die maar 20 miljoen waard is. De prijs per eenheid zegt je niets over de omvang totdat je die vermenigvuldigt met de supply.",
        "Twee andere invalshoeken zijn het waard om te kennen. Een volledig verwaterde waardering past dezelfde rekensom toe op de maximale supply in plaats van op de circulerende supply, en toont wat het token waard zou zijn als elke toekomstige eenheid vandaag al bestond — een handige controle op de verwatering die je in de vorige les hebt geleerd. En de market cap gedeeld door het dagelijkse handelsvolume geeft een hint over liquiditeit: een enorme cap op een dun volume betekent dat je mogelijk moeite hebt om tegen de genoteerde prijs uit te stappen.",
      ],
      example:
        "Je vergelijkt twee tokens op de tokendetailpagina. Token A toont 0,02 USDC per eenheid; Token B toont 45 USDC per eenheid. B lijkt 'duur'. Maar A heeft 8 miljard tokens in omloop (market cap 160 miljoen USDC) terwijl B er 1 miljoen in omloop heeft (market cap 45 miljoen USDC). A is het veel grotere asset ondanks zijn minieme prijskaartje. Als je alleen op de vraagprijs afging, had je het precies andersom ingeschat.",
    },
    {
      id: "c31-l4",
      title: "Wat is inflatie in crypto? Tokens minten en burnen",
      paragraphs: [
        "Inflatie in crypto betekent dat de supply in de loop van de tijd groeit. Het mechanisme is minting: de uitgever maakt nieuwe tokens aan en voegt ze toe aan de circulatie, vaak om beloningen, stakinguitkeringen of een treasury te financieren. Elk nieuw gemint token is een aanspraak op dezelfde onderliggende waarde, dus tenzij de vraag meegroeit, wordt het deel van elke bestaande houder een iets kleiner aandeel van het geheel — dat is verwatering.",
        "Burning is het tegenovergestelde. Tokens worden naar een adres gestuurd waar niemand vanuit kan uitgeven, waardoor ze permanent uit de supply worden verwijderd. Een deflatoir ontwerp burnt tokens sneller dan het ze mint, zodat het totaal krimpt en elk resterend token een groter aandeel vertegenwoordigt. Op Stellar gebeurt dit door supply terug te clawbacken naar de uitgever of door ze naar een onbruikbaar account te sturen; XLM zelf heeft een vaste supply zonder doorlopende minting, dus het inflateert niet.",
        "Voor een houder is de richting en het tempo van de supplyverandering net zo belangrijk als de prijs. Een token dat stilletjes elk jaar 10 procent meer eenheden mint is tegenwind die je betaalt zelfs wanneer de prijs vlak lijkt, omdat je eigendomsaandeel jaarlijks afkalft. Een geloofwaardig burnschema is meewind. Geen van beide is automatisch goed of slecht — een vroeg project moet mogelijk minten om adoptie op gang te brengen — maar je zou moeten weten welke kant de supply op beweegt en waarom voordat je het aanhoudt.",
      ],
      example:
        "Je houdt 1.000 eenheden van een token aan, wat 1 procent is van een supply van 100.000 eenheden. De uitgever mint vervolgens 100.000 nieuwe eenheden voor een beloningsprogramma, waardoor de supply verdubbelt naar 200.000. Je houdt nog steeds 1.000 eenheden aan, maar dat is nu slechts 0,5 procent van het token. Je positie is niet gekrompen — de taart is verdubbeld — en toch is jouw stuk ervan gehalveerd. Als de prijs niet was gestegen om nieuwe vraag te weerspiegelen, verloor je belang zojuist stilletjes de helft van zijn relatieve gewicht.",
    },
    {
      id: "c31-l5",
      title: "Hoe gebruik je tokenomics om een AI-trustlinesuggestie te beoordelen",
      paragraphs: [
        "Wanneer de wekelijkse, alleen-observerende scan van Atrium een nieuwe trustline voorstelt, is tokenomics je checklist vóór het toevertrouwen. Voordat je ervoor kiest een token aan te houden — wat een kleine XLM-reserve kost en je blootstelt aan de uitgever — loop je de drie vragen uit dit hoofdstuk na. Wat is de circulerende supply tegenover de maximale supply, zodat je de verwatering kunt inschatten? Wat is de market cap, zodat je je niet laat misleiden door een lage prijs per token? En mint, burnt of vast dit token, zodat je weet welke kant jouw aandeel op drijft? Een token kan elk technisch signaal doorstaan en toch een slechte aanhouding zijn als de supply gaat opblazen.",
        "Deze lens is bewust complementair aan wat de AI al meet. De hoofdstukken over trustlinesuggesties, Hoofdstuk 20 en Hoofdstuk 21, behandelen hoe de scan vier signalen per token scoort — liquiditeit, legitimiteit, trend en risico — op basis van aanwijzingen zoals de diepte van het orderboek, het aantal trustlines van een token, en vertrouwenssignalen van de uitgever zoals een aanwezige of ontbrekende stellar.toml, en hoe die verslechteringswaarschuwingen voor aangehouden tokens volgt over twaalf weken geschiedenis. Die signalen lezen het gedrag van de markt rond een token. Tokenomics leest het eigen monetaire ontwerp van het token, dat geen orderboekdiepte of trustlineaantal kan onthullen. Samen beantwoorden ze verschillende helften van één vraag: is dit asset zowel goed verhandeld als goed gestructureerd?",
        "Houd de eigen vangrails van de app in gedachten terwijl je dit doet. De scan voegt nooit automatisch een trustline toe of verwijdert die — de beslissing is altijd de jouwe — en een ontbrekende stellar.toml is een rode vlag juist omdat die de uitgeversmetadata verbergt die je zou gebruiken om de supply en de mintingbevoegdheid te verifiëren. Als je niet kunt vinden wie het token kan minten of hoeveel er ooit kan bestaan, behandel die ondoorzichtigheid dan zelf als een risicosignaal, en steun navenant op je risicofactoren voor positiegrootte en volatiliteit. Dit is educatieve begeleiding, geen financieel advies.",
      ],
      example:
        "De scan markeert een token met een sterke liquiditeitsdiepte en een gezond aantal trustlines — de AI-signalen staan op groen. Voordat je ervoor kiest, controleer je de tokenomics. De circulerende supply is 5 procent van de maximale supply, en de stellar.toml onthult dat de uitgever de volledige mintingbevoegdheid behoudt met een vrijgaveschema over drie jaar. De marktsignalen zeiden 'goed verhandeld', maar het supplyontwerp zegt 'zware verwatering op komst en mintingcontrole in één paar handen'. Je slaat de trustline over — niet omdat de AI ongelijk had, maar omdat een tweede, complementaire lens een risico opving dat de marktsignalen niet konden zien.",
    },
  ],
  quiz: [
    {
      id: "c31-q1",
      prompt: "Welke set factoren beschrijft het best wat 'tokenomics' omvat?",
      options: [
        {
          text: "De supply, uitgifte, verdeling en prikkels van het token.",
          explanation:
            "Juist. Tokenomics is de economie van een token — hoeveel eenheden er bestaan, hoe er nieuwe worden aangemaakt, wie ze aanhoudt, en wat het ontwerp beloont. Samen vertellen ze je of de prijs een schaars, breed verspreid asset weerspiegelt, of een overvloedig, geconcentreerd asset.",
        },
        {
          text: "Alleen de huidige marktprijs en de procentuele verandering over 24 uur.",
          explanation:
            "Te beperkt. Prijs en de recente verandering ervan zijn grafiekdata, geen tokenomics. Ze zeggen niets over hoeveel supply er bestaat of wie de uitgifte ervan controleert.",
        },
        {
          text: "De kleur van de candlesticks en de vorm van de volumebalken.",
          explanation:
            "Nee. Dat zijn aanwijzingen voor het lezen van de grafiek op de tokendetailpagina. Tokenomics gaat over het onderliggende monetaire ontwerp van het token, niet over het uiterlijk van de prijsgrafiek.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q2",
      prompt: "Een token heeft 50 miljoen tokens in omloop en een maximale supply van 500 miljoen. Waarom is dat verschil belangrijk voor jou als houder?",
      options: [
        {
          text: "Het maakt niet uit — alleen de circulerende supply beïnvloedt de prijs.",
          explanation:
            "Onjuist. Het verschil vertegenwoordigt 450 miljoen tokens die gepland staan om vrij te komen. Elke vrijgave voegt verkopers aan de markt toe, wat de prijs maandenlang kan drukken zelfs als de vraag stabiel blijft.",
        },
        {
          text: "De 450 miljoen niet-vrijgegeven tokens zijn toekomstige verwatering: naarmate ze vrijkomen, voegen ze verkopers toe en kunnen ze de prijs onder druk zetten.",
          explanation:
            "Juist. Net als een stad met 10.000 woningen maar een plan voor 100.000, concurreert de toekomstige uitbouw met wat er vandaag bestaat. Een klein circulerend deel van een grote maximale supply is een verwateringstegenwind die je moet meewegen voordat je koopt.",
        },
        {
          text: "Een grote maximale supply garandeert dat de prijs zal stijgen naarmate er meer tokens worden gemint.",
          explanation:
            "Andersom. Meer eenheden minten zonder bijbehorende vraag verwatert het aandeel van elke houder. Meer supply is tegenwind, geen garantie voor hogere prijzen.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c31-q3",
      prompt: "Token A handelt op 0,02 USDC met 8 miljard eenheden in omloop. Token B handelt op 45 USDC met 1 miljoen eenheden in omloop. Welk is het grotere asset qua market cap, en waarom?",
      options: [
        {
          text: "Token B, omdat de prijs per eenheid van 45 USDC veel hoger is dan die van A.",
          explanation:
            "Dit is precies de valkuil waar de les voor waarschuwt. Een hoge prijs per token betekent niet 'groter' — je moet de prijs vermenigvuldigen met de circulerende supply om de market cap te krijgen.",
        },
        {
          text: "Ze zijn even groot, omdat de market cap alleen van de prijs afhangt.",
          explanation:
            "Onjuist. Market cap is prijs maal circulerende supply, dus twee tokens met heel verschillende supplies hebben vrijwel nooit dezelfde cap, zelfs bij vergelijkbare prijzen.",
        },
        {
          text: "Token A, omdat 0,02 x 8 miljard = 160 miljoen USDC, tegenover B's 45 x 1 miljoen = 45 miljoen USDC.",
          explanation:
            "Juist. Market cap = prijs x circulerende supply. A's minieme vraagprijs verbergt een veel grotere verhandelbare pool. Een lage prijs per token is nooit automatisch 'goedkoop' totdat je de supply meerekent.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c31-q4",
      prompt: "Een uitgever mint 100.000 nieuwe tokens voor een beloningsprogramma, waardoor de supply verdubbelt van 100.000 naar 200.000. Je hield 1.000 tokens aan. Wat gebeurde er met je eigendomsaandeel?",
      options: [
        {
          text: "Je aandeel daalde van 1 procent naar 0,5 procent — de supply verdubbelde terwijl jouw aanhouding gelijk bleef.",
          explanation:
            "Juist. Minting is inflatie: je 1.000 tokens zijn onveranderd, maar ze vertegenwoordigen nu een half zo groot stuk van een verdubbelde taart. Tenzij de prijs steeg om nieuwe vraag te weerspiegelen, werd je relatieve belang verwaterd.",
        },
        {
          text: "Je aandeel bleef op 1 procent, omdat je nog steeds hetzelfde aantal tokens bezit.",
          explanation:
            "Onjuist. Hetzelfde aantal bezitten is niet hetzelfde als hetzelfde aandeel bezitten. Wanneer het totaal verdubbelt, dekt je vaste aanhouding een kleiner deel ervan.",
        },
        {
          text: "Je aandeel steeg, omdat meer tokens in omloop elke houder belangrijker maakt.",
          explanation:
            "Het tegenovergestelde is waar. Nieuwe minting verwatert bestaande houders — meer eenheden betekent dat elke eenheid, inclusief die van jou, een kleiner deel van het geheel vertegenwoordigt.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q5",
      prompt: "De AI-trustlinescan markeert een token met een sterke liquiditeitsdiepte en een hoog aantal trustlines. Hoe zou tokenomics in je beslissing moeten passen?",
      options: [
        {
          text: "De groene signalen van de AI zijn op zichzelf voldoende; tokenomics voegt niets nieuws toe.",
          explanation:
            "Onjuist. De vier signalen van de scan — liquiditeit, legitimiteit, trend en risico — lezen het gedrag van de markt rond een token. Ze kunnen het eigen supplyontwerp van het token niet zien, en dat is precies het gat dat tokenomics vult.",
        },
        {
          text: "Gebruik tokenomics als complementaire lens: controleer circulerende versus maximale supply, market cap, en minting of burning voordat je ervoor kiest.",
          explanation:
            "Juist. Zoals de Hoofdstukken 20 en 21 uitleggen, scoort de scan marktsignalen; tokenomics leest het monetaire ontwerp van het token. Een token kan elk technisch signaal doorstaan en toch een slechte aanhouding zijn als de supply gaat opblazen of de mintingbevoegdheid ondoorzichtig is.",
        },
        {
          text: "Negeer de AI volledig en laat de app de trustline automatisch toevoegen op basis van alleen de tokenomics.",
          explanation:
            "Op twee punten fout. De twee lenzen zijn complementair, geen rivalen — en de app voegt nooit automatisch een trustline toe. Er een toevoegen is altijd je eigen beslissing, gemaakt met een kleine XLM-reserve op het spel.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
