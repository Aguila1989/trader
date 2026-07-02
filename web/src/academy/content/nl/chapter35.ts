// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Arbitrage en marktefficiëntie (EXPERT): wat arbitrage is, hoe Stellar
// path payments atomaire prijsverschil-capture mogelijk maken, waarom
// arbitrageurs spreads verkleinen en liquiditeit toevoegen, of MEV op Stellar
// bestaat, en hoe dit alles de SDEX- en AMM-prijzen vormt waartegen je in de
// app handelt. Bevat geen nieuwe glossariumtermen; hergebruikt de woordenschat
// uit eerdere hoofdstukken. Geschreven in exact dezelfde vorm als
// content/en/chapter22.ts, met de per-hoofdstuk `whoFor` one-liner
// getypeerd via een lokale intersectie zodat de live Chapter-interface
// ongemoeid blijft.
import type { Chapter } from "../../types";

export const chapter35: Chapter & { whoFor: string } = {
  id: "c35",
  number: 35,
  level: "EXPERT",
  whoFor: "Voor traders die de krachten willen begrijpen die prijzen eerlijk houden",
  title: "Arbitrage en marktefficiëntie",
  description:
    "Wat arbitrage is, hoe Stellar path payments prijsverschillen atomair laten opvangen, waarom arbitrageurs markten efficiënter maken, of MEV op Stellar bestaat, en hoe dit alles de prijzen vormt die je in deze app ziet.",
  lessons: [
    {
      id: "c35-l1",
      title: "Wat is arbitrage?",
      paragraphs: [
        "Arbitrage is het kopen van een asset waar het goedkoop is en het verkopen van datzelfde asset waar het duur is, waarbij je het verschil als winst opstrijkt. Denk aan een trader die opmerkt dat een bepaald merk koffie 2 USDC kost bij een discountsupermarkt en 3 USDC bij een luxe kruidenier aan de overkant. Kan die persoon inkopen bij de goedkope winkel en meteen doorverkopen aan de dure, dan houdt hij 1 USDC per zak over zonder enige mening over de vraag of koffie een goede langetermijnbelegging is. Hij gokt niet op een stijgende of dalende prijs; hij oogst het verschil tussen twee prijzen voor precies hetzelfde op precies hetzelfde moment.",
        "In crypto geldt dezelfde logica over verschillende handelsplaatsen heen. Precies hetzelfde asset — bijvoorbeeld XLM geprijsd in USDC — kan tegen licht verschillende koersen verhandeld worden op het SDEX-orderboek, binnen een AMM-liquiditeitspool en op een gecentraliseerde exchange elders. Zodra die genoteerde prijzen uit elkaar lopen, ontstaat er een prijsverschil, en het opvangen van dat verschil is arbitrage. Het bepalende kenmerk is dat beide benen naar dezelfde onderliggende waarde verwijzen, zodat de winst niet afhangt van of de markt in jouw voordeel beweegt; ze hangt alleen af van het feit dat de mismatch lang genoeg bestaat om ertegen te handelen.",
        "Twee eigenschappen maken echte arbitrage lastig. Ten eerste zijn de verschillen meestal minuscuul, vaak een fractie van een procent, omdat iedereen erop jaagt; de winst per eenheid is klein en pas de moeite waard bij omvang of snelheid. Ten tweede moeten de twee benen zo dicht mogelijk bij gelijktijdig liggen: koop je goedkoop maar beweegt de dure handelsplaats voordat je verkoopt, dan kan het verschil verdwijnen of omslaan en verandert je risicoloze trade in een gewone directionele gok. Daarom doen de mechanieken van uitvoering — settlementtijd, kosten en atomiciteit — er net zoveel toe als het opsporen van het verschil. Dit is educatief materiaal, geen financieel advies.",
      ],
      example:
        "Stel dat een AMM-pool XLM noteert op 0,1200 USDC terwijl het SDEX-orderboek openstaande biedingen heeft op 0,1210 USDC. Een arbitrageur koopt XLM uit de pool tegen 0,1200 en verkoopt het in het SDEX-bod tegen 0,1210, wat 0,0010 USDC per XLM oplevert vóór kosten. Op een trade van 10.000 XLM is dat 10 USDC bruto edge — dun, maar herhaalbaar en directioneel neutraal, want de winst kwam uit het verschil van 0,0010, niet uit enige mening over waar XLM naartoe gaat.",
    },
    {
      id: "c35-l2",
      title: "Hoe werkt arbitrage op Stellar via path payments?",
      paragraphs: [
        "Stellar heeft een ingebouwde functie die bijna op maat gemaakt lijkt voor arbitrage: de path payment. Zoals geïntroduceerd in het hoofdstuk over geavanceerde Stellar-functies, zet een path payment het ene asset om in het andere door in één enkele operatie door een keten van markten te hoppen — bijvoorbeeld XLM naar USDC naar yXLM en terug naar XLM — waarbij elke hop wordt gevuld tegen de best beschikbare SDEX-orderboeken en AMM-liquiditeitspools onderweg. Het hele pad wordt ofwel als één geheel voltooid, ofwel mislukt het en wordt teruggedraaid; er bestaat geen toestand waarin je half omgezet achterblijft. Die alles-of-niets-eigenschap heet atomiciteit, en het is precies wat een arbitrageur nodig heeft om het eerder beschreven been-risico te elimineren.",
        "Voor arbitrage is de krachtige variant een path payment die begint en eindigt in hetzelfde asset. Je stuurt bijvoorbeeld 1.000 XLM langs een route die meerdere markten aandoet en geeft aan dat je minstens 1.001 XLM terug moet ontvangen; als de marktprijzen rond de lus niet tot een winst optellen, mislukt de operatie simpelweg en heb je alleen de triviale netwerkkost verloren (~0,00001 XLM). Het protocol van Stellar zoekt zelfs naar een gunstig pad over de orderboeken en pools die het kent. Omdat de hele lus in één ledger-close wordt afgewikkeld, kan het prijsverschil dat je opmerkte niet tussen de benen tegen je in bewegen — de klassieke nachtmerrie van de arbitrageur, dat het tweede been wegglipt, is structureel onmogelijk.",
        "Het mechanisme is een circulaire omzetting: geld stroomt naar buiten in het ene asset, ketst terug door tussenliggende orderboeken en AMM-pools met 0,30% kosten, en keert terug in hetzelfde asset met een netto overschot. De trader specificeert een strikt minimum ontvangen bedrag (onder de motorkap een sendMax- en bestemmingsbedrag-beperking), zodat de ledger de winstgevendheidsdrempel afdwingt. De concurrentie is fel en edges worden snel gesloten, dus succesvolle arbitrage op Stellar draait grotendeels om het sneller dan rivalen detecteren van vluchtige cross-venue-mismatches en die uitdrukken als één atomair pad voordat de volgende ledger sluit.",
      ],
      example:
        "Een arbitragebot houdt Horizon in de gaten en merkt op dat de XLM/USDC-AMM-pool even goedkoop is ten opzichte van de yXLM/USDC- en yXLM/XLM-orderboeken. Hij dient één path payment in: stuur 1.000 XLM, route XLM naar USDC (pool), USDC naar yXLM (orderboek), yXLM naar XLM (orderboek), bestemmingsminimum 1.000,6 XLM. Vult elke hop tegen de verwachte koersen, dan levert de lus meer XLM op dan er verstuurd is en houdt de bot het overschot; is een hop al bewogen, dan mislukt de bestemmingsminimum-controle, wordt de hele operatie teruggedraaid en is enkel de kleine basiskost uitgegeven.",
    },
    {
      id: "c35-l3",
      title: "Wat doen arbitrageurs voor de markt? Waarom zijn ze nuttig?",
      paragraphs: [
        "Hoewel arbitrageurs puur voor eigen winst handelen, is het neveneffect van hun activiteit een eerlijkere, bruikbaardere markt voor iedereen. Telkens als een arbitrageur koopt van de goedkope handelsplaats en verkoopt aan de dure, duwt hij de goedkope prijs omhoog en de dure omlaag. Verspreid over duizenden minuscule trades trekt dit de prijs van hetzelfde asset overal waar het verhandeld wordt naar bijna-gelijkheid. Zonder hen zouden de SDEX, de AMM-pools en externe exchanges routinematig van elkaar verschillen, en zou een naïeve trader onbewust kunnen handelen tegen een verouderde, niet-marktconforme koers.",
        "Dit prijs-uitlijningswerk verkleint ook de spreads en voegt effectieve liquiditeit toe. Een arbitrageur die klaarstaat om elke pool te kopen die onder de reële waarde zakt en elk boek te verkopen dat erboven piekt, biedt in de praktijk diepte: zijn bereidheid om het verschil te verhandelen betekent dat grote orders de prijs minder verplaatsen, omdat er altijd iemand tegen de verkeerde prijs in leunt. De bid-ask-spread — de afstand tussen de beste koop en de beste verkoop — versmalt omdat arbitrage de makkelijke winst uit een breed verschil weghaalt, en een smallere spread is een directe kostenbesparing voor gewone traders.",
        "De economische naam voor de eindtoestand waar ze naartoe duwen is marktefficiëntie: een markt waarin prijzen snel alle beschikbare informatie weerspiegelen en waar voor de hand liggende, risicoloze winstkansen bijna even snel worden weggeconcurreerd als ze verschijnen. Geen enkele markt is perfect efficiënt, en vluchtige verschillen bestaan altijd, maar arbitrage is het mechanisme dat de imperfectie klein houdt. Hoe gezonder en meer omstreden de arbitrage, hoe kleiner en kortlevender de verkeerde prijzen, en daarom blijven diepe, liquide paren vastgepind op de reële waarde terwijl dunne, verwaarloosde tokens veel verder kunnen afdrijven voordat iemand de moeite neemt ze te corrigeren. In die zin zijn arbitrageurs de onbetaalde conciërges van het prijssysteem — uit eigenbelang, maar wél de handelsplaats waarop je vertrouwt consistent en eerlijk geprijsd houdend, en hun afwezigheid is op zich een waarschuwingssignaal dat een markt illiquide of lastig te verhandelen is.",
      ],
      example:
        "Stel je voor dat de XLM/USDC-AMM-pool wegzakt tot 0,1180 USDC terwijl elk orderboek en elke externe exchange nog steeds rond 0,1210 handelt. Arbitrageurs gieten kooporders in de goedkope pool en tillen die op, en verkopen de verworven XLM in de hogere boeken en drukken die omlaag, totdat de pool weer convergeert naar ongeveer 0,1205 — binnen een fractie van een procent van overal elders. Een trader die de app midden in het voorval opende en simpelweg de poolprijs nam, zou te veel hebben betaald om te verkopen; de correctie van de arbitrageurs is wat de volgende trader beschermt tegen die verouderde notering.",
    },
    {
      id: "c35-l4",
      title: "Wat is MEV (Maximal Extractable Value) en bestaat het op Stellar?",
      paragraphs: [
        "MEV, of Maximal Extractable Value, is de winst die degene die de volgorde van transacties in een blok bepaalt kan onttrekken door transacties in te voegen, te herordenen of te censureren. Op veel blockchains kunnen blokproducenten (of de searchers die bij hen bieden) een openstaande transactie in de publieke mempool zien en erop inspelen: front-running (voor een bekende koop springen om van de prijsimpact te profiteren), back-running (er direct achteraan gaan om het resulterende verschil op te vangen), of de sandwichaanval (net vóór en net na de grote order van een slachtoffer kopen en verkopen). Deze waarde wordt onttrokken ten koste van gewone gebruikers, die slechtere fills krijgen dan de markt hen anders zou geven.",
        "De architectuur van Stellar maakt klassieke MEV wezenlijk lastiger dan op een typische single-leader proof-of-work- of proof-of-stake-keten. Consensus wordt bereikt via het Stellar Consensus Protocol (SCP), een Federated Byzantine Agreement waarin nodes het via overlappende quorumsets eens worden over een transactieset in plaats van dat één miner de blokvolgorde eenzijdig kiest. Ledgers sluiten snel (enkele seconden) en er is geen lucratieve gasprijs-veiling: transacties dragen een kleine, min of meer vlakke kost, en wanneer een ledger boven capaciteit zit gebruikt Stellar surge pricing met gerandomiseerde selectie onder transacties met dezelfde kost in plaats van een strikte hoogste-bieder-wint-volgorde. Er is geen langlevende publieke mempool die een searcher kan afgrazen zoals die van Ethereum wordt afgegraasd, wat een groot deel van het front-running-oppervlak wegneemt.",
        "MEV is op Stellar echter beperkt, niet uitgeschakeld. Wie Horizon observeert kan nog steeds uitgezonden transacties zien en racen om een concurrerende path payment in dezelfde ledger in te dienen; deterministische tie-breaking binnen een transactieset kan bestudeerd en aan de marge bespeeld worden; en de komst van Soroban-smart-contracts (met DeFi-protocollen zoals Blend, Soroswap en DeFindex) herintroduceert rijkere, samenstelbare state waarin volgorde meer kan uitmaken, zodat het onttrekbare oppervlak groeit naarmate on-chain DeFi groeit. De eerlijke samenvatting is dat het kostenmodel van Stellar en de op SCP gebaseerde, quorum-gedreven ordening de meest roofzuchtige MEV-patronen die elders voorkomen afvlakken, maar elke publieke ledger met gedeelde liquiditeit laat wat ordeningswaarde op tafel liggen.",
      ],
      example:
        "Op een mempool-gedreven keten kan een searcher die je openstaande grote XLM-koop ziet er een sandwich omheen leggen: net vóór jou kopen om de prijs op te drijven, jouw order tegen de opgeblazen koers laten uitvoeren, en er meteen daarna verkopen — jij krijgt een slechtere fill en zij strijken het verschil op. Op Stellar heeft dezelfde searcher geen blijvende publieke mempool om uit te sniperen, sluiten ledgers in seconden, en worden transacties met dezelfde kost geselecteerd zonder een pure hoogste-bod-veiling, dus die schone sandwich is veel moeilijker te landen — maar een snelle bot die een concurrerende path payment de eerstvolgende ledger-close in racet, is nog steeds een reële, zij het smallere, vorm van onttrekking.",
    },
    {
      id: "c35-l5",
      title: "Hoe beïnvloedt arbitrage de prijzen die je in deze app ziet?",
      paragraphs: [
        "Elke prijs die deze app je toont is stroomafwaarts van arbitrage. Wanneer het tabblad Handmatig handelen een JIJ VERKOOPT / JIJ KOOPT koers noteert, of de tokendetailpagina candlesticks tekent met tabbladen voor uur, dag, week en jaar, dan komen die getallen uit live SDEX-orderboeken en AMM-pools die arbitrageurs voortdurend surveilleren. Omdat ze de poolprijs, de orderboekprijs en de prijzen van externe exchanges strak uitgelijnd houden, is de koers waartegen je handelt in feite een marktkoers in plaats van een verouderde of gemanipuleerde. Je profiteert van hun werk zonder het ooit te zien gebeuren.",
        "Dit betekent ook dat de app je zelden een verdacht goede prijs aanbiedt, en dat is een kenmerk, geen teleurstelling. Als de SDEX of een AMM-pool XLM even ver onder de waarde overal elders zou tonen, zouden arbitrageurs dat verschil al hebben weggehandeld — meestal binnen een ledger of twee — voordat jouw order het kon bereiken. Praktisch vertelt het je dat je, wanneer je een limietorder of een instelbare slippagetolerantie op een marktorder zet, moet ijken tegen de heersende efficiënte prijs, want proberen om betekenisvol beter te vullen dan de uitgelijnde markt is proberen dezelfde bots voorbij te racen die het verschil hebben uitgewist. Wanneer de AI-analist een trade voorstelt met een betrouwbaarheidsscore, gaan de verwachte fills uit van diezelfde competitieve, door arbitrage strak getrokken prijsstelling.",
        "Er is een keerzijde die het waard is om te internaliseren. Arbitrage verkleint spreads en lijnt handelsplaatsen uit, maar het verwijdert niet de kosten die in een trade ingebakken zitten: de 0,30% AMM-poolkost, de orderboekspread op dunne paren, netwerkkosten en je eigen slippagetolerantie gelden allemaal nog steeds, en op tokens met lage liquiditeit kan de uitgelijnde prijs nog steeds ver liggen van waar je daadwerkelijk op omvang zou kunnen uitstappen. Efficiënt betekent niet gratis of oneindig diep. De prijs in de app lezen als een eerlijke, door arbitrage onderhouden momentopname — terwijl je kosten, diepte en slippage respecteert — is het realistische mentale model. Niets hiervan is beleggingsadvies; het is een beschrijving van hoe het leidingwerk achter je noteringen zich gedraagt.",
      ],
      example:
        "Je opent de tokendetailpagina voor een liquide paar en ziet XLM op 0,1207 USDC, zowel op de grafiek als in het JIJ VERKOOPT-formulier. Die overeenstemming is geen geluk: arbitragebots hebben de AMM-pool, het SDEX-boek en externe handelsplaatsen al tot op een fractie van een procent met elkaar verzoend, zodat de app je alleen de echte marktkoers kan tonen. Zet je vervolgens een limietverkoop op 0,1240 in de hoop de markt te verslaan, dan wordt die misschien simpelweg nooit gevuld — je zou vragen om te verkopen boven de prijs die de arbitrageurs als reëel hebben vastgepind, en dezelfde concurrentie die de spread verkleinde is precies wat die optimistische fill tegenhoudt.",
    },
  ],
  quiz: [
    {
      id: "c35-q1",
      prompt: "Wat definieert een arbitragetrade het nauwkeurigst?",
      options: [
        {
          text: "Een asset kopen waarvan je verwacht dat het de komende weken in waarde stijgt.",
          explanation:
            "Dat is directionele speculatie, geen arbitrage. Arbitrage hangt niet af van een toekomstige prijsbeweging; het vangt een verschil op dat nú tussen handelsplaatsen bestaat voor hetzelfde asset.",
        },
        {
          text: "Een asset lange tijd aanhouden om netwerkbeloningen te verdienen.",
          explanation:
            "Dat beschrijft rendement of staking-achtig inkomen, geen arbitrage. Arbitrage draait om het uitbuiten van een momentane cross-venue-prijsmismatch, niet om aanhouden voor beloningen.",
        },
        {
          text: "Hetzelfde asset kopen waar het goedkoop is en verkopen waar het duur is op vrijwel hetzelfde moment, waarbij je het prijsverschil opvangt.",
          explanation:
            "Juist. Arbitrage oogst een prijsverschil voor het identieke asset over handelsplaatsen heen, met bijna-gelijktijdige benen zodat de winst directioneel neutraal is in plaats van een gok op de richting van de markt.",
        },
        {
          text: "Bewust op de top van een prijspiek kopen omdat het momentum sterk is.",
          explanation:
            "Dat is momentum najagen en draagt volledig directioneel risico. Arbitrage is het tegenovergestelde: het zoekt een risico-geminimaliseerd verschil tussen twee prijzen voor hetzelfde, geen directionele instap.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q2",
      prompt: "Waarom is een Stellar path payment die begint en eindigt in hetzelfde asset zo'n natuurlijk instrument voor arbitrage?",
      options: [
        {
          text: "Omdat het je een asset laat omzetten zonder ooit enige netwerkkost te betalen.",
          explanation:
            "Onjuist. Een path payment betaalt nog steeds de kleine basisnetwerkkost (~0,00001 XLM). De waarde ervan voor arbitrage is atomaire multi-hop-omzetting, niet het vermijden van kosten.",
        },
        {
          text: "Omdat het in één atomaire operatie door meerdere orderboeken en pools hopt, zodat de operatie wordt teruggedraaid als de lus niet winstgevend is en je alleen de triviale kost verliest.",
          explanation:
            "Juist. De alles-of-niets-lus, met een strikt minimum ontvangen bedrag, betekent dat het prijsverschil niet tussen de benen kan wegglippen — atomiciteit verwijdert het been-risico dat handmatige arbitrage teistert.",
        },
        {
          text: "Omdat het garandeert dat de prijs na verzending in jouw voordeel zal bewegen.",
          explanation:
            "Onjuist. Niets garandeert een gunstige beweging. Het punt is juist dat een path payment in hetzelfde asset er geen nodig heeft — hij vult de vooraf berekende winstgevende lus atomair, of wordt teruggedraaid.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c35-q3",
      prompt: "Welke uitspraak vat het best samen wat arbitrageurs voor de bredere markt doen?",
      options: [
        {
          text: "Ze lijnen de prijs van hetzelfde asset uit over de SDEX, AMM-pools en externe exchanges, verkleinen spreads en voegen effectieve liquiditeit toe — richting marktefficiëntie.",
          explanation:
            "Juist. Goedkope handelsplaatsen kopen en dure verkopen trekt prijzen naar uitlijning, versmalt bid-ask-spreads en laat grote orders de prijs minder verplaatsen, wat precies is wat marktefficiëntie beschrijft.",
        },
        {
          text: "Ze verbreden spreads en trekken de prijzen van handelsplaatsen uit elkaar, waardoor de markt minder voorspelbaar wordt.",
          explanation:
            "Dit is het omgekeerde van de werkelijkheid. Arbitrage versmalt spreads en trekt prijzen naar elkaar; het is de corrigerende kracht tegen divergentie, niet de oorzaak ervan.",
        },
        {
          text: "Ze bestaan alleen om prijzen te manipuleren en schaden altijd gewone traders.",
          explanation:
            "Onjuist. Arbitrageurs handelen voor eigen winst, maar het neveneffect is consistentere, eerlijk geprijsde handelsplaatsen; ze beschermen gewone traders tegen verouderde, niet-marktconforme noteringen in plaats van ze te schaden.",
        },
        {
          text: "Ze verwijderen alle handelskosten, zodat gewone traders niets betalen om te handelen.",
          explanation:
            "Onjuist. Arbitrage verkleint spreads maar verwijdert nooit de 0,30% AMM-poolkost, de orderboekspread op dunne paren, netwerkkosten of je eigen slippage; efficiënt is niet hetzelfde als gratis.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c35-q4",
      prompt: "Hoe beïnvloedt het ontwerp van Stellar MEV (Maximal Extractable Value) vergeleken met een typische mempool-gedreven keten?",
      options: [
        {
          text: "Stellar elimineert MEV volledig, dus er is helemaal geen op volgorde gebaseerde onttrekking mogelijk.",
          explanation:
            "Overdreven. Stellar vlakt de ergste patronen af, maar waarnemers kunnen nog steeds concurrerende path payments dezelfde ledger in racen en Soroban-DeFi vergroot het onttrekbare oppervlak — MEV is beperkt, niet geëlimineerd.",
        },
        {
          text: "Stellar heeft meer MEV dan andere ketens omdat het een permanente publieke mempool-veiling draait zoals Ethereum.",
          explanation:
            "Onjuist. Stellar draait geen mempool-veiling in Ethereum-stijl op basis van gasprijs; het ontbreken van een langlevende publieke mempool is juist waarom klassieke front-running daar lastiger is.",
        },
        {
          text: "Stellar maakt klassieke MEV lastiger — SCP quorum-gebaseerde ordening, snelle ledgers, geen langlevende publieke mempool, en gerandomiseerde selectie bij gelijke kost in plaats van een pure gasveiling — maar verwijdert het niet volledig.",
          explanation:
            "Juist. De Federated Byzantine Agreement van het Stellar Consensus Protocol, min of meer vlakke kosten met surge-priced gerandomiseerde selectie, en de afwezigheid van een afgraasbare mempool vlakken front-running en sandwiching af, maar er blijft altijd wat ordeningswaarde over op een publieke ledger.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q5",
      prompt: "Je zet een limietverkoop voor XLM ruim boven de prijs die de app momenteel toont op een liquide paar. Gezien hoe arbitrage prijzen vormt, wat moet je verwachten?",
      options: [
        {
          text: "Hij wordt vrijwel zeker onmiddellijk gevuld, want arbitrage garandeert dat prijzen stijgen om elke limietorder te ontmoeten.",
          explanation:
            "Onjuist. Arbitrage lijnt prijzen uit naar de reële waarde; het duwt ze niet omhoog om jouw optimistische order te bevredigen. Een verkoop ver boven de uitgelijnde markt blijft simpelweg ongevuld staan.",
        },
        {
          text: "Hij wordt misschien nooit gevuld, want arbitrageurs hebben de prijs al rond de reële waarde over handelsplaatsen heen vastgepind, dus vragen om ruim daarboven te verkopen is proberen dezelfde bots voorbij te racen die het verschil sloten.",
          explanation:
            "Juist. Op een liquide paar zijn de SDEX, de pools en externe exchanges strak uitgelijnd door arbitrage, dus een fill betekenisvol boven die efficiënte prijs is precies wat de competitieve markt verhindert.",
        },
        {
          text: "De app past de marktprijs stiekem omhoog aan zodat jouw order tegen je doelkoers wordt gevuld.",
          explanation:
            "Onjuist. De app toont live SDEX- en AMM-prijzen die door externe arbitrage worden onderhouden; hij verplaatst de markt niet, en kan dat ook niet, om een individuele limietorder te bevredigen.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
