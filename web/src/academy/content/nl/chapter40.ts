// Hoofdstuk 40: Algemene marktstructuur-educatie. Een ADVANCED hoofdstuk over
// concepten die voor crypto-markten in het algemeen gelden (niet aan één
// specifiek platform of product gebonden): orderboeken vs AMM's, makers vs
// takers, spread en slippage, perpetual futures en funding rates, en waarom
// uitvoeringskosten bepalen of een dunne statistische edge daadwerkelijk
// standhoudt. Uitsluitend publiek-schaal content — geen enkele vermelding van
// een specifieke operating mode, provider of interne feature; het leert de
// concepten die een trader nodig heeft om over eender welke exchange na te denken.
import type { Chapter } from "../../types";

export const chapter40: Chapter & { whoFor: string } = {
  id: "c40",
  number: 40,
  level: "ADVANCED",
  whoFor: "Voor iedereen die wil begrijpen hoe crypto-exchanges écht werken onder de motorkap",
  title: "Marktstructuur: orderboeken, AMM's en uitvoeringskosten",
  description:
    "Orderboeken versus AMM's, makers versus takers, spread en slippage, perpetual futures en funding rates, en waarom uitvoeringskosten bepalen of een edge het overleeft.",
  lessons: [
    {
      id: "c40-l1",
      title: "Twee manieren waarop een markt trades organiseert: het orderboek en de AMM",
      paragraphs: [
        "Elke handelsplaats moet hetzelfde probleem oplossen: iemand die wil kopen koppelen aan iemand die wil verkopen, tegen een prijs die beide partijen aanvaarden. Er zijn twee dominante ontwerpen om dat te doen, en bijna elke exchange die je ooit zult gebruiken, op welke keten dan ook, is op één van beide gebouwd.",
        "Het eerste is het orderboek, ook wel een central limit order book of CLOB genoemd. Het is een levende, gerangschikte lijst van openstaande aanbiedingen: iedereen die wil kopen noemt een prijs en een omvang, iedereen die wil verkopen doet hetzelfde, en de handelsplaats matcht ze zodra een koop- en verkoopprijs elkaar kruisen. Je hebt er vrijwel zeker al één gezien — het is die klassieke stapel groene koopprijzen en rode verkoopprijzen op het handelsscherm van eender welke exchange. Een orderboek werkt alleen als er aan de andere kant iemand bereid is te handelen tegen (of dicht bij) jouw prijs; is er niemand die aanbiedt in de buurt van waar jij wilt handelen, dan blijft je order gewoon onvervuld liggen.",
        "Het tweede is de automated market maker, of AMM. In plaats van individuele mensen te matchen, houdt een AMM een gedeelde pool van twee assets aan en prijst elke trade via een formule op basis van hoeveel van elk asset er op dat moment in de pool zit. Er is geen tegenpartij te vinden — je handelt altijd tegen de pool zelf, en de pool geeft altijd een prijs, zelfs voor een paar waarin uren niemand heeft gehandeld. De keerzijde is dat een grote trade merkbaar de eigen prijs van de pool verschuift (dit heet price impact), omdat je de verhouding van assets verandert waarop de formule prijst.",
        "Geen van beide ontwerpen is simpelweg beter dan het andere — ze passen bij verschillende situaties. Een orderboek geeft precieze controle (je kunt een exacte prijs noemen en wachten) en biedt doorgaans scherpere prijzen op actief verhandelde paren waar veel mensen quoteren. Een AMM garandeert dat je altijd iets kunt verhandelen, meteen, zelfs op een obscuur paar, ten koste van het feit dat die trade de prijs meer beweegt naarmate hij groter wordt. Weten tegen welke van de twee je handelt, verandert hoe je moet denken over de prijs die je krijgt voorgeschoteld.",
      ],
      example:
        "Stel dat je een bekend paar zoals ETH/USDC wilt verhandelen. Op een orderboek-exchange zie je een ladder van openstaande koop- en verkooporders en jouw trade vult tegen wat daarvan het beste is. Op een AMM-gebaseerde exchange is er helemaal geen ladder om naar te kijken — je ziet gewoon een genoteerde prijs berekend uit de huidige reserves van de pool, en een kleine trade beweegt die nauwelijks terwijl een heel grote dat zichtbaar wél doet, omdat de trade zelf de verhouding verschuift waarop de formule prijst.",
    },
    {
      id: "c40-l2",
      title: "Makers en takers: wie levert liquiditeit, en wie betaalt ervoor",
      paragraphs: [
        "Op een orderboek-exchange valt elke trader voor een gegeven trade in één van twee rollen, en dat onderscheid is belangrijk omdat het meestal bepaalt wat je aan kosten betaalt. Een maker plaatst een order die niet meteen vult — hij blijft op het boek liggen, voegt een zichtbare prijs toe waartegen iemand anders kan handelen, en levert daarmee in feite liquiditeit voor anderen om te gebruiken. Een taker plaatst een order die meteen vult tegen een order die al op het boek ligt — hij verbruikt de liquiditeit die de maker leverde en neemt de prijs die op dat moment werd aangeboden, in plaats van op zijn eigen prijs te wachten.",
        "Omdat makers degenen zijn die het boek van prijzen voorzien om tegen te handelen, belonen de meeste exchanges dat gedrag: makerkosten liggen doorgaans lager dan takerkosten, en op sommige platformen krijgen makers zelfs een kleine rebate om openstaande orders te plaatsen, gefinancierd uit de hogere kost die van takers wordt genomen. De logica is eenvoudig — een handelsplaats met een dun, leeg orderboek is onaantrekkelijk om op te handelen, dus exchanges hebben er rechtstreeks belang bij om mensen te betalen zodat het boek gevuld blijft met openstaande koersen.",
        "Hetzelfde maker/taker-onderscheid duikt ook op in een AMM-context, alleen onder andere namen: een liquidity provider stort assets in de pool (de AMM-versie van een maker, die de reserves levert waartegen iedereen handelt) en verdient een deel van elke handelskost die de pool int, terwijl iedereen die tegen de pool swapt (de taker) die kost betaalt als prijs voor onmiddellijke uitvoering.",
        "Dit onderscheid is de moeite waard om te onthouden telkens als je een order plaatst, op welke handelsplaats dan ook: een limietorder die blijft liggen en wacht, gedraagt zich als een makerorder, meestal goedkoper, maar zonder garantie dat hij ooit vult; een marktorder die neemt wat er op dat moment beschikbaar is, gedraagt zich als een takerorder, meestal wat duurder, maar vult meteen.",
      ],
      example:
        "Twee traders willen op hetzelfde moment hetzelfde asset kopen. De eerste plaatst een limietorder net onder de huidige marktprijs en wacht — die blijft als makerorder op het boek liggen, met de lagere makerkost, maar vult alleen als de prijs daadwerkelijk zakt om hem te ontmoeten. De tweede plaatst meteen een marktorder en neemt wat er op dat moment aan verkooporders openstaat — die vult onmiddellijk, betaalt de hogere takerkost, en krijgt de prijs die die openstaande orders aanboden, wat mogelijk iets slechter is dan de geduldige limietprijs van de eerste trader.",
    },
    {
      id: "c40-l3",
      title: "Spread en slippage: de twee kosten die zich in elke trade verstoppen",
      paragraphs: [
        "De spread is de kloof tussen de beste prijs waartegen iemand nu wil kopen en de beste prijs waartegen iemand nu wil verkopen, op een orderboek. Een krappe spread (koop- en verkoopprijs dicht bij elkaar) betekent dat de markt liquide is en druk verhandeld wordt; een brede spread betekent dat minder mensen actief quoteren, dus is er een grotere ingebakken kost om enkel al van de ene naar de andere kant over te steken. Zelfs een trade die meteen vult tegen de beste beschikbare prijs betaalt deze kost nog steeds — het is het verschil tussen waar je op datzelfde moment zou kunnen verkopen en waar je zou kunnen kopen.",
        "Slippage is anders: het is de kloof tussen de prijs die je verwachtte toen je een trade plaatste en de prijs die je daadwerkelijk kreeg toen hij vulde. Het gebeurt zodra je order groot genoeg is, of de markt snel genoeg beweegt, zodat het vullen ervan meer opeet dan enkel de allerbeste prijs die werd aangeboden — een grote marktorder kan een deel van zichzelf vullen tegen de beste prijs, dan meer tegen een iets slechtere, enzovoort, tot de hele omvang gevuld is. Op een AMM is slippage in wezen hetzelfde idee, uitgedrukt via de prijsformule: hoe groter jouw trade ten opzichte van de pool, hoe meer de prijs van de pool tegen je in beweegt tegen de tijd dat je trade klaar is.",
        "Beide kosten groeien met twee dingen: hoe groot jouw trade is ten opzichte van de beschikbare liquiditeit, en hoe dun het asset over het algemeen verhandeld wordt. Een kleine trade in een druk verhandeld paar raakt beide kosten nauwelijks; dezelfde ordergrootte in een illiquide, zelden verhandeld paar kan merkbaar meer kosten, puur door spread en slippage, nog vóór er ook maar één exchangekost wordt toegepast.",
        "De meeste exchanges laten je een maximale slippagetolerantie instellen op een trade — de grootste kloof tussen verwachte en werkelijke prijs die je bereid bent te accepteren, voordat de trade wordt geweigerd in plaats van uitgevoerd. Dit bestaat om je te beschermen: zonder die tolerantie zou een plotselinge uitbarsting van volatiliteit tussen het plaatsen van een order en het vullen ervan je kunnen laten uitvoeren tegen een dramatisch slechtere prijs dan je bedoelde.",
      ],
      example:
        "Stel je een dun verhandeld token voor waar het beste bod op 0,098 staat en het beste laat op 0,102 — een brede spread van 4% enkel om het boek over te steken. Je plaatst een marktorder om een grote hoeveelheid te kopen: hij vult een deel van de omvang tegen 0,102, maar daar ligt niet genoeg klaar, dus de rest vult tegen 0,104, dan 0,107, voor een gemiddelde vulprijs ruim boven de 0,102 die je eerst genoteerd zag. Die kloof tussen de 0,102 die je verwachtte en het gemiddelde van ongeveer 0,105 dat je daadwerkelijk betaalde, is slippage, bovenop de spread die je al betaalde enkel door taker te zijn.",
    },
    {
      id: "c40-l4",
      title: "Perpetual futures en funding rates",
      paragraphs: [
        "Een perpetual future (vaak afgekort tot \"perp\") is een derivatencontract waarmee je een gehefboomde, directionele weddenschap op de prijs van een asset kunt aangaan zonder ooit het onderliggende asset zelf te bezitten. In tegenstelling tot een traditioneel futures-contract heeft een perp geen vervaldatum — hij kan in principe voor onbepaalde tijd worden aangehouden — en precies dat maakt hem \"perpetual\", en waarom hij een van de meest verhandelde instrumenttypes in crypto is geworden.",
        "Omdat een perp nooit afloopt en nooit afgewikkeld wordt, hebben exchanges een mechanisme nodig om zijn prijs strak bij de werkelijke spotprijs van het onderliggende asset te houden — anders zouden de twee eindeloos uit elkaar kunnen drijven zonder iets dat ze weer bij elkaar trekt. Dat mechanisme is de funding rate: een periodieke betaling die rechtstreeks wordt uitgewisseld tussen traders met longposities (die op een stijgende prijs wedden) en traders met shortposities (die op een dalende prijs wedden), berekend op basis van hoever de prijs van de perp is afgeweken van de spotprijs.",
        "De richting van de fundingbetaling vertelt je naar welke kant de menigte overhelt. Wanneer de perp boven de spotprijs handelt (meer vraag om long te gaan dan short), betalen longs aan shorts — een kost voor het aanhouden van een longpositie die sommige longs aanzet om te sluiten en sommige shorts om te openen, waardoor de perpprijs weer terug naar de spotprijs wordt getrokken. Wanneer de perp onder de spotprijs handelt, keert de betaling om: shorts betalen aan longs, wat de prijs weer omhoog duwt. Funding is geen kost die naar de exchange gaat; het is een rechtstreekse overdracht tussen de twee kanten van de markt, en daarom kan het af en toe een echte bron van rendement zijn (aan de kant staan die funding int) in plaats van enkel een kost.",
        "Funding rates worden meestal per periode genoteerd (vaak elk uur of elke acht uur) en kunnen zwaaien van licht positief naar scherp negatief, afhankelijk van hoe eenzijdig het marktsentiment geworden is. Een aanhoudend grote funding rate is zelf informatie: het signaleert dat één kant van de trade overvol geraakt is, en overvolle posities gaan vaak vooraf aan een scherpe beweging zodra die overspannen posities gedwongen worden gesloten.",
      ],
      example:
        "Stel je voor dat een perpetual future op een asset merkbaar boven zijn spotprijs handelt omdat veel meer traders long willen zijn dan short. Elk fundinginterval betalen de longs samen een klein percentage van hun positiewaarde aan de shorts. Ben je long en houd je die positie aan doorheen veel fundingintervallen terwijl de markt zo eenzijdig blijft, dan kan die gestage druppel fundingbetalingen het rendement van je positie stilletjes uithollen, zelfs terwijl de prijs zelf vlak blijft — een kost die niets te maken heeft met spread of slippage, maar alles met aan welke kant van een overvolle trade jij staat.",
    },
    {
      id: "c40-l5",
      title: "Waarom uitvoeringskosten bepalen of een dunne edge standhoudt",
      paragraphs: [
        "Een trading-\"edge\" is een statistische neiging — een patroon dat, gemiddeld genomen, de ene kant van een trade iets waarschijnlijker winstgevend maakt dan de andere. Bijna elke edge die de moeite waard is om te verhandelen, is dun: een paar basispunten (honderdsten van een procent) verwacht voordeel per trade, geen dramatische misprijzing. Precies die dunheid is waarom uitvoeringskosten veel meer uitmaken dan ze op het eerste gezicht lijken.",
        "Elke trade die je maakt betaalt een combinatie van spread, slippage en exchangekosten (maker of taker), plus — op een perp — mogelijke fundingdruk als je aanhoudt doorheen ongunstige periodes. Geen van deze kosten kijkt ernaar of jouw onderliggende edge echt is; ze worden bij elke trade in rekening gebracht, of je nu wint of verliest. Is jouw edge gemiddeld 10 basispunten waard per trade, maar kosten spread plus slippage plus fees je 8 basispunten telkens als je erop handelt, dan heb je geen edge van 10 basispunten binnengehaald — je hebt er 2 binnengehaald, en één ongelukkige trade met slechtere-dan-gewoonlijk slippage kan dat volledig wegvagen.",
        "Daarom kan dezelfde onderliggende statistische edge oprecht winstgevend zijn op een diepe, liquide, goedkope handelsplaats en een oprechte verliezer op een dunne, breed-gespreide, dure, ook al is het patroon in de prijsdata op beide plaatsen identiek. De edge bestaat niet in een vacuüm — hij bestaat binnen een specifieke kostenstructuur, en die kostenstructuur wordt bepaald door hoe liquide de markt is, hoe breed de spread loopt, hoeveel slippage een gegeven ordergrootte veroorzaakt, en aan welke kant van maker/taker jij terechtkomt.",
        "De praktische les is om de edge van een strategie altijd te beoordelen na aftrek van realistische uitvoeringskosten, niet tegenover de nette middenprijs die een grafiek je toont. Een backtest die spread, slippage en fees negeert, zal systematisch overschatten hoe goed een strategie oogt, omdat hij een prijs meet waartegen niemand daadwerkelijk had kunnen handelen. De omvang van de echte edge, gemeten tegenover de reële handelskosten op de daadwerkelijke handelsplaats en ordergrootte die je van plan bent te gebruiken, is wat uiteindelijk bepaalt of een idee überhaupt de moeite waard is om op te handelen.",
      ],
      example:
        "Stel dat onderzoek een patroon toont dat gemiddeld 12 basispunten per trade winstgevend is, gemeten op de middenprijs. Op een diepe, krap-gespreide markt waar kosten voor een heen-en-terugtrip ongeveer 3 basispunten belopen, overleeft die edge ruimschoots, en blijft er zo'n 9 basispunten reële verwachte winst per trade over. Voer precies hetzelfde patroon uit op een dunne markt waar alleen al de spread 15 basispunten heen-en-terug opeet, en diezelfde statistische edge is nu een verliezer nog vóór je slippage meetelt — het patroon in de prijsdata is nooit veranderd, alleen de kost om ernaar te handelen wel.",
    },
  ],
  quiz: [
    {
      id: "c40-q1",
      prompt: "Wat is het belangrijkste structurele verschil tussen een orderboek-exchange (CLOB) en een AMM?",
      options: [
        {
          text: "Een orderboek matcht individuele koop- en verkooporders tegen prijzen die mensen noemen; een AMM prijst elke trade via een formule tegen een gedeelde pool van reserves, zonder individuele tegenpartij om tegen te matchen.",
          explanation:
            "Juist. Een orderboek heeft een matchende tegenpartij nodig op jouw prijs; een AMM noteert altijd een prijs uit zijn pool via een formule, ten koste van het feit dat grotere trades die prijs meer bewegen.",
        },
        {
          text: "Een orderboek bestaat alleen op gecentraliseerde exchanges, terwijl AMM's alleen op gedecentraliseerde bestaan.",
          explanation:
            "Onjuist. Zowel orderboeken als AMM's komen voor op gecentraliseerde en gedecentraliseerde platformen — het onderscheid gaat over hoe trades gematcht en geprijsd worden, niet over custody of het type platform.",
        },
        {
          text: "Een AMM garandeert altijd een betere prijs dan een orderboek.",
          explanation:
            "Onjuist. Geen van beide ontwerpen is inherent beter geprijsd — een orderboek kan scherpere prijzen bieden op actief gequoteerde paren, terwijl een AMM garandeert dat je altijd kunt handelen, ten koste van price impact bij grotere trades.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q2",
      prompt: "Waarom rekenen de meeste orderboek-exchanges makers lagere kosten aan (of betalen ze zelfs een rebate) vergeleken met takers?",
      options: [
        {
          text: "Makers plaatsen openstaande orders die het boek van liquiditeit voorzien voor anderen om tegen te handelen, en een dun, leeg boek is onaantrekkelijk om op te handelen — dus hebben exchanges er belang bij het gedrag te belonen dat het gevuld houdt.",
          explanation:
            "Juist. Makers voegen diepte toe aan het boek door te wachten; takers verbruiken die diepte meteen. Makers belonen houdt het boek liquide, wat de exchange én elke trader erop ten goede komt.",
        },
        {
          text: "Makers zijn grote institutionele traders en takers zijn altijd kleine particuliere traders.",
          explanation:
            "Onjuist. Maker en taker zijn rollen die bepaald worden door of een order op het boek blijft liggen of meteen vult — iedereen, particulier of institutioneel, kan beide zijn, afhankelijk van het ordertype dat gebruikt wordt.",
        },
        {
          text: "Takerkosten zijn eigenlijk altijd lager, omdat takers openstaande orders sneller helpen matchen.",
          explanation:
            "Onjuist. Meestal is het net omgekeerd — makers betalen doorgaans lagere kosten (soms zelfs een rebate) omdat zij de liquiditeit leveren, terwijl takers meer betalen voor het gemak van een onmiddellijke vulling.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q3",
      prompt: "Wat is het verschil tussen spread en slippage?",
      options: [
        {
          text: "Spread is de kloof tussen de beste huidige koop- en verkoopprijs op het boek op dit moment; slippage is de kloof tussen de prijs die je verwachtte bij het plaatsen van een trade en de prijs die je daadwerkelijk kreeg toen hij vulde.",
          explanation:
            "Juist. Spread bestaat zelfs bij een onmiddellijke, kleine trade tegen de beste prijs. Slippage duikt op wanneer je trade groot genoeg is of de markt snel genoeg beweegt zodat de vulling meer dan enkel de ene beste prijs opeet.",
        },
        {
          text: "Het zijn twee namen voor precies dezelfde kost, en exchanges gebruiken gewoon welke term ook past bij hun marketing.",
          explanation:
            "Onjuist. Het zijn afzonderlijke kosten die allebei een trade opeten — spread is een ingebakken kloof op het boek, slippage is de extra kost van een vulling die door meerdere prijsniveaus loopt of van een AMM-formule die tijdens de trade verschuift.",
        },
        {
          text: "Spread geldt alleen voor AMM's en slippage alleen voor orderboeken.",
          explanation:
            "Onjuist. Spread is het meest zichtbaar op orderboeken, maar beide concepten gelden voor beide ontwerpen — de door price impact gedreven verslechtering van een AMM-vulling is functioneel hetzelfde idee als slippage op een orderboek.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q4",
      prompt: "Wat bepaalt eigenlijk de richting van de fundingbetaling van een perpetual future?",
      options: [
        {
          text: "Hoever de prijs van de perp is afgeweken van de onderliggende spotprijs — longs betalen aan shorts wanneer de perp boven de spotprijs handelt, en shorts betalen aan longs wanneer hij eronder handelt.",
          explanation:
            "Juist. Funding is het mechanisme dat de prijs van een nooit-vervallende perp terug richting de spotprijs trekt, rechtstreeks betaald tussen de overvolle kant en de andere kant van de markt.",
        },
        {
          text: "De exchange bepaalt de fundingrichting op basis van hoeveel kostinkomsten ze die periode wil innen.",
          explanation:
            "Onjuist. Funding is een overdracht tussen traders, geen kost die de exchange int — de richting ervan wordt bepaald door hoe de prijs van de perp zich verhoudt tot de spotprijs, niet door inkomstendoelen van de exchange.",
        },
        {
          text: "Funding stroomt altijd van shorts naar longs, ongeacht de prijs, als compensatie voor het risico van short gaan.",
          explanation:
            "Onjuist. De fundingrichting ligt niet vast — hij keert om, afhankelijk van of de perp op dat moment boven of onder de onderliggende spotprijs handelt.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q5",
      prompt: "Een patroon in de prijsdata toont een gemiddelde edge van 12 basispunten per trade op de middenprijs. Waarom zou datzelfde patroon in de praktijk toch geld kunnen verliezen?",
      options: [
        {
          text: "Omdat spread, slippage en kosten bij elke trade in rekening worden gebracht, ongeacht of het onderliggende patroon echt is, en als die kosten de edge overtreffen, is de strategie netto een verliezer, ook al is het middenprijs-patroon oprecht.",
          explanation:
            "Juist. Een dunne statistische edge is pas echte winst zodra realistische uitvoeringskosten zijn afgetrokken — hetzelfde patroon kan winstgevend zijn op een goedkope handelsplaats en een verliezer op een dure.",
        },
        {
          text: "Omdat een oprechte middenprijs-edge altijd volledig gerealiseerd wordt ongeacht handelskosten — kosten spelen alleen mee bij edges die nooit echt waren.",
          explanation:
            "Onjuist. Zelfs een oprecht middenprijs-patroon kan volledig worden weggevaagd door uitvoeringskosten; de omvang van de echte, verhandelbare edge is altijd de middenprijs-edge min realistische spread, slippage en kosten.",
        },
        {
          text: "Omdat middenprijs-edges een mythe zijn en geen enkel op die manier gemeten patroon ooit verhandelbaar is.",
          explanation:
            "Onjuist. Middenprijs-patronen kunnen oprecht voorspellend zijn — het punt is dat of ze winstgevend zijn om daadwerkelijk te verhandelen, volledig afhangt van de uitvoeringskosten van de handelsplaats en ordergrootte waarop je handelt.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
