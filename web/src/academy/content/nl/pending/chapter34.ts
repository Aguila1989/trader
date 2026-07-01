// PENDING — do not activate until green light.
// EXPERT chapter on smart contracts and Soroban, Stellar's Rust/WASM
// smart-contract platform: what a contract is, how it differs from a classic
// operation, its risks, and DeFi composability via Blend, DeFindex and
// Soroswap. Authored to the exact same shape as content/en/chapter22.ts, with
// the per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms taught in earlier chapters.
import type { Chapter } from "../../../types";

export const chapter34: Chapter & { whoFor: string } = {
  id: "c34",
  number: 34,
  level: "EXPERT",
  whoFor: "Voor traders die de programmeerbare, on-chain grens van Stellar willen verkennen",
  title: "Smart contracts en Soroban op Stellar",
  description:
    "Wat een smart contract is, wat Soroban voor Stellar verandert, hoe het verschilt van een gewone transactie, welke risico's het kent, en hoe het via Blend, DeFindex en Soroswap samengesteld wordt tot DeFi.",
  lessons: [
    {
      id: "c34-l1",
      title: "Wat is een smart contract?",
      paragraphs: [
        "Het duidelijkste mentale beeld van een smart contract is een frisdrankautomaat. Je stopt een munt in de gleuf, drukt op de knop voor het drankje dat je wilt, en de automaat geeft het je, automatisch, zonder kassier, en alleen als je betaling de prijs dekt. Hij is niet over te halen om je een gratis drankje te geven, en hij kan ook niet besluiten je geld te houden en niets terug te geven. De regels zitten ingebakken in de automaat, en ze worden elke keer op precies dezelfde manier uitgevoerd zodra aan de voorwaarden is voldaan.",
        "Een smart contract is die frisdrankautomaat, geschreven als code en uitgerold op een blockchain. Technisch gezien is het een programma dat on-chain is opgeslagen en waarvan de logica deterministisch draait op elke validerende node. Deterministisch betekent dat dezelfde invoer altijd dezelfde uitvoer en dezelfde toestandswijzigingen oplevert, ongeacht welke computer het uitvoert, een keiharde eis, want duizenden onafhankelijke validators moeten tot identieke resultaten komen om het eens te worden over het grootboek. Wanneer je een contract aanroept, vraag je geen persoon om iets te doen; je zet overeengekomen code in gang die zijn eigen voorwaarden afdwingt en de uitkomst rechtstreeks op het grootboek afwikkelt.",
        "Twee eigenschappen maken dit krachtig voor een trader. Ten eerste is de code openbaar en is het gedrag ervan verifieerbaar: iedereen kan lezen wat een contract zal doen voordat hij ermee in aanraking komt. Ten tweede is de uitvoering, zodra aan de voorwaarden is voldaan, gegarandeerd en kan een tegenpartij die niet selectief terugdraaien, er is geen loketbediende die van gedachten kan veranderen. Dat is de belofte achter gedecentraliseerde financiën: financiële afspraken die zichzelf uitvoeren, transparant, zonder een vertrouwde tussenpersoon die je geld vasthoudt.",
        "De keerzijde is dat een smart contract precies doet wat zijn code zegt, niet meer en niet minder. Hij heeft geen oordeelsvermogen en geen goede wil. Zit er een fout in de code, dan wordt die fout net zo trouw uitgevoerd als de bedoelde logica. Daarom is het lezen, controleren en begrijpen van een contract veel belangrijker dan het vertrouwen op een merk of een vriendelijk ogende interface.",
      ],
      example:
        "Een eenvoudig escrow-contract codeert: \"Als wallet A 100 USDC stuurt en wallet B het afgesproken asset levert vóór bloktijd T, geef dan de USDC vrij aan B; anders betaal A terug na T.\" Er houdt geen escrow-agent het geld vast. Het contract vergrendelt de middelen, bewaakt de voorwaarde en wikkelt automatisch af, de frisdrankautomaat-logica, toegepast op een trade in plaats van op een frisdrankje.",
    },
    {
      id: "c34-l2",
      title: "Wat is Soroban en wat verandert het voor Stellar?",
      paragraphs: [
        "Het grootste deel van zijn bestaan was Stellar bewust niet programmeerbaar in de algemene zin. Het leverde een vast menu van ingebouwde operaties, betalingen, offers op de SDEX, trustlines, path payments, die snel, goedkoop en voorspelbaar zijn, maar je kon alleen de operaties combineren die Stellar al aanbood. Je kon geen eigen on-chain logica schrijven. Soroban is wat dat verandert. Het is het smart-contractplatform van Stellar: een runtime waarmee ontwikkelaars willekeurige programma's op het netwerk kunnen uitrollen, naast de klassieke operaties die je al in Atrium gebruikt.",
        "Onder de motorkap zijn Soroban-contracten geschreven in Rust en gecompileerd naar WebAssembly (WASM). WASM is een compact, draagbaar bytecodeformaat dat draait binnen een strak afgeschermde virtuele machine, zodat een contract niet buiten zijn toegestane grenzen kan reiken en de rest van het systeem kan raken. Rust werd gekozen om zijn sterke veiligheidsgaranties en zijn volwassen WASM-gereedschap; de combinatie geeft het netwerk een manier om onvertrouwde code van derden uit te voeren zonder dat die code het grootboek kan destabiliseren. Contracten worden gemeten, zodat elke rekenstap en elke byte opslag een kost heeft, en dat is wat de uitvoering begrensd houdt en denial-of-service-aanvallen duur maakt.",
        "Wat Soroban toevoegt is programmeerbaarheid voorbij het klassieke menu: leenmarkten, geautomatiseerde vaults, eigen AMM's, opties, en andere logica die simpelweg geen plek had in de ingebouwde operaties van Stellar. Cruciaal is dat Soroban is ontworpen om samen te leven met het bestaande accountmodel en de bestaande assets. Een Soroban-contract kan dezelfde USDC en XLM aanhouden en verplaatsen die jij al verhandelt, zodat de snelle, goedkope klassieke betaalrails en de nieuwe programmeerbare laag op één grootboek leven in plaats van in twee losstaande werelden.",
        "Voor jou als trader is de praktische verschuiving dat Stellar een plek wordt waar DeFi-protocollen gebouwd kunnen worden, en niet louter een snel afwikkelingsnetwerk. Dat opent werkelijk nieuwe mogelijkheden, rendement verdienen, lenen tegen onderpand, swaps routeren door programmeerbare pools. Het vergroot ook het risico-oppervlak, want interactie met een Soroban-protocol betekent dat je code van derden vertrouwt, niet alleen de door de strijd geharde kernoperaties van Stellar. De volgende lessen pluizen precies dat verschil uit.",
      ],
      example:
        "Een klassieke Stellar-swap gebruikt de ingebouwde path-payment-operatie om te springen over de SDEX en de AMM-pools die Stellar zelf aanbiedt, je kunt niet veranderen hoe die routering werkt. Een Soroswap-swap daarentegen roept een Soroban-contract aan: door ontwikkelaars geschreven WASM-code die zijn eigen pool-wiskunde en fee-logica uitvoert. Dezelfde onderliggende USDC en XLM, maar de tweede draait op programmeerbare code die op het netwerk is uitgerold, in plaats van op een vaste ingebouwde operatie.",
    },
    {
      id: "c34-l3",
      title: "Hoe verschilt een smart contract van een gewone transactie?",
      paragraphs: [
        "Een gewone Stellar-transactie is een bundel ingebouwde operaties, gekozen uit een vaste set: een betaling, een manage-offer op de SDEX, een change-trust om een trustline toe te voegen, een path payment. Elke operatie heeft vooraf gedefinieerde semantiek die de kern van Stellar voor iedereen op identieke wijze afdwingt. Je kiest uit een menu dat het netwerk al begrijpt, en validators weten vooraf precies wat elke operatie wel en niet kan doen. Deze voorspelbaarheid is waarom klassieke operaties goedkoop, snel en uiterst goed begrepen zijn.",
        "Een smart contract aanroepen is fundamenteel anders: in plaats van een bekende operatie te kiezen, roep je willekeurige logica aan die een ontwikkelaar heeft geschreven en uitgerold. Die logica kan zijn eigen persistente toestand on-chain bijhouden, saldi, posities, configuratie, prijsdata, en die toestand lezen en muteren als onderdeel van de aanroep. Een klassieke betaling verplaatst gewoon waarde tussen twee accounts; een contractaanroep kan lussen doorlopen, vertakken op voorwaarden, zijn eigen opslag bijwerken en zelfs andere contracten aanroepen, allemaal binnen één atomaire transactie die ofwel volledig slaagt ofwel volledig terugdraait.",
        "Beide werelden delen dezelfde niet-onderhandelbare eigenschap: determinisme. Of je nu een gewone betaling verstuurt of een complexe vault aanroept, elke validator moet tot hetzelfde resultaat komen, want de consensus van Stellar, SCP, het Stellar Consensus Protocol, een Federated Byzantine Agreement gebouwd op quorumsets, vereist dat nodes byte voor byte akkoord gaan over het nieuwe grootboek. Contracten kunnen daarom geen niet-deterministische dingen doen, zoals een willekeurig getal uit het besturingssysteem lezen of een live netwerkverzoek doen; externe gegevens moeten als expliciete invoer worden aangeleverd.",
        "Twee Soroban-specifieke mechanismen zijn hier van belang. Ten eerste de fees: een klassieke operatie kost een minuscule, bijna vaste netwerk-fee (fracties van een cent in XLM), terwijl een contractaanroep wordt gemeten naar de middelen die hij verbruikt, CPU-instructies, geheugen en opslag, zodat een zware aanroep meer kost dan een lichte. Ten tweede de footprint: een Soroban-transactie moet vooraf precies aangeven welke stukken grootboektoestand (welke opslagsleutels) ze zal lezen en schrijven. Dankzij deze expliciete footprint kunnen validators alleen de relevante toestand ophalen en vergrendelen en contracten veilig parallel uitvoeren, maar het betekent ook dat een aanroep die onverwachte toestand raakt, faalt in plaats van stilletjes uit te dijen.",
      ],
      example:
        "XLM verkopen voor USDC op het tabblad Handmatig handelen dient doorgaans een klassieke manage-offer- of path-payment-operatie in: één bekende operatie, een vaste minuscule fee, geen eigen toestand. Diezelfde USDC storten in een Blend-leenpool roept een Soroban-contract aan: het werkt de opgeslagen saldi van de pool bij, laat rente aangroeien tegen zijn eigen toestand, moet de opslagvermeldingen die het zal raken als footprint aangeven, en krijgt een middelengemeten fee aangerekend. Hetzelfde asset, twee heel verschillende uitvoeringsmodellen.",
    },
    {
      id: "c34-l4",
      title: "Wat zijn de risico's van smart contracts?",
      paragraphs: [
        "Het bepalende risico van smart contracts volgt rechtstreeks uit hun grootste kracht. Omdat de code deterministisch wordt uitgevoerd en de afwikkeling definitief is, wordt een bug uitgevoerd met dezelfde zekerheid als correcte logica. Er is geen supportbalie om een foutieve overdracht terug te draaien, en geen chargeback. \"Code is wet\" snijdt aan twee kanten: het contract eert een eerlijke afspraak zonder tussenpersoon, en het eert net zo trouw een verborgen achterdeurtje of een rekenfout die het leeghaalt.",
        "De dreigingen vallen in een paar categorieën uiteen. Bugs zijn eerlijke vergissingen, een verkeerd behandeld randgeval, een afrondingsfout, een foutieve prijsberekening, die een aanvaller kan uitbuiten om meer op te nemen dan zou mogen. Exploits zijn opzettelijke aanvallen die kleine zwakheden aaneenrijgen tot een groot verlies; omdat contracten samenstelbaar zijn en elkaar aanroepen, kan een fout in het ene protocol doorsijpelen naar andere die het vertrouwen. Rug pulls zijn kwaadaardig van ontwerp: het contract bevat bevoorrechte functies, een owner-sleutel die opnames kan pauzeren, onbeperkt tokens kan aanmaken of de pool kan leegtrekken, zodat de \"trustless\" façade een schakelaar verbergt die de maker op elk moment kan overhalen. Dit is waar de AI-trustlinescanning die je elders in de Academy misschien hebt gelezen relevant is: een ontbrekende stellar.toml of dunne, niet-verifieerbare uitgeversmetadata is een rood vlaggetje voor de assetlaag, en diezelfde argwaan geldt voor de contracten waarop het ecosysteem van een asset steunt.",
        "De echte verdedigingen zijn permissies en audits. Lees wie het contract beheert: is het eigenaarschap afgestaan of ligt het bij één enkele sleutel? Kan een of andere bevoorrechte functie je geld verplaatsen, en zit die macht achter een timelock of een multisignature-opzet, in plaats van in de wallet van één persoon? Een professionele beveiligingsaudit, een onafhankelijke controle van de code door specialisten, verkleint het risico maar sluit het nooit uit; ongeauditeerde code verdient diep wantrouwen, en zelfs geauditeerde code heeft gefaald. Geef de voorkeur aan contracten waarvan de broncode is geverifieerd tegen de uitgerolde WASM, zodat de code die je leest aantoonbaar de code is die draait.",
        "Behandel in de praktijk elke smart-contractinteractie als tegenpartijrisico in een nieuwe vorm. Kies je posities zo groot dat een totaal verlies van een bepaald protocol niet catastrofaal zou zijn, geef de voorkeur aan gevestigde contracten met een lange, ongeschonden staat van dienst en reële, in de loop van de tijd vergrendelde waarde, en besef dat rendement dat ver boven de markt oogt meestal een vergoeding is voor risico dat je niet volledig hebt geïdentificeerd. Niets hiervan is financieel advies, het is dezelfde discipline die een zorgvuldige trader al toepast, uitgebreid met het feit dat je tegenpartij hier autonome code is.",
      ],
      example:
        "Een vault-contract adverteert een hoog rendement en duizenden gebruikers storten USDC. Diep in de code zit een owner-only \"emergency withdraw\"-functie zonder timelock. Op een dag roept de uitroller die aan en veegt elke storting naar zijn eigen wallet in één enkele, onomkeerbare, volkomen geldige transactie. Er werd niets gehackt, het contract deed precies wat zijn code altijd al toestond. Het lezen van de permissies vóór het storten had dat ene punt van falen blootgelegd.",
    },
    {
      id: "c34-l5",
      title: "Hoe verruimt samenstelbaarheid op Stellar de DeFi-mogelijkheden?",
      paragraphs: [
        "Samenstelbaarheid is de eigenschap dat on-chain protocollen elkaar kunnen aanroepen en zich als bouwstenen kunnen opstapelen, omdat ze hetzelfde grootboek, dezelfde assets en publieke interfaces delen. Een contract kan een positie aanhouden in een tweede contract, dat op zijn beurt routeert door een derde, allemaal binnen één atomaire transactie die ofwel volledig voltooit ofwel volledig terugdraait. Daarom wordt DeFi vaak omschreven als \"money legos\": elk protocol is een stukje, en ontwikkelaars zetten stukjes samen tot gedrag dat geen van hen alleen levert. Op Soroban stromen dezelfde USDC en XLM vrij tussen contracten, zodat de stukjes echt in elkaar grijpen in plaats van in geïsoleerde silo's te leven.",
        "Soroswap is de AMM- en DEX-laag, de basale swap-primitieve. Het implementeert liquiditeitspools en, belangrijk, aggregatie en routering over verschillende plaatsen, zodat een trade opgesplitst en verspringend kan worden om de beste uitvoering te vinden. Omdat het een nette swap-interface blootstelt, kunnen andere contracten Soroswap aanroepen om het ene asset midden in een transactie in een ander om te zetten, in plaats van een gebruiker te dwingen eerst handmatig te swappen. Het is het stukje dat de vraag \"zet asset X nu meteen om in asset Y, on-chain\" beantwoordt.",
        "Blend is de leen- en ontleenlaag. Het draait geïsoleerde leenpools waar aanbieders assets storten om rente te verdienen en leners onderpand plaatsen om leningen op te nemen, met rentevoeten die algoritmisch worden gestuurd door de benuttingsgraad van de pool. Blend stelt zich op een heel concrete manier samen met een swap-laag: liquidaties. Wanneer het onderpand van een lener onder de vereiste verhouding zakt, moet een liquidator de schuld terugbetalen en het onderpand innemen, en het kan de benodigde assets binnen diezelfde stroom aanschaffen of afstoten via een DEX zoals Soroswap. Lenen op zichzelf is nuttig; lenen dat atomair een swap-plaats kan bereiken, is robuust.",
        "DeFindex is de strategie- en vaultlaag die er bovenop zit. Een vault is een contract dat je storting aanvaardt en vervolgens een geautomatiseerde strategie uitvoert over de onderliggende protocollen, bijvoorbeeld toeleveren aan een Blend-pool voor rendement en herbalanceren via Soroswap, zodat een gebruiker één eenvoudige storten-en-verdienen-interface krijgt terwijl de complexiteit eronder draait. Dit is samenstelbaarheid zichtbaar gemaakt: DeFindex bouwt op Blend, Blend leunt op een DEX voor liquidaties, en de DEX (Soroswap) is zelf gewoon nog een bouwsteen. Het voordeel is enorme flexibiliteit en kapitaalefficiëntie; de nuchtere tegenhanger is dat gestapelde afhankelijkheden risico stapelen, want een falen in een willekeurige lagere bouwsteen kan omhoog doorwerken in alles wat erop gebouwd is, en dat is precies waarom de audit-en-permissiediscipline uit de vorige les het meest telt daar waar protocollen zich samenstellen. Niets hiervan is financieel, fiscaal of juridisch advies; DeFi-rendementen en de fiscale behandeling ervan verschillen per rechtsgebied.",
      ],
      example:
        "Je stort USDC in een DeFindex-vault en ontvangt een vault-aandelentoken. Onder de motorkap levert de vault je USDC toe aan een Blend-leenpool om rente te verdienen; als een deel van de strategie een ander asset nodig heeft, routeert het de omzetting via Soroswap, allemaal automatisch. Drie onafhankelijke protocollen werken samen in één storting, en jij hebt slechts met één eenvoudige knop te maken. Die stapel is samenstelbaarheid, en het gemak ervan berust op het vertrouwen in elke laag eronder.",
    },
  ],
  quiz: [
    {
      id: "c34-q1",
      prompt: "Welke essentiële eigenschap van een smart contract vangt de frisdrankautomaat-analogie?",
      options: [
        {
          text: "Het dwingt zijn regels automatisch af en wikkelt de uitkomst af zodra aan de voorwaarden is voldaan, zonder dat een tussenpersoon het kan overrulen.",
          explanation:
            "Juist. Net als een frisdrankautomaat die alleen levert bij betaling, draait een contract zijn overeengekomen logica deterministisch on-chain en wikkelt het rechtstreeks op het grootboek af, geen loketbediende kan besluiten je geld te houden of een gratis drankje uit te delen.",
        },
        {
          text: "Een vertrouwde beheerder controleert elke interactie en keurt die handmatig goed of draait die terug.",
          explanation:
            "Fout, en het tegenovergestelde van de kern. Het hele idee is dat er geen beheerder tussen zit; de code zelf dwingt de voorwaarden af zonder menselijke goedkeuring of terugdraaiing.",
        },
        {
          text: "Het gedrag verandert afhankelijk van welke node het uitvoert, zodat de resultaten tussen validators verschillen.",
          explanation:
            "Fout. Contracten moeten deterministisch zijn, identieke invoer levert identieke resultaten op elke node op, juist zodat alle validators het eens kunnen worden over het grootboek. Een frisdrankautomaat geeft elke keer dezelfde uitvoer bij dezelfde munten.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c34-q2",
      prompt: "Wat voegt Soroban technisch gezien toe aan Stellar?",
      options: [
        {
          text: "Het vervangt XLM door een nieuw eigen token en legt de klassieke betaaloperaties stil.",
          explanation:
            "Fout. Soroban vervangt XLM niet en verwijdert de klassieke operaties niet; het is ontworpen om ermee samen te leven, en contracten verplaatsen precies dezelfde XLM en USDC die je al verhandelt.",
        },
        {
          text: "Een runtime voor willekeurige smart contracts, geschreven in Rust en gecompileerd naar afgeschermde WASM, die programmeerbaarheid toevoegt voorbij de vaste ingebouwde operaties van Stellar.",
          explanation:
            "Juist. Soroban is het smart-contractplatform van Stellar: Rust-broncode gecompileerd naar gemeten, afgeschermde WebAssembly, waarmee ontwikkelaars eigen on-chain logica kunnen uitrollen naast het klassieke operatiemenu.",
        },
        {
          text: "Een sneller consensusalgoritme dat SCP vervangt door proof-of-work-mining.",
          explanation:
            "Op twee punten fout. Soroban is een contractplatform, geen consensuswijziging, en de consensus van Stellar blijft SCP (een Federated Byzantine Agreement), geen proof-of-work.",
        },
        {
          text: "Een gecentraliseerde server, beheerd door de Stellar-foundation, die off-chain scripts uitvoert voor gebruikers.",
          explanation:
            "Fout. Soroban-contracten worden on-chain uitgevoerd op elke validerende node, op een gedecentraliseerde, deterministische manier, niet op één centrale server die off-chain scripts draait.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q3",
      prompt: "Welke bewering onderscheidt het aanroepen van een Soroban-contract het best van het indienen van een klassieke operatie zoals een betaling?",
      options: [
        {
          text: "Klassieke operaties zijn niet-deterministisch, terwijl contractaanroepen deterministisch zijn.",
          explanation:
            "Fout. Beide zijn strikt deterministisch, SCP vereist dat elke validator hoe dan ook tot identieke resultaten komt. Determinisme is een gedeelde eis, geen verschil.",
        },
        {
          text: "Een klassieke betaling kan andere contracten aanroepen en over zijn eigen opslag lussen, terwijl een contract dat niet kan.",
          explanation:
            "Omgekeerd. Het is de contractaanroep die kan vertakken, lussen, zijn eigen opslag muteren en andere contracten aanroepen; een klassieke betaling verplaatst gewoon waarde tussen twee accounts.",
        },
        {
          text: "Een contractaanroep draait door ontwikkelaars geschreven logica met zijn eigen persistente toestand, wordt gemeten naar de middelen die hij gebruikt, en moet de grootboek-footprint aangeven die hij zal lezen en schrijven.",
          explanation:
            "Juist. Anders dan een vaste ingebouwde operatie met een bijna-vaste fee, voert een contractaanroep willekeurige toestandswijzigende logica uit, wordt aangerekend naar verbruikte CPU/geheugen/opslag, en moet vooraf zijn opslag-footprint aangeven zodat validators veilig kunnen vergrendelen en parallelliseren.",
        },
        {
          text: "Contractaanroepen zijn altijd gratis, terwijl klassieke betalingen altijd meer kosten.",
          explanation:
            "Fout. Klassieke operaties dragen een minuscule, bijna-vaste fee; contractaanroepen worden middelengemeten en een zware aanroep kost doorgaans meer dan een eenvoudige betaling, niet minder.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c34-q4",
      prompt: "Een DeFi-vault houdt de USDC van duizenden gebruikers vast. De code bevat een owner-only functie die alle stortingen kan opnemen zonder timelock. Op een dag roept de uitroller die aan en haalt alles leeg. Wat voor soort risico is dit, en wat had het gesignaleerd?",
      options: [
        {
          text: "Het was een netwerk-hack; niets in het contract zelf had gebruikers kunnen waarschuwen.",
          explanation:
            "Fout. Er werd niets gehackt, het contract voerde precies uit wat zijn code altijd al toestond. Het gevaar zat in de eigen bevoorrechte logica van het contract, die vooraf te inspecteren was.",
        },
        {
          text: "Een rug pull via bevoorrechte permissies; lezen wie het contract beheert en of een owner-sleutel geld kan verplaatsen, had het blootgelegd.",
          explanation:
            "Juist. Dit is een rug pull die in de permissies is ingebakken. Het controleren van de zeggenschap over het contract, één enkele owner-sleutel met een onbeperkte, ongetimelockte withdraw-functie, is precies de audit-en-permissiediscipline die het ene punt van falen signaleert voordat je stort.",
        },
        {
          text: "Verliesaversie zette de uitroller aan tot verkopen; het is een probleem van traderpsychologie, geen contractprobleem.",
          explanation:
            "Fout. Verliesaversie gaat over de eigen emotionele uitstappen van een trader, niet over een uitroller die een pool leegtrekt. Dit is een smart-contract-permissierisico, los van dat concept.",
        },
        {
          text: "Het was een onvermijdelijk gevolg van determinisme dat geen enkele codereview kon blootleggen.",
          explanation:
            "Fout. Determinisme verklaart waarom de diefstal onomkeerbaar was zodra hij in gang was gezet, maar het achterdeurtje zat duidelijk in de code en de permissies, ze vooraf lezen had het onthuld.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q5",
      prompt: "Hoe stellen Soroswap, Blend en DeFindex zich samen in de DeFi-stack van Stellar?",
      options: [
        {
          text: "Het zijn drie geïsoleerde apps die niet met elkaar kunnen interageren, omdat Soroban-contracten elkaar niet kunnen aanroepen.",
          explanation:
            "Fout. Samenstelbaarheid is juist de kern: Soroban-contracten delen hetzelfde grootboek en dezelfde assets en kunnen elkaar atomair binnen één transactie aanroepen.",
        },
        {
          text: "DeFindex is de basale swap-engine, Blend zit daar bovenop, en Soroswap is een vault-manager gebouwd op Blend.",
          explanation:
            "Fout, de rollen zijn door elkaar gehaald. Soroswap is de AMM/DEX-swap-primitieve, Blend is lenen/ontlenen, en DeFindex is de strategie-en-vaultlaag die bovenop de andere zit.",
        },
        {
          text: "Ze stellen zich alleen samen doordat ze elk hun eigen aparte blockchain draaien en assets ertussen bruggen.",
          explanation:
            "Fout. Alle drie zijn Soroban-contracten op hetzelfde Stellar-grootboek, die rechtstreeks dezelfde USDC en XLM delen, er zijn geen aparte chains of asset-bruggen nodig om ze in elkaar te laten grijpen.",
        },
        {
          text: "Soroswap levert swaps, Blend levert lenen dat een DEX kan bereiken voor liquidaties, en DeFindex bouwt vault-strategieën bovenop beide, gestapeld als money legos, wat ook hun risico stapelt.",
          explanation:
            "Juist. Soroswap is de AMM/routering-basisprimitieve, Blend is de leenlaag die assets kan aanschaffen of afstoten via een DEX tijdens liquidaties, en DeFindex-vaults orkestreren strategieën over beide. Het gemak van de stapel berust op het vertrouwen in elke laag eronder.",
        },
      ],
      correctIndex: 3,
    },
  ],
};
