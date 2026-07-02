// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Expert-hoofdstuk over blockchain-architectuur: consensus en het double-spend-
// probleem, het Stellar Consensus Protocol als Federated Byzantine Agreement,
// nodes en quorumsets, het volledige leven van een transactie via Horizon en de
// afsluiting van een ledger, en het schaalbaarheidstrilemma. Dit hoofdstuk bezit
// geen nieuwe woordenlijsttermen; het hergebruikt termen uit eerdere hoofdstukken.
import type { Chapter } from "../../types";

export const chapter33: Chapter & { whoFor: string } = {
  id: "c33",
  number: 33,
  level: "EXPERT",
  whoFor: "Voor de technisch nieuwsgierige die wil weten hoe Stellar het echt eens wordt over de waarheid",
  title: "Blockchain-architectuur — Hoe het echt werkt",
  description:
    "Hoe een netwerk van vreemden het eens wordt over één waarheid zonder centrale scheidsrechter: consensus en het double-spend-probleem, het Stellar Consensus Protocol, nodes en quorumsets, het leven van een transactie, en het schaalbaarheidstrilemma.",
  lessons: [
    {
      id: "c33-l1",
      title: "Wat is consensus en hoe lost een blockchain het double-spend-probleem op?",
      paragraphs: [
        "Consensus is het proces waarbij veel onafhankelijke computers, waarvan geen enkele een centrale autoriteit vertrouwt, het eens worden over één gedeelde geschiedenis: welke transacties hebben plaatsgevonden, in welke volgorde, en wat de resulterende saldi zijn. Zonder overeenstemming over de volgorde is een blockchain slechts een stapel tegenstrijdige beweringen. Het moeilijke is niet het opslaan van data — het is duizenden eigenbelang nastrevende vreemden zover krijgen dat ze op hetzelfde antwoord uitkomen, zelfs wanneer sommigen van hen defect of kwaadwillig zijn.",
        "De klassieke dreiging is de double-spend. Digitaal geld is slechts cijfers, en cijfers kunnen worden gekopieerd. Als ik 100 USDC bezit en dat volledige bedrag zowel naar Alice als naar Bob stuur in twee transacties die op precies hetzelfde moment worden uitgezonden, zien beide er op zichzelf geldig uit. Een betrouwbaar grootboek moet er precies één accepteren en de andere weigeren, zodat hetzelfde saldo nooit twee keer kan worden uitgegeven. Consensus is precies het mechanisme dat een canonieke volgorde kiest, en zodra de ene uitgave is vastgelegd, wordt de andere ongeldig.",
        "Verschillende netwerken lossen dit met verschillende regels op. Proof of Work (Bitcoin) maakt het schrijven van geschiedenis duur: miners verstoken elektriciteit in een race om een hash onder een drempelwaarde te vinden, en de langste keten van opgebouwd werk wint, dus het herschrijven van een uitgave betekent dat je het hele netwerk moet overrekenen. Proof of Stake (het moderne Ethereum) vervangt elektriciteit door kapitaal dat op het spel staat: validators zetten kapitaal vast, worden gekozen om blokken voor te stellen en te bevestigen, en verliezen hun inzet als ze tegenstrijdige geschiedenissen ondertekenen. Beide bereiken uiteindelijk overeenstemming, op probabilistische wijze, en beide laten iedereen meedoen door de vereiste hulpbron uit te geven.",
        "Het Stellar Consensus Protocol (SCP) volgt een derde weg. Er wordt niet gemined en niet gestaket. In plaats van één globale regel die bepaalt wie er mag schrijven, verklaart elke deelnemer welke andere deelnemers hij vertrouwt, en het netwerk komt tot overeenstemming via die overlappende vertrouwenskringen. Dat maakt het snel en goedkoop, maar het betekent dat de veiligheid steunt op de vertrouwenskeuzes die deelnemers maken, in plaats van op verstookte energie of vastgezet kapitaal — een afweging die de volgende lessen uitdiepen.",
      ],
      example:
        "Stel je de double-spend concreet voor: een wallet met 100 USDC ondertekent binnen dezelfde seconde twee path payments, één die omzet naar XLM voor Alice en één die omzet naar yXLM voor Bob, elk voor de volle 100. Beide zijn afzonderlijk correct opgebouwd. Consensus dwingt het netwerk om ze te serialiseren: welke transactie ook als eerste in een afgesloten ledger belandt, die verbruikt het saldo, en de tweede wordt bij toepassing geweigerd omdat de middelen niet meer bestaan. Het grootboek, niet de verzender, bepaalt de volgorde.",
    },
    {
      id: "c33-l2",
      title: "Wat is het Stellar Consensus Protocol en waarom is het anders?",
      paragraphs: [
        "Het Stellar Consensus Protocol is een implementatie van Federated Byzantine Agreement (FBA). \"Byzantijns\" betekent dat het nodes tolereert die niet alleen zijn uitgevallen, maar actief liegen of zich misdragen. \"Federated\" is de bijzonderheid die het onderscheidt: er is geen vaste, vooraf overeengekomen lijst van wie de validators zijn. Elke node kiest vrijelijk zijn eigen set nodes om te vertrouwen, en het globale lidmaatschap van het netwerk ontstaat uit de vereniging van ieders individuele keuzes in plaats van te worden opgelegd door een centraal register.",
        "De bouwsteen is de quorumslice. Een quorumslice is een groep nodes die één bepaalde node voldoende acht om zichzelf van een bewering te overtuigen. Een node accepteert iets als waar zodra elke node in een van zijn slices het eens is. Een quorum is een verzameling nodes die voor elk van zijn leden een slice bevat — een zichzelf versterkende groep die intern tot overeenstemming kan komen. Cruciaal is dat niemand je een quorum aanreikt; het ontstaat uit de manier waarop slices overlappen. Zolang de slices van eerlijke nodes voldoende overlappen, wordt het hele netwerk naar één beslissing getrokken, omdat er geen manier is waarop twee onsamenhangende groepen elk hun slices kunnen vervullen en tegenstrijdige waarden kunnen vastleggen.",
        "Omdat er geen puzzel op te lossen valt en geen inzet vast te zetten is, heeft SCP geen beloningstoken nodig om blokproductie te stimuleren, en verstookt het geen energie. Een ledger sluit af wanneer een quorum dezelfde set transacties heeft bevestigd, wat op Stellar ongeveer vijf seconden duurt. Die bevestiging is definitief: anders dan bij Proof of Work, waar een blok kan worden verweesd als er een langere keten opduikt, wordt een door SCP vastgelegde ledger niet teruggedraaid. Er is geen \"wacht op zes bevestigingen\" — zodra hij sluit, is het klaar.",
        "De afweging is eerlijkheid over wat het netwerk beveiligt. Proof of Work en Proof of Stake kopen veiligheid met een externe, meetbare hulpbron. FBA koopt die met vertrouwensconfiguratie: het netwerk is alleen veilig als deelnemers verstandige, overlappende quorumsets kiezen en als genoeg van de belangrijke nodes eerlijk en bereikbaar zijn. Slechte vertrouwenskeuzes — bijvoorbeeld dat iedereen op dezelfde handvol validators leunt — kunnen kwetsbaarheid creëren of, in het ergste geval, een netwerksplitsing. SCP verplaatst de veiligheidsvraag van \"hoeveel heb je uitgegeven?\" naar \"wie heb je gekozen te vertrouwen, en overlapten die keuzes?\"",
      ],
      example:
        "Stel je een klein dorp voor dat beslist of een gerucht waar is. Jij persoonlijk gelooft het zodra je dokter en je twee zorgvuldigste vrienden het allemaal beamen — dat drietal is jouw quorumslice. Je buurman heeft een ander drietal. Maar je dokter zit ook in de slice van je buurman, en zijn zorgvuldige vriend zit in de jouwe. Doordat de vertrouwenskringen overlappen, kan het dorp niet eindigen met de helft die het ene gelooft en de helft die het tegenovergestelde gelooft; de overlap dwingt tot één gedeelde conclusie. SCP is precies die dynamiek, uitgevoerd door servers in plaats van dorpelingen.",
    },
    {
      id: "c33-l3",
      title: "Wat zijn nodes, validators en quorumsets op Stellar?",
      paragraphs: [
        "Een node is elke computer die de Stellar Core-software draait en aan het netwerk deelneemt. Nodes verspreiden transacties naar elkaar via gossip, houden een kopie van de ledger bij en passen statuswijzigingen toe. Niet elke node stemt: een watcher-node volgt de ledger en levert data, maar blijft buiten de consensus, terwijl een validator een node is die is geconfigureerd met een ondertekeningssleutel en actief stemt in SCP. Achter de app zit Horizon — de HTTP-API-server van Stellar — meestal vóór een Core-node, en vertaalt het toegankelijke REST en JSON naar het low-level protocol dat het netwerk spreekt.",
        "Elke validator publiceert een quorumset: zijn expliciete verklaring van welke andere validators hij vertrouwt en hoeveel van hen het eens moeten zijn voordat hij een waarde accepteert. Een quorumset is geen platte lijst; het is doorgaans een drempelstructuur, bijvoorbeeld \"eens als om het even welke 3 van deze 4 groepen het eens zijn\", en die groepen kunnen zelf geneste drempels zijn. Zo kan een operator iets genuanceerds zeggen als \"ik vertrouw het netwerk als een meerderheid van de grote infrastructuuraanbieders plus minstens één onafhankelijke validator het eens is\", waarmee echte vertrouwensrelaties worden gecodeerd in plaats van één globale stem.",
        "Quorumslices worden vervolgens uit die quorumset afgeleid: elke combinatie van validators die aan de drempels voldoet, is een slice, een groep die volstaat om die validator te overtuigen. Het netwerk bereikt overeenstemming doordat validators hun sets zo kiezen dat slices overlappen — die overlap, bekend als quorumdoorsnede, is wat garandeert dat twee eerlijke validators geen tegenstrijdige ledgers kunnen vastleggen. Als quorumsets zo waren geconfigureerd dat twee groepen geen leden deelden, zou het netwerk kunnen splitsen; een gezonde Stellar-configuratie leidt vertrouwen bewust via een gemeenschappelijke kern, zodat de doorsnede altijd standhoudt.",
        "In de praktijk draaien de Stellar Development Foundation en een aantal onafhankelijke organisaties validators, en elk publiceert een stellar.toml-bestand dat zijn identiteit en validatorsleutels vermeldt. Operators verwijzen naar elkaar via deze gepubliceerde identiteiten bij het opbouwen van quorumsets, en daarom is een transparante, verifieerbare node-identiteit belangrijk. Een validator die zijn identiteit verbergt of door niemand wordt vertrouwd, draagt niets bij; de veerkracht van het netwerk komt van veel welbekende, eerlijke operators wier overlappende vertrouwenskeuzes geen ruimte laten voor een splitsing.",
      ],
      example:
        "Stel dat de backend van de app een transactie indient en moet weten of die is afgehandeld. Horizon stuurt hem door naar een Core-node, een validator wiens quorumset luidt \"accepteer wanneer minstens 4 van deze 6 genoemde organisaties het eens zijn, en een van die organisaties moet de SDF-laag zijn\". Elke 4-op-6-combinatie die aan de regel voldoet, is een geldige slice. Wanneer zo'n slice de ledger bevestigt, legt deze validator die vast — en omdat de set van elke andere eerlijke validator ook via diezelfde welbekende organisaties loopt, leggen ze allemaal de identieke ledger vast.",
    },
    {
      id: "c33-l4",
      title: "Hoe worden transacties verwerkt en aan een ledger toegevoegd?",
      paragraphs: [
        "Een transactie begint bij de client. De app bouwt een transactieobject — een bronaccount, een volgnummer, kosten, en een of meer operaties zoals een betaling, een path payment, een manage-offer op de SDEX, of een change-trust die een trustline toevoegt. Vervolgens wordt hij ondertekend met de geheime sleutel van het account, wat een handtekening oplevert die de autorisatie bewijst zonder de sleutel prijs te geven. Het netwerk is nog nergens aangeraakt; dit is allemaal lokale opbouw en cryptografie, en een niet-ondertekende of verkeerd genummerde transactie wordt simpelweg geweigerd.",
        "De ondertekende transactie wordt ingediend, in deze app via het transactie-endpoint van Horizon. Horizon voert basisvalidatie uit en geeft hem dan door aan zijn Stellar Core-node, die hem via gossip over het peer-to-peernetwerk uitzendt. Elke validator verzamelt de transacties die hij heeft gehoord in een kandidaat-transactieset voor de volgende ledger. Kosten en volgnummers helpen bij het ordenen en ontdubbelen; als het netwerk overbelast is, bieden transacties via kosten in een surge-pricing-veiling, en de lagere biedingen wachten op een latere ledger.",
        "Nu draait SCP, in twee fasen. In de nominatie stellen validators kandidaat-transactiesets voor en komen ze tot overeenstemming over één afgesproken set transacties voor deze ledger. In het ballotprotocol stemmen ze om die set vast te leggen, waarbij ze prepare- en commit-berichten uitwisselen totdat een quorum dezelfde waarde bevestigt. Hier leeft de Byzantijnse tolerantie: zelfs als sommige validators liegen of zwijgen, voorkomt de overlap in quorumsets dat twee verschillende sets beide worden vastgelegd. De fase eindigt wanneer een quorum één transactieset heeft geëxternaliseerd.",
        "De ledger sluit dan af — ongeveer elke vijf seconden. Core past de afgesproken transacties toe in hun canonieke volgorde, werkt elk betrokken account, elke offer en elke trustline bij, berekent een nieuwe ledger-hash die aan de vorige ledger vastketent, en het resultaat is definitief en onomkeerbaar. Horizon neemt de afgesloten ledger op, en pas dan geeft de submit-oproep van de app succes met het resultaat terug. Daarom is een ingediende trade niet \"klaar\" op het moment dat je klikt: hij is klaar wanneer de ledger die hem bevat sluit, en de definitiviteit op Stellar is op dat moment onmiddellijk in plaats van probabilistisch over vele latere blokken.",
      ],
      example:
        "Je plaatst een marktorder om XLM voor USDC te verkopen op het tabblad Handmatig handelen. De app bouwt en ondertekent een manage-offer-operatie en POST't die naar Horizon. Horizon geeft hem door aan Core, dat hem via gossip verspreidt; validators vouwen hem in de volgende kandidaatset, draaien de nominatie en het ballotprotocol, en een quorum externaliseert die set. Ongeveer vijf seconden later sluit de ledger: je offer matcht tegen het orderboek, de saldi worden atomisch bijgewerkt, een nieuwe ledger-hash wordt geschreven, en Horizon geeft de uitvoering terug aan de app. De wachttijd van vijf seconden die je voelt, is één volledige consensusronde.",
    },
    {
      id: "c33-l5",
      title: "Wat zijn de grenzen van een blockchain?",
      paragraphs: [
        "Elke blockchain leeft binnen het schaalbaarheidstrilemma: de vaststelling dat het erg moeilijk is om decentralisatie, veiligheid en schaalbaarheid tegelijk te maximaliseren, en dat hard inzetten op de ene je meestal een andere kost. Decentralisatie betekent veel onafhankelijke deelnemers zonder enkel controlepunt. Veiligheid betekent bestand zijn tegen aanvallen en tegen het herschrijven van geschiedenis. Schaalbaarheid betekent hoge doorvoer en lage kosten per transactie. Echte netwerken kiezen een balans in plaats van alle drie te winnen.",
        "De spanningen zijn concreet. Als je de doorvoer verhoogt door zwaardere, duurdere validators te eisen, kunnen minder mensen zich er een veroorloven en brokkelt de decentralisatie af. Als je validatie goedkoop houdt zodat iedereen kan meedoen, begrenst de capaciteit per node je doorvoer. Proof of Work verstookt echte energie om veiligheid te kopen en betaalt daarvoor in snelheid en kosten; grote Proof of Stake-systemen concentreren invloed bij de grootste inzetters. Er bestaat geen gratis lunch — elk ontwerp is een gekozen afweging, geen opgelost probleem.",
        "Stellars keuzes plaatsen het bewust richting snel, goedkoop en redelijk gedecentraliseerd, met aanvaarding van een specifieke prijs. SCP met FBA levert definitiviteit binnen vijf seconden en kosten van een fractie van een cent, wat uitstekende schaalbaarheid is voor betalingen en assetoverdrachten. Veiligheid komt niet van energie of inzet, maar van de eerlijkheid en overlap van quorumsets, dus Stellars veiligheid is slechts zo sterk als zijn vertrouwenstopologie — een kleinere, identiteitsgebaseerde validatorset is efficiënter, maar leunt erop dat die operators zich netjes gedragen en doorsnijdende quorums configureren. Het is een betalingsgerichte optimalisatie, geen algemene stellingname voor maximale decentralisatie.",
        "Blockchains hebben ook grenzen die geen enkele consensusaanpassing wegneemt. On-chain code is openbaar en permanent, dus bugs zijn kostbaar en privacy is beperkt. De doorvoer is eindig, dus overbelasting drijft de kosten op. En het grootboek handhaaft alleen zijn eigen regels — het kan niet instaan voor de kwaliteit van een asset in de echte wereld, en daarom scoort de app tokens off-chain aan de hand van handelsaggregaties, orderboekdiepte en adoptie, in plaats van louter on-chain aanwezigheid te vertrouwen. Nieuwere lagen zoals Soroban, Stellars smart-contractplatform, breiden uit wat het netwerk kan doen, maar erven dezelfde trilemma-afwegingen. Niets hiervan is beleggings-, fiscaal of juridisch advies; het is architectuur, en weten waar een keten op het trilemma zit, vertelt je waar hij goed in is en waar je voorzichtig moet blijven.",
      ],
      example:
        "Vergelijk twee uitersten. Eén bankdatabase is razendsnel en goedkoop maar volledig gecentraliseerd — de bank kan alles bevriezen of terugdraaien, dus faalt op het punt van decentralisatie en censuurbestendigheid. Bitcoin is zeer gedecentraliseerd en veilig, maar verwerkt bij hoge kosten soms slechts een handvol transacties per seconde. Stellar zit daartussenin: niet zo trust-minimaliserend als Proof of Work, maar wel een path payment over meerdere markten afwikkelend in ongeveer vijf seconden voor een fractie van een cent. Elk ontwerp kocht twee hoeken van de driehoek en betaalde bij de derde.",
    },
  ],
  quiz: [
    {
      id: "c33-q1",
      prompt: "Welk probleem bestaat blockchain-consensus fundamenteel om op te lossen?",
      options: [
        {
          text: "Transacties versleutelen zodat niemand kan lezen wie wie betaalde.",
          explanation:
            "Onjuist. Versleuteling en privacy zijn aparte kwesties; de meeste openbare grootboeken, waaronder Stellar, zijn juist transparant. Consensus gaat over het eens worden over de volgorde, niet over het verbergen van data.",
        },
        {
          text: "Veel elkaar niet vertrouwende, onafhankelijke nodes het eens laten worden over één geordende geschiedenis, zodat hetzelfde saldo niet twee keer kan worden uitgegeven.",
          explanation:
            "Juist. Consensus produceert één canonieke volgorde van transacties over wederzijds wantrouwende nodes heen, en dat is precies wat de double-spend verslaat: slechts één van twee tegenstrijdige uitgaven kan worden vastgelegd.",
        },
        {
          text: "Transacties permanent gratis maken door alle netwerkkosten te verwijderen.",
          explanation:
            "Onjuist. Kosten bestaan juist omdat blokruimte schaars is en om spam af te schrikken; consensus streeft er niet naar ze te elimineren, en Stellar rekent nog steeds een piepkleine vergoeding per operatie.",
        },
        {
          text: "Garanderen dat de prijs van een asset alleen maar omhooggaat.",
          explanation:
            "Onjuist. Consensus betreft de integriteit en de ordening van het grootboek, niet de marktprijzen, die geen enkel protocol beheerst.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c33-q2",
      prompt: "Hoe bereikt het Stellar Consensus Protocol overeenstemming, vergeleken met Proof of Work en Proof of Stake?",
      options: [
        {
          text: "Het laat validators energie-intensieve hashpuzzels oplossen, en de langste keten van werk wint.",
          explanation:
            "Onjuist. Dat beschrijft Proof of Work. SCP mined niet en verstookt geen energie.",
        },
        {
          text: "Het vereist dat validators kapitaal vastzetten dat wordt afgeroomd als ze tegenstrijdige geschiedenissen ondertekenen.",
          explanation:
            "Onjuist. Dat beschrijft Proof of Stake. SCP kent geen staking en geen afroombare inleg.",
        },
        {
          text: "Elke node kiest welke andere hij vertrouwt, en overeenstemming ontstaat uit overlappende quorumslices — geen mining, geen staking, met snelle definitiviteit.",
          explanation:
            "Juist. SCP implementeert Federated Byzantine Agreement: veiligheid steunt op de overlap van vertrouwenskeuzes in plaats van op verstookte energie of vastgezette inzet, wat een definitiviteit binnen ongeveer vijf seconden oplevert die onomkeerbaar is.",
        },
        {
          text: "Een centrale Stellar-server ondertekent elke ledger en zendt die naar het netwerk uit.",
          explanation:
            "Onjuist. Er is geen centrale ondertekenaar. Veel onafhankelijke validators bereiken overeenstemming via hun quorumsets; één enkele autoriteit zou het doel van consensus tenietdoen.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q3",
      prompt: "Wat is de quorumset van een validator, en waarom is overlap tussen quorumsets van belang?",
      options: [
        {
          text: "Het is de expliciete set vertrouwde nodes en drempels van de validator; overlappende sets (quorumdoorsnede) voorkomen dat twee eerlijke validators tegenstrijdige ledgers vastleggen.",
          explanation:
            "Juist. Een quorumset codeert wie een validator vertrouwt en hoevelen het eens moeten zijn. Doordat eerlijke validators vertrouwen via gemeenschappelijke, welbekende operators leiden, snijden hun slices elkaar, zodat het netwerk niet in twee tegenstrijdige geschiedenissen kan splitsen.",
        },
        {
          text: "Het is de hoeveelheid XLM die een validator moet staken voordat hij kan stemmen.",
          explanation:
            "Onjuist. Stellar-validators staken niet om te stemmen; een quorumset gaat over vertrouwensrelaties, niet over vastgezette middelen.",
        },
        {
          text: "Het is een willekeurige groep nodes die het netwerk elke ledger toewijst, zodat overlap onmogelijk is.",
          explanation:
            "Onjuist. Quorumsets worden door elke operator gekozen en gepubliceerd, niet willekeurig toegewezen, en bewuste overlap is juist wat het netwerk veilig houdt.",
        },
        {
          text: "Het is de lijst van tokens die een validator mag verhandelen; overlap laat ze liquiditeit delen.",
          explanation:
            "Onjuist. Quorumsets betreffen consensusvertrouwen, niet handel of liquiditeit. Dit verwart grootboekovereenstemming met marktmechaniek.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c33-q4",
      prompt: "Wat betekent het in het leven van een transactie op Stellar wanneer de submit-oproep van de app uiteindelijk succes teruggeeft?",
      options: [
        {
          text: "Horizon heeft de transactie ontvangen en beslist nog of hij die zal uitzenden.",
          explanation:
            "Onjuist. Loutere ontvangst door Horizon is geen afwikkeling; de transactie moet nog via gossip worden verspreid, door consensus worden bekrachtigd, en worden toegepast.",
        },
        {
          text: "Eén enkele validator heeft de transactie geaccepteerd, hoewel die nog kan worden teruggedraaid door een langere keten.",
          explanation:
            "Onjuist. Eén validator is niet genoeg, en Stellar kent geen langste-keten-terugdraaiing zoals Proof of Work. Definitiviteit komt doordat een quorum de ledger externaliseert.",
        },
        {
          text: "Een quorum heeft de transactieset geëxternaliseerd, de ledger is afgesloten (ongeveer elke vijf seconden), de operaties zijn toegepast, en het resultaat is definitief en onomkeerbaar.",
          explanation:
            "Juist. Succes betekent dat de bevattende ledger is afgesloten: de nominatie- en ballotfasen van SCP zijn tot overeenstemming gekomen, Core heeft de operaties in canonieke volgorde toegepast, een nieuwe ledger-hash is vastgeketend, en Horizon heeft het resultaat opgenomen. Definitiviteit op Stellar is onmiddellijk bij het afsluiten van de ledger.",
        },
        {
          text: "De transactie is naar de lokale database van de client geschreven en zal 's nachts naar het netwerk synchroniseren.",
          explanation:
            "Onjuist. Er is geen nachtelijke batchsynchronisatie; de transactie wordt uitgezonden en afgewikkeld binnen één consensusronde van ongeveer vijf seconden.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q5",
      prompt: "Het schaalbaarheidstrilemma stelt dat een blockchain moeite heeft om decentralisatie, veiligheid en schaalbaarheid alle drie tegelijk te maximaliseren. Waar zit Stellar?",
      options: [
        {
          text: "Het maximaliseert alle drie tegelijk, en heeft het trilemma volledig opgelost.",
          explanation:
            "Onjuist. Geen enkele productieketen ontsnapt aan het trilemma; beweren het volledig op te lossen is een alarmsignaal. Elk ontwerp betaalt ergens.",
        },
        {
          text: "Het optimaliseert voor snelle, goedkope doorvoer en redelijke decentralisatie, en aanvaardt dat zijn veiligheid afhangt van eerlijke, goed overlappende quorumsets in plaats van van verstookte energie of inzet.",
          explanation:
            "Juist. Stellar ruilt bewust een kleinere, identiteitsgebaseerde validatorset in voor definitiviteit binnen vijf seconden en kosten onder een cent; zijn veiligheid is slechts zo sterk als zijn vertrouwenstopologie, wat een betalingsgerichte optimalisatie is, geen stellingname voor maximale decentralisatie.",
        },
        {
          text: "Het maximaliseert decentralisatie bovenal, en draait als Bitcoin met traag, duur Proof of Work.",
          explanation:
            "Onjuist. Stellar gebruikt SCP, geen Proof of Work, en geeft voorrang aan snelheid en lage kosten boven Bitcoin-achtige trust-minimalisatie.",
        },
        {
          text: "Het geeft veiligheid volledig op om zo snel mogelijk te zijn.",
          explanation:
            "Onjuist. Stellar behoudt Byzantijns-fouttolerante veiligheid via quorumdoorsnede; het verschuift de basis van die veiligheid, het gooit haar niet weg.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
