// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// ADVANCED hoofdstuk over liquiditeitspools en rendement: hoe AMM-pools werken en
// uitbetalen, het verborgen risico van impermanent loss, yield farming, Stellars
// poolvergoeding van 0,30% en wie die ontvangt, en wanneer liquiditeit leveren
// beter is dan een gewone eenmalige trade.
// This chapter owns no new glossary terms; it reuses terms taught earlier.
import type { Chapter } from "../../../types";

export const chapter32: Chapter & { whoFor: string } = {
  id: "c32",
  number: 32,
  level: "ADVANCED",
  whoFor: "Voor traders die poolrendement afwegen tegen het verborgen risico ervan",
  title: "Liquiditeitspools en rendement",
  description:
    "Hoe pools werken en uitbetalen, impermanent loss, yield farming, Stellars AMM-vergoeding van 0,30% en wanneer een pool beter is dan een gewone trade.",
  lessons: [
    {
      id: "c32-l1",
      title: "Wat is een liquiditeitspool en hoe verdien je eraan?",
      paragraphs: [
        "Een liquiditeitspool is een gedeelde on-chain reserve van twee assets waartegen traders automatisch swappen, zonder orderboek en zonder dat er een tegenpartij gevonden hoeft te worden. Op Stellar stort je beide kanten van een paar in, bijvoorbeeld XLM en USDC, in gelijke waarde, en in ruil daarvoor ontvang je poolaandelen die jouw stukje van de reserves vertegenwoordigen. Omdat een niet-oorspronkelijk token zoals USDC eerst een trustline nodig heeft, moet je al klaargezet zijn om beide assets aan te houden voordat je stort.",
        "Je verdient omdat elke swap die door de pool loopt een vergoeding van 0,30% betaalt, en die vergoeding wordt rechtstreeks weer aan de reserves toegevoegd. Jouw poolaandelen maken daardoor na verloop van tijd aanspraak op een groeiende hoeveelheid van de onderliggende assets: hoe meer je pool wordt gebruikt, hoe meer je aandelen waard zijn wanneer je uiteindelijk terugtrekt. Er is geen vaste rentevoet, je rendement is simpelweg je evenredige deel van de handelsvergoedingen die de pool int.",
        "Het hoofdstuk over geavanceerde Stellar-functies vergelijkt AMM-pools uitgebreid met het SDEX-orderboek. Kort gezegd laat het orderboek je een exacte limietprijs opgeven en wachten op een match, terwijl een AMM elke swap prijst volgens een formule tegen de huidige reserves en altijd meteen uitvoert. Liquiditeit leveren is het spiegelbeeld van traden: in plaats van een prijs te nemen, lever je de voorraad waartegen anderen handelen en int je daarvoor vergoedingen.",
      ],
      example:
        "Je stort 100 USDC en een gelijke waarde aan XLM in een XLM/USDC-pool die in totaal 10.000 USDC aan reserves aanhoudt. Je aandelen vertegenwoordigen 1% van de pool. Over een week verwerkt de pool 50.000 USDC aan swapvolume en int daarbij 150 USDC aan vergoedingen (0,30%). Jouw aandeel van 1% verdient daar ongeveer 1,50 USDC van, dat stilletjes doorgroeit in je reserves zonder dat je ook maar één order plaatst.",
    },
    {
      id: "c32-l2",
      title: "Wat is impermanent loss en waarom is het een verborgen risico?",
      paragraphs: [
        "Impermanent loss is het verschil tussen wat je gestorte assets waard zouden zijn geweest als je ze gewoon had aangehouden en wat ze waard zijn nadat ze in de pool hebben gezeten terwijl hun prijzen uit elkaar liepen. Een AMM herbalanceert je twee assets automatisch zodat hun waarden gelijk blijven: naarmate het ene asset stijgt, verkoopt de pool er wat van en koopt meer van het dalende asset bij. Dat is precies het tegenovergestelde van wat een houder wil, want je houdt uiteindelijk minder van de winnaar over en meer van de verliezer.",
        "Het verlies heet impermanent (tijdelijk) omdat het pas werkelijkheid wordt wanneer je terugtrekt. Als de twee prijzen terugkeren naar hun oorspronkelijke verhouding, sluit het verschil zich en houd je je vergoedingen schoon over. Maar als de divergentie blijvend is, is het verlies dat ook. Cruciaal is dat impermanent loss het grootst is bij volatiele, niet-gecorreleerde paren en het kleinst bij paren die elkaar volgen, en dat is waarom pools van stablecoin tegen stablecoin relatief veilig zijn.",
        "Dit is het verborgen risico omdat het poolsaldo er gezond kan uitzien terwijl je stilletjes slechter af bent dan een houder. De echte vraag is altijd of de vergoedingen die je hebt geïnd opwegen tegen de impermanent loss die je hebt geleden. Als het paar nauwelijks bewoog en het volume hoog was, winnen de vergoedingen; als het ene asset verdubbelde terwijl het andere vlak bleef, kan impermanent loss makkelijk een week aan vergoedingen opslokken.",
      ],
      example:
        "Je stort 100 USDC en 1.000 XLM wanneer XLM 0,10 USDC waard is, een gebalanceerde positie van 200 USDC. XLM verdubbelt vervolgens naar 0,20 USDC. De AMM heeft de hele weg omhoog XLM verkocht, dus je trekt ongeveer 707 XLM en 141 USDC terug, samen zo'n 283 USDC waard. Had je gewoon aangehouden, dan zouden je 100 USDC plus 1.000 XLM (nu 200 USDC) samen 300 USDC zijn. Dat tekort van 17 USDC is impermanent loss; als je vergoedingsinkomsten over die periode onder de 17 USDC lagen, kwam je slechter uit.",
    },
    {
      id: "c32-l3",
      title: "Wat is yield farming?",
      paragraphs: [
        "Yield farming is de praktijk waarbij je je liquiditeit actief tussen pools en protocollen verplaatst om het hoogste rendement na te jagen. In plaats van assets in één pool te parkeren en ze te vergeten, jaagt een farmer op pools met de beste combinatie van vergoedingsinkomsten en eventuele extra beloningen, en herverdeelt hij naarmate die kansen verschuiven. Op Stellars Soroban-platform voor slimme contracten voegen DeFi-protocollen zoals Blend, DeFindex en Soroswap leenrendementen en beloningstokens toe bovenop de gewone AMM-vergoedingen.",
        "De aantrekkingskracht zit erin dat de aangeprezen rendementen er veel hoger uit kunnen zien dan een simpel aandeel in de vergoedingen, omdat protocollen soms hun eigen tokens uitdelen om liquiditeit aan te trekken. De valkuil is dat die geadverteerde cijfers zelden het echte rendement zijn. Ze negeren doorgaans de impermanent loss, het prijsrisico van elk beloningstoken waarin je wordt uitbetaald, en het feit dat hoge rendementen meestal snel wegzakken zodra er liquiditeit binnenstroomt.",
        "Farming stapelt risico's op in plaats van ze weg te nemen: bugs in slimme contracten, pools met dunne liquiditeit, beloningstokens die instorten, en de simpele kosten van vaak herbalanceren. Het is een geavanceerde, hands-on activiteit, geen passief inkomen, en de opbrengsten zijn nooit gegarandeerd. Niets hiervan is financieel advies: behandel elk geadverteerd rendement als een beginvraag, niet als een belofte, en houd je posities beperkt tot wat je je kunt veroorloven te verliezen.",
      ],
      example:
        "Een nieuwe Soroswap-pool adverteert met een rendement van 40% op jaarbasis, grotendeels uitbetaald in zijn eigen beloningstoken. Een farmer verplaatst er liquiditeit naartoe, maar twee weken later verwatert een golf nieuwe storters de beloning, zakt het incentive-token 30%, en heeft de beweging van XLM tegen USDC impermanent loss toegevoegd. De kop van 40% wordt stilletjes een reëel rendement van een paar procent, nog voordat de vergoedingen zijn meegeteld die aan het in- en uitspringen zijn besteed.",
    },
    {
      id: "c32-l4",
      title: "Hoe werken AMM-vergoedingen op Stellar (0,30%) en wie ontvangt ze?",
      paragraphs: [
        "Elke swap die via een Stellar-liquiditeitspool wordt gerouteerd betaalt een vaste poolvergoeding van 0,30%, genomen van het inlegbedrag voordat de prijsformule draait. Dit staat los van de kleine netwerkkosten van ongeveer 0,00001 XLM die elke Stellar-transactie betaalt, en weer los van de kleine XLM-minimumreserve die elk account aanhoudt. Die 0,30% is wat het gebruik van de pool de swapper kost, en het verlaat de pool nooit.",
        "De vergoeding wordt niet geïnd door Stellar, door Atrium of door een centrale beheerder. Ze wordt rechtstreeks aan de reserves van de pool toegevoegd, waardoor de waarde van elk uitstaand poolaandeel stijgt. Dat betekent dat de liquiditeitsleveranciers ze ontvangen, naar evenredigheid: als je 5% van de aandelen bezit, verdien je in feite 5% van elke vergoeding die de pool int. Je verzilvert het pas wanneer je terugtrekt en merkt dat je aandelen nu inwisselbaar zijn voor meer assets dan je erin stopte.",
        "Omdat de vergoeding meeschaalt met het volume, hangt het werkelijke rendement voor leveranciers veel meer af van hoeveel handel er doorheen stroomt dan van de omvang van de pool. Een kleine, drukke pool kan meer opbrengen dan een grote, stilliggende. Wanneer je in het tabblad Handmatig handelen van Atrium swapt, kan een path payment via een van deze pools worden gerouteerd, en die 0,30% zit ingebakken in de effectieve prijs die je ziet naast je slippagetolerantie.",
      ],
      example:
        "Een pool houdt 200.000 USDC aan reserves aan en doet in een maand 400.000 USDC aan swapvolume, waarbij 1.200 USDC aan vergoedingen wordt geïnd (0,30%). Die vergoedingen voegen zich bij de reserves, dus de pool dekt nu dezelfde aandelen met 201.200 USDC aan assets. Een leverancier die 5% van de aandelen bezit ziet zijn inleg met ongeveer 60 USDC stijgen, zijn evenredige deel, uit te betalen wanneer hij terugtrekt.",
    },
    {
      id: "c32-l5",
      title: "Wanneer is een liquiditeitspool aantrekkelijker dan een gewone trade?",
      paragraphs: [
        "Een gewone trade is een eenmalige gerichte weddenschap: je koopt of verkoopt op de SDEX of via een AMM-swap, neemt een prijs, en klaar is het. Liquiditeit leveren is de tegenovergestelde houding: je bent neutraal over de richting en verhuurt in plaats daarvan je voorraad om een stroom vergoedingen te verdienen. Het hoofdstuk over geavanceerde Stellar-functies behandelt hoe AMM-prijsbepaling en orderboek-matching verschillen; de keuze hier gaat niet over welke plek beter prijst, maar of je wilt traden of tegen jou wilt laten traden.",
        "Een pool wordt aantrekkelijk wanneer je verwacht beide assets toch al aan te houden, wanneer het paar relatief stabiel of sterk gecorreleerd is, en wanneer het handelsvolume hoog genoeg is dat de vergoedingen comfortabel de impermanent loss verslaan. Stablecoin-paren zijn het klassieke geval: minieme divergentie, dus vrijwel geen impermanent loss, terwijl gestaag swapvolume de vergoedingen laat doorstromen. In die situatie verdienen je assets terwijl ze stilliggen, iets wat een gewone trade nooit kan.",
        "Een gewone trade wint wanneer je een echte gerichte visie hebt, wanneer het paar volatiel en niet-gecorreleerd is zodat impermanent loss zou toeslaan, of wanneer je netjes wilt uitstappen tegen een gekozen prijs, wat precies is wat een limietorder op de SDEX je geeft. De kernafweging is altijd rendement tegenover impermanent loss: een pool betaalt je om neutraal te blijven, en je zou die betaling alleen moeten accepteren wanneer de verwachte vergoedingen opwegen tegen de rem van de divergentie.",
      ],
      example:
        "Je houdt USDC en een tweede stablecoin in Circle-stijl aan en hebt over geen van beide een sterke visie. De een eenmalig voor de ander verhandelen levert je niets op buiten de spread. Ze beide in plaats daarvan in een stabiele pool storten laat ze de vergoeding van 0,30% verdienen op elke swap die erdoorheen loopt, met bijna nul impermanent loss omdat de twee prijzen nauwelijks bewegen. Hier verslaat de pool duidelijk de eenmalige trade. Ruil dat stabiele paar in voor een volatiele XLM/nieuwtoken-pool en de rekensom kan de andere kant op omslaan.",
    },
  ],
  quiz: [
    {
      id: "c32-q1",
      prompt: "Je stort XLM en USDC in een Stellar-liquiditeitspool. Waar komt je rendement eigenlijk vandaan?",
      options: [
        {
          text: "Een vaste rentevoet die Atrium betaalt omdat je je assets vastzet.",
          explanation:
            "Nee. Atrium betaalt geen rente en neemt geen poolvergoedingen in bewaring. Poolrendement is variabel en komt voort uit handelsactiviteit, niet uit een beloofde rentevoet.",
        },
        {
          text: "Je evenredige deel van de vergoeding van 0,30% die elke swap door de pool aan de reserves betaalt.",
          explanation:
            "Juist. Elke swap voegt een vergoeding van 0,30% toe aan de reserves van de pool, dus je poolaandelen zijn na verloop van tijd inwisselbaar voor meer assets. Je rendement is simpelweg jouw stukje van die vergoedingsstroom.",
        },
        {
          text: "De kleine netwerkkosten van ~0,00001 XLM die Stellar op elke transactie rekent.",
          explanation:
            "Fout. De netwerkkosten zijn een aparte protocolkost en stromen niet naar liquiditeitsleveranciers. Het rendement van leveranciers komt uit de poolvergoeding van 0,30%, niet uit de netwerkkosten.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q2",
      prompt: "Welke situatie levert de GROOTSTE impermanent loss op voor een liquiditeitsleverancier?",
      options: [
        {
          text: "Een pool van twee stablecoins waarvan de prijzen binnen een fractie van een procent van elkaar blijven.",
          explanation:
            "Nee. Gecorreleerde, vrijwel identieke prijzen lopen nauwelijks uit elkaar, dus de impermanent loss is minimaal. Juist daarom is dit het veiligste soort pool.",
        },
        {
          text: "Een volatiel, niet-gecorreleerd paar waarbij het ene asset verdubbelt terwijl het andere vlak blijft.",
          explanation:
            "Juist. Impermanent loss groeit met de divergentie tussen de twee assets. Een grote eenzijdige beweging is het slechtste geval, omdat de AMM de winnaar de hele weg omhoog heeft verkocht.",
        },
        {
          text: "Een pool waarvan beide assets met exact hetzelfde percentage stijgen.",
          explanation:
            "Fout. Als beide assets samen bewegen blijft hun verhouding onveranderd, dus is er in wezen geen impermanent loss; het is de divergentie, niet de richting, die het veroorzaakt.",
        },
        {
          text: "Een pool met zeer hoog swapvolume maar een stabiele prijsverhouding.",
          explanation:
            "Fout. Hoog volume betekent meer vergoedingen, en een stabiele verhouding betekent weinig divergentie; dat is een gunstige pool, geen bron van grote impermanent loss.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q3",
      prompt: "Een nieuwe Soroban-pool adverteert met een rendement van 40% op jaarbasis, grotendeels uitbetaald in zijn eigen beloningstoken. Waar moet een gevorderde trader van uitgaan?",
      options: [
        {
          text: "Die 40% is een betrouwbaar, gegarandeerd rendement dat je houdt.",
          explanation:
            "Nee. Geadverteerde farming-rendementen zijn zelden het echte rendement en zijn nooit gegarandeerd. Ze negeren doorgaans de impermanent loss en het prijsrisico van het beloningstoken.",
        },
        {
          text: "De kop negeert impermanent loss, het prijsrisico van het beloningstoken en het wegzakken van het rendement, dus het echte rendement ligt waarschijnlijk veel lager.",
          explanation:
            "Juist. Yield farming stapelt risico's op: verwatering naarmate er liquiditeit binnenstroomt, een beloningstoken dat kan dalen, impermanent loss en herbalanceringskosten. Behandel het cijfer als een vraag, niet als een belofte.",
        },
        {
          text: "Beloningstokens dragen geen prijsrisico omdat een protocol ze heeft uitgegeven.",
          explanation:
            "Fout. Het eigen token van een protocol kan scherp dalen, en incentive-tokens doen dat vaak zodra de uitgifte verwatert. Uitgegeven zijn door een protocol biedt geen prijsbescherming.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q4",
      prompt: "Wie ontvangt op Stellar uiteindelijk de poolvergoeding van 0,30% die op een swap wordt betaald?",
      options: [
        {
          text: "Atrium, als de app die de swap heeft gerouteerd.",
          explanation:
            "Nee. Atrium int geen poolvergoedingen. De 0,30% verlaat de pool nooit en gaat naar de mensen die de liquiditeit hebben geleverd.",
        },
        {
          text: "De validators van het Stellar-netwerk, naast de basisnetwerkkosten.",
          explanation:
            "Fout. Validators worden vergoed door de aparte netwerkkosten van ~0,00001 XLM, niet door de poolvergoeding van 0,30%, die in de pool blijft.",
        },
        {
          text: "De liquiditeitsleveranciers, naar evenredigheid, via reserves die rechtstreeks weer aan de pool worden toegevoegd.",
          explanation:
            "Juist. De vergoeding wordt aan de reserves van de pool toegevoegd, waardoor de waarde van elk aandeel stijgt. Leveranciers verzilveren hun evenredige deel wanneer ze meer assets terugtrekken dan ze stortten.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c32-q5",
      prompt: "Wanneer is liquiditeit leveren duidelijk aantrekkelijker dan een eenmalige SDEX-trade maken?",
      options: [
        {
          text: "Wanneer je een sterke gerichte visie hebt en tegen één exacte prijs wilt uitstappen.",
          explanation:
            "Nee. Dat is juist wanneer een gewone trade wint: een limietorder op de SDEX laat je je uitstapprijs opgeven. Een pool houdt je neutraal, wat tegen een gerichte visie ingaat.",
        },
        {
          text: "Wanneer je beide assets toch al zou aanhouden, het paar stabiel of gecorreleerd is, en het volume hoog genoeg is dat vergoedingen de impermanent loss verslaan.",
          explanation:
            "Juist. Een neutrale houding plus lage divergentie plus gestaag volume is de ideale combinatie: je assets verdienen de vergoeding van 0,30% terwijl ze stilliggen, iets wat een eenmalige trade nooit kan.",
        },
        {
          text: "Wanneer het paar zeer volatiel en niet-gecorreleerd is, zodat de prijzen sterk schommelen.",
          explanation:
            "Fout. Grote divergentie maximaliseert de impermanent loss, die je vergoedingen kan opslokken. Een volatiel, niet-gecorreleerd paar is gunstiger voor een gerichte trade, niet voor het leveren van liquiditeit.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
