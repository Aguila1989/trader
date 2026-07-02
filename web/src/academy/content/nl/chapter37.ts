// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// EXPERT chapter on regulation, compliance and crypto's future: MiCA for
// European traders, FSMA and platform licensing, GDPR for platforms holding
// personal data, CBDCs, and where crypto (and Stellar) is heading. This chapter
// owns no new glossary terms; it reuses concepts taught in earlier chapters.
// Same shape as content/en/chapter22.ts, with the per-chapter `whoFor` one-liner
// typed via a local intersection so the live Chapter interface stays untouched.
import type { Chapter } from "../../types";

export const chapter37: Chapter & { whoFor: string } = {
  id: "c37",
  number: 37,
  level: "EXPERT",
  whoFor: "Voor traders en bouwers met een blik op de gereguleerde toekomst van crypto",
  title: "Regelgeving, compliance en de toekomst van crypto",
  description:
    "Hoe MiCA, FSMA-vergunningen en GDPR de Europese cryptomarkt vormgeven, hoe CBDC's verschillen van gedecentraliseerd geld en stablecoins, en waar de markt naartoe gaat, inclusief de rol van Stellar.",
  lessons: [
    {
      id: "c37-l1",
      title: "Wat is MiCA en wat betekent het concreet voor Europese traders?",
      paragraphs: [
        "MiCA, de Markets in Crypto-Assets-verordening, is het ene, gemeenschappelijke regelboek van de Europese Unie voor crypto-assets die niet al onder bestaande financiële wetgeving vallen. Het vervangt de lappendeken van nationale regelingen door één geharmoniseerd kader voor alle lidstaten, zodat een uitgever of dienstverlener die in één land een vergunning krijgt, die vergunning via een paspoort in het hele blok kan gebruiken. Dat is een bewuste ontwerpkeuze: in plaats van zevenentwintig uiteenlopende regelboeken is er nu één.",
        "MiCA verdeelt tokens in drie categorieën, en de categorie bepaalt de regels. Asset-referenced tokens (ART's) volgen een mandje van assets of valuta. E-money tokens (EMT's) volgen één officiële valuta één-op-één, en dat is de categorie waar de meeste door fiat gedekte stablecoins onder vallen, waaronder een euro- of dollarstablecoin. De restcategorie omvat andere crypto-assets zoals utility tokens. Uitgevers van stablecoins krijgen de strengste behandeling: ze moeten volledig gedekte, gescheiden, liquide reserves aanhouden, een whitepaper publiceren en op verzoek terugbetaling tegen pari garanderen. Grote stablecoins kunnen zelfs een plafond op het dagelijkse transactievolume krijgen wanneer ze puur als betaalmiddel worden gebruikt.",
        "De dienstenkant wordt geregeld via de CASP-vergunning. Een Crypto-Asset Service Provider is elke onderneming die bewaring aanbiedt, een handelsplatform exploiteert, crypto omwisselt voor fiat of andere crypto, orders uitvoert of plaatst, of advies geeft. Om legaal te werken moet een CASP een vergunning hebben van een nationale bevoegde autoriteit en vervolgens doorlopende verplichtingen naleven: kapitaalvereisten, het beschermen van cliëntenassets, een duidelijke klachtenafhandeling, het openbaar maken van belangenconflicten en regels tegen marktmisbruik die handel met voorkennis en manipulatie verbieden. Consumentenbescherming is een terugkerend thema, met verplichte risicowaarschuwingen en een recht om kort na bepaalde aankopen terug te treden.",
        "De uitrol verliep gefaseerd. De regels voor stablecoins (ART en EMT) golden vanaf midden 2024, en het bredere CASP-regime vanaf eind 2024, met overgangsperiodes waarin bestaande spelers ontzien werden en die nationale toezichthouders konden inkorten. Voor een trader is het concrete gevolg dat de exchanges en bewaarders die je gebruikt steeds vaker een MiCA-vergunning zouden moeten hebben, dat niet-conforme eurostablecoins voor EU-gebruikers kunnen worden geschrapt, en dat de informatie die je ontvangt meer gestandaardiseerd wordt. Niets hiervan is beleggings- of juridisch advies; het is context zodat je de labels correct kunt lezen en gereguleerde platformen kunt kiezen.",
      ],
      example:
        "Een aan de euro gekoppelde stablecoin die aan EU-gebruikers wordt verkocht, is onder MiCA een e-money token. De uitgever moet de dekkingsreserves volledig gescheiden en tegen pari terugbetaalbaar houden, een whitepaper publiceren en een vergunning als EMI of kredietinstelling hebben. Kan hij dat niet, dan moeten EU-platformen de token voor Europese klanten schrappen. Dat is de reden waarom sommige stablecoins in 2024 stilletjes uit bepaalde EU-handelsparen verdwenen, terwijl een volledig gedekt, vergund alternatief genoteerd bleef.",
    },
    {
      id: "c37-l2",
      title: "Wat is FSMA en wanneer heb je een vergunning nodig om een crypto­platform te runnen?",
      paragraphs: [
        "De FSMA, de Autoriteit voor Financiële Diensten en Markten, is de Belgische gedragstoezichthouder. Samen met de Nationale Bank van België houdt ze toezicht op de markten, beschermt ze consumenten en controleert ze financiële reclame. Onder MiCA is ze een van de nationale bevoegde autoriteiten die Crypto-Asset Service Providers met zetel in België een vergunning verleent en op hen toeziet, en ze had al een nationaal registratieregime voor exchange- en bewaarwallet-aanbieders onder de antiwitwaswetgeving voordat MiCA het overnam.",
        "Of je een vergunning nodig hebt, hangt af van wat je platform daadwerkelijk doet, niet van hoe je het noemt. Het exploiteren van een orderboekplatform, het in bewaring houden van sleutels of saldi van cliënten, het omwisselen tussen crypto en fiat, of het uitvoeren en routeren van orders namens gebruikers zijn allemaal gereguleerde CASP-activiteiten. Op het moment dat een platform aan het geld of de assets van anderen komt, of hun trades matcht, zit het zeer waarschijnlijk binnen de perimeter en heeft het een vergunning nodig, plus antiwitwascontroles: know-your-customer-identiteitscontroles, transactiemonitoring en het melden van verdachte activiteiten. Ook het aan het publiek promoten van cryptoproducten roept gedragsregels op over eerlijke, duidelijke en niet-misleidende communicatie.",
        "Puur niet-custodiale of informatieve tools zitten daarentegen dichter bij de rand van de perimeter, al is de grens echt vaag en afhankelijk van de feiten. Een app die nooit de sleutels van een gebruiker aanhoudt, nooit orders matcht en iemand alleen helpt om zijn eigen transacties tegen een openbaar netwerk te ondertekenen, doet iets anders dan een exchange die cliëntenmiddelen bundelt en in bewaring houdt. De Academy-pagina's van een tool als deze zijn bijvoorbeeld pure educatie en vereisen helemaal geen login, wat duidelijk buiten elke aanleiding voor een vergunning valt.",
        "Voor Atrium specifiek is de architectuur van belang. Wallets zijn per gebruiker en worden in rust met AES-256-GCM versleuteld, en de ondertekeningsnaad ontsleutelt een sleutel pas op het moment van ondertekenen, dus het ontwerp neigt in geest naar niet-custodiaal. Maar als zo'n platform ooit publiek zou gaan, echte cliëntenmiddelen zou aannemen of trades tussen gebruikers zou matchen, dan zou de analyse veranderen en zou professioneel juridisch advies onmisbaar zijn. Deze les is algemene educatie, geen juridisch advies; de regelgevende classificatie is een vraag voor een gekwalificeerde jurist die naar de specifieke feiten kan kijken.",
      ],
      example:
        "Neem twee apps. App A bewaart de privésleutels van elke cliënt op haar eigen servers, bundelt deposito's en matcht koop- en verkooporders in haar eigen orderboek. Dat is bewaring plus een handelsplatform, ondubbelzinnig een CASP die een FSMA-vergunning en volledige antiwitwascontroles nodig heeft. App B helpt een gebruiker uitsluitend om zijn eigen Stellar-transactie te ondertekenen met een sleutel die onder de controle van de gebruiker blijft en die net lang genoeg wordt ontsleuteld om te ondertekenen, en matcht niets tussen gebruikers. App B leunt veel dichter aan tegen een niet-custodiale tool, al hangt de exacte classificatie nog steeds af van de concrete feiten en moet ze door een jurist worden gecontroleerd.",
    },
    {
      id: "c37-l3",
      title: "Wat is GDPR en hoe is het van toepassing op crypto­platformen die persoonsgegevens opslaan?",
      paragraphs: [
        "De GDPR, de Algemene Verordening Gegevensbescherming van de EU, regelt hoe organisaties persoonsgegevens over identificeerbare personen verzamelen, gebruiken en opslaan. Een cryptoplatform valt er ondubbelzinnig onder op het moment dat het een e-mailadres, een login, een IP-log of een naam opslaat, want die identificeren allemaal een persoon. Op een blockchain zitten stelt je niet vrij: de off-chain accountlaag, waar een platform een echte identiteit aan activiteit koppelt, is gewone persoonsgegevens onder gewone regels.",
        "De verordening draait op een paar kernbeginselen. Elk gebruik van persoonsgegevens heeft een rechtsgrond nodig, zoals het uitvoeren van een overeenkomst met de gebruiker, een gerechtvaardigd belang, een wettelijke verplichting zoals het bijhouden van antiwitwasregisters, of vrijelijk gegeven toestemming. Dataminimalisatie zegt dat je alleen verzamelt wat je echt nodig hebt. Doelbinding zegt dat je gegevens alleen gebruikt voor de reden waarvoor je ze hebt verzameld. Opslagbeperking zegt dat je ze niet eeuwig bewaart. Daarbovenop hebben personen rechten: inzage in hun gegevens, rectificatie van fouten, wissing in bepaalde omstandigheden, overdraagbaarheid en bezwaar. Platformen dragen ook plichten, het scherpst de verplichting om een kwalificerend datalek zonder onnodige vertraging aan de toezichthouder te melden, doorgaans binnen tweeënzeventig uur.",
        "Crypto brengt een echte spanning met zich mee, want een openbaar grootboek is ontworpen om onveranderlijk en alleen-toevoegend te zijn, terwijl de GDPR een recht op wissing en een recht op rectificatie toekent. Je kunt een bevestigde on-chain transactie niet verwijderen of bewerken. Het aanvaarde technische antwoord is om persoonsgegevens off-chain te houden en alleen pseudonieme, niet-identificerende verwijzingen on-chain te plaatsen. Een Stellar-publieke sleutel is een pseudoniem, geen naam, dus op zichzelf is die niet direct identificerend, maar op het moment dat je database die sleutel aan een e-mailadres koppelt, worden het persoonsgegevens aan de accountkant die je onder de GDPR kunt en moet beheren.",
        "Concreet bepaalt dit hoe een platform wordt gebouwd. Sla e-mailadressen, wachtwoord-hashes en accountgegevens op in een off-chain database die je volledig beheert, zodat je verzoeken om inzage, rectificatie en wissing daar kunt honoreren. Schrijf nooit een ruwe identiteit naar het grootboek. Versleutel gevoelig materiaal in rust, minimaliseer wat je logt en stel bewaartermijnen in. Het accountmodel van Atrium past in deze vorm, met een per gebruiker versleutelde wallet en accountgegevens die in de eigen opslag van het platform worden bewaard in plaats van on-chain. Zoals altijd is dit algemene educatie, geen juridisch advies, en een echt complianceprogramma zou door een professional in gegevensbescherming moeten worden nagekeken.",
      ],
      example:
        "Een gebruiker vraagt een platform om zijn account te verwijderen. Het platform kan zijn e-mailadres, wachtwoord-hash en profiel uit zijn eigen off-chain database wissen en stoppen met het verwerken ervan, en zo het wissingsverzoek honoreren voor de identiteitsgegevens die het beheert. Wat het niet kan, is de vroegere Stellar-transacties van de gebruiker herschrijven, die permanent op het openbare grootboek staan. Dit is precies waarom een goed ontworpen platform de identificerende gegevens off-chain houdt en on-chain alleen ooit een pseudonieme publieke sleutel blootgeeft, zodat een verwijderingsverzoek überhaupt technisch mogelijk is.",
    },
    {
      id: "c37-l4",
      title: "Wat zijn CBDC's en hoe verhouden ze zich tot crypto?",
      paragraphs: [
        "Een CBDC, een Central Bank Digital Currency, is digitaal geld dat rechtstreeks door een centrale bank wordt uitgegeven. Het is een digitale vorm van soevereine valuta, een directe verplichting van de staat, op dezelfde manier als fysiek contant geld dat is, alleen in elektronische vorm. Veel centrale banken doen er onderzoek naar of testen ze, waarbij de digitale euro het meest relevante voorbeeld is voor Europese gebruikers, naast lopende of vergevorderde projecten elders. De aangevoerde motieven variëren van het moderniseren van betalingen en het behouden van publiek geld in een cashloze economie tot het handhaven van monetaire soevereiniteit naarmate privaat digitaal geld groeit.",
        "Het is belangrijk te zien hoe een CBDC verschilt van de crypto die de meeste traders kennen. Gedecentraliseerde crypto-assets zoals Bitcoin of Stellars eigen XLM draaien op permissionless netwerken zonder centrale uitgever, en hun aanbod en regels worden bepaald door protocol en consensus in plaats van door een staat. Een CBDC is het tegenovergestelde: gecentraliseerd, permissioned, uitgegeven en beheerd door de centrale bank, en doorgaans niet iets waarvan de markt het aanbod ontdekt. De technologie mag oppervlakkig gezien vergelijkbaar lijken, en een CBDC gebruikt intern misschien zelfs een gedistribueerd grootboek, maar het vertrouwensmodel is omgekeerd. Het ene verwijdert een centrale autoriteit; het andere digitaliseert die.",
        "CBDC's verschillen ook van stablecoins, ook al streven beide naar een stabiele waarde. Een door fiat gedekte stablecoin zoals een gereguleerde token in USDC-stijl wordt uitgegeven door een privaat bedrijf en gedekt door reserves die de uitgever aanhoudt; de stabiliteit ervan hangt af van het feit dat die uitgever de terugbetaling nakomt en van de kwaliteit van de reserves. Een CBDC is het geld zelf, een vordering op de centrale bank in plaats van op een privaat bedrijf, dus het draagt geen kredietrisico van een uitgever zoals een private stablecoin dat doet. Onder MiCA is een private eurostablecoin een gereguleerde e-money token; een digitale euro zou daarentegen publiek geld zijn dat onder zijn eigen speciale wettelijke kader valt.",
        "Voor een op Stellar gebaseerde trader is het praktische beeld speculatief maar de moeite waard om te begrijpen. Stellar is gebouwd als een netwerk voor betalingen en het uitgeven van assets, en in principe zou een CBDC of een getokeniseerd deposito als asset op zo'n netwerk kunnen worden uitgegeven, samen met private stablecoins en gedecentraliseerde assets. Als dat gebeurt, houd je op een dag misschien een publieke digitale-valutatoken en een private stablecoin in dezelfde wallet aan, onderworpen aan een trustline en de gebruikelijke reserve. Dit is vooruitkijkende context in plaats van een voorspelling, en zeker geen financieel advies.",
      ],
      example:
        "Denk aan drie euro's in drie vormen. Een bankbiljet in je zak is publiek geld, een directe vordering op de centrale bank. Een in euro luidende stablecoin is privaat geld, een vordering op het bedrijf dat hem heeft uitgegeven en op de reserves die hem dekken. Een digitale euro-CBDC zou de elektronische tweeling van het bankbiljet zijn, nog steeds een directe vordering op de centrale bank maar digitaal bruikbaar. Alle drie kunnen ze één euro zeggen, en toch is wie jou die euro verschuldigd is, en dus welk risico je draagt, in elk geval totaal verschillend.",
    },
    {
      id: "c37-l5",
      title: "Waar gaat crypto naartoe?",
      paragraphs: [
        "Twee krachten domineren de geloofwaardige toekomstvisie: de tokenisatie van real-world assets en institutionele adoptie. RWA-tokenisatie betekent dat off-chain assets zoals staatsobligaties, geldmarktfondsen, vastgoed of facturen worden weergegeven als overdraagbare tokens op een blockchain. De aantrekkingskracht ligt in programmeerbare afwikkeling, fractioneel eigendom en vrijwel onmiddellijke overdracht met een duidelijk controlespoor, waarmee trage, versnipperde backofficeprocessen worden vervangen. Institutionele adoptie is de andere helft: gereguleerde fondsen, banken en betaalbedrijven die van experimenten naar productie gaan, juist aangemoedigd door kaders als MiCA die hun juridische zekerheid geven. Regelgeving en adoptie versterken elkaar hier veeleer dan dat ze uit elkaar trekken.",
        "Stellar is voor deze specifieke richting ongewoon goed gepositioneerd, omdat het doelgericht is gebouwd voor betalingen en het uitgeven van assets in plaats van als een universele wereldcomputer. Een asset uitgeven op Stellar is een eersteklas, goedkope operatie; trustlines geven uitgevers en houders expliciete opt-in-controle; en path payments wikkelen een omwisseling atomisch af over markten heen, waarbij ze door het SDEX-orderboek en AMM-pools springen om de doel-asset in één transactie te leveren. De kosten zijn minuscuul, in de orde van een fractie van een cent, en de afwikkeling wordt gemeten in seconden onder het Stellar Consensus Protocol, een implementatie van Federated Byzantine Agreement waarbij nodes quorumsets vertrouwen in plaats van te minen. Voor het verplaatsen van een getokeniseerde dollar of obligatie zijn dat precies de eigenschappen die ertoe doen.",
        "Het nieuwere stuk is Soroban, het smart-contractplatform van Stellar, dat programmeerbare logica toevoegt aan die basis van betalingen en assets. Soroban maakt on-chain protocollen mogelijk voor lenen, gestructureerd rendement en swaps, en echte projecten bouwen er al: Blend voor leenmarkten, DeFindex voor getokeniseerde strategiekluizen, en Soroswap als on-chain exchange en aggregator. Gecombineerd met native stablecoins zoals USDC en de mogelijkheid om RWA's als assets weer te geven, wijst dit erop dat Stellar functioneert als afwikkelingsinfrastructuur waar gereguleerde getokeniseerde waarde en DeFi-composability samenkomen, in plaats van als een puur speculatieve speeltuin.",
        "Niets hiervan is gegarandeerd, en eerlijke analyse blijft geaard. Tokenisatie is eerder overbeloofd, regelgevende tijdlijnen lopen uit, en adoptie kan stokken. De realistische lezing is richtinggevend in plaats van zeker: meer gereguleerde toegangswegen, meer getokeniseerde traditionele assets, meer institutionele stroom, en netwerken die geoptimaliseerd zijn voor betalingen en uitgifte, met Stellar prominent daaronder, die concurreren om de rails te zijn. Voor een trader is de conclusie om de mechaniek te blijven leren, gereguleerde en goed begrepen platformen te gebruiken, en elke afzonderlijke prognose, deze inbegrepen, als context in plaats van als belofte te behandelen. Dit is educatie, geen financieel advies.",
      ],
      example:
        "Stel je een getokeniseerd kortlopend staatsobligatiefonds voor dat als Stellar-asset is uitgegeven. Een instelling houdt het aan naast een USDC-saldo in dezelfde wallet, elk achter zijn eigen trustline. Wanneer ze cash nodig heeft, zet een path payment een deel van het getokeniseerde fonds atomisch om in USDC door te routeren via het SDEX en de AMM-pools, met afwikkeling in seconden voor een fractie van een cent, terwijl een Soroban-contract automatisch elke ongebruikte USDC naar een Blend-leenmarkt zou kunnen wegsluizen voor rendement. Die ene stroom, gereguleerde getokeniseerde asset plus stablecoin plus programmeerbare afwikkeling, is de concrete vorm van waar veel hiervan naartoe gaat.",
    },
  ],
  quiz: [
    {
      id: "c37-q1",
      prompt: "Hoe wordt een door fiat gedekte eurostablecoin die aan EU-gebruikers wordt verkocht onder MiCA doorgaans geclassificeerd, en wat brengt dat met zich mee?",
      options: [
        {
          text: "Als een e-money token (EMT), dus de uitgever moet volledig gedekte, gescheiden reserves aanhouden en terugbetaling tegen pari honoreren.",
          explanation:
            "Juist. Een token die één officiële valuta één-op-één volgt, valt in de EMT-categorie van MiCA, en dat is de strengste behandeling: volledige dekking, gescheiden liquide reserves, een whitepaper en op verzoek terugbetaling tegen pari. Niet-conforme eurostablecoins kunnen voor EU-gebruikers worden geschrapt.",
        },
        {
          text: "Als een utility token, dus vrijgesteld van elke reserve- of vergunningsvereiste.",
          explanation:
            "Fout. Utility tokens vormen de restcategorie 'andere crypto-assets'. Een aan een valuta gekoppelde stablecoin is juist geen utility token, en ze krijgt de meest veeleisende stablecoin-verplichtingen van MiCA, geen vrijstelling.",
        },
        {
          text: "Als een effect onder de bestaande MiFID-regels, dus MiCA is er helemaal niet op van toepassing.",
          explanation:
            "Fout. MiCA regelt crypto-assets die niet al onder bestaande financiële wetgeving vallen; een aan fiat gekoppelde stablecoin wordt binnen MiCA als EMT behandeld, niet uitgezonderd als een MiFID-effect.",
        },
        {
          text: "Als een asset-referenced token (ART), omdat elke stablecoin een mandje van assets volgt.",
          explanation:
            "Fout. ART's verwijzen naar een mandje van assets of valuta. Een stablecoin die één-op-één aan één officiële valuta is gekoppeld, is een EMT, geen ART.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c37-q2",
      prompt: "Een Belgisch platform bewaart de privésleutels van elke cliënt, bundelt deposito's en matcht koop- en verkooporders in zijn eigen orderboek. Wat is de meest correcte regelgevende lezing?",
      options: [
        {
          text: "Er is geen vergunning nodig, want crypto is in België ongereguleerd.",
          explanation:
            "Fout. Cryptodiensten zijn gereguleerd: de FSMA verleent vergunningen aan CASP's onder MiCA en houdt er toezicht op, en antiwitwasregels golden daarvoor al voor bewaar- en exchange-aanbieders.",
        },
        {
          text: "Het levert bewaring en exploiteert een handelsplatform, dus het is zeer waarschijnlijk een CASP die een FSMA-vergunning plus antiwitwascontroles nodig heeft.",
          explanation:
            "Juist. Het aanhouden van cliëntensleutels is bewaring en het matchen van cliëntenorders is het exploiteren van een handelsplatform. Beide zijn gereguleerde CASP-activiteiten, dus het platform heeft zeer waarschijnlijk een vergunning van de FSMA nodig plus know-your-customer- en transactiemonitoringcontroles.",
        },
        {
          text: "Het heeft alleen een vergunning nodig als het ook beleggingsadvies geeft; bewaring en het matchen van orders zijn ongereguleerd.",
          explanation:
            "Fout. Bewaring en het exploiteren van een handelsplatform zijn elk onafhankelijk gereguleerde CASP-activiteiten. Advies is nog een gereguleerde activiteit, niet de enige aanleiding.",
        },
        {
          text: "Het valt automatisch buiten de perimeter omdat alles op een openbare blockchain wordt afgewikkeld.",
          explanation:
            "Fout. Wat telt is wat het platform doet, niet waar de afwikkeling plaatsvindt. Het bundelen van deposito's, het aanhouden van sleutels en het matchen van orders plaatsen het ondubbelzinnig binnen de vergunningsperimeter, ongeacht het onderliggende grootboek.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q3",
      prompt: "Hoe zou een GDPR-conform cryptoplatform het recht op wissing moeten verzoenen met een onveranderlijk openbaar grootboek?",
      options: [
        {
          text: "Door de vroegere on-chain transacties van de gebruiker te herschrijven of te verwijderen wanneer om wissing wordt gevraagd.",
          explanation:
            "Fout. Bevestigde on-chain transacties zijn onveranderlijk en kunnen niet worden verwijderd of herschreven; dat is het hele ontwerp van een openbaar grootboek. De oplossing moet off-chain liggen.",
        },
        {
          text: "Door de GDPR volledig te negeren, aangezien blockchains vrijgesteld zijn van gegevensbeschermingsrecht.",
          explanation:
            "Fout. Er is geen blockchain-vrijstelling. De off-chain accountlaag die een identiteit aan activiteit koppelt, zoals een e-mailadres gekoppeld aan een publieke sleutel, is gewone persoonsgegevens onder gewone regels.",
        },
        {
          text: "Door identificerende gegevens off-chain te houden in een beheerde database en alleen pseudonieme verwijzingen on-chain te plaatsen, zodat wissing off-chain kan worden gehonoreerd.",
          explanation:
            "Juist. Een publieke sleutel is een pseudoniem, geen naam. Door e-mailadressen, hashes en profielen off-chain te houden, kan het platform de identiteitsgegevens die het beheert verwijderen of rectificeren, terwijl het grootboek alleen niet-identificerende verwijzingen bevat die om te beginnen nooit een ruwe identiteit waren.",
        },
        {
          text: "Door de hele blockchain te versleutelen zodat de gegevens als verwijderd kunnen worden beschouwd zodra de sleutel wordt weggegooid.",
          explanation:
            "Fout. Je kunt geen openbaar, gedeeld grootboek versleutelen dat je niet beheert, en het 'crypto-shredden' van een netwerkbrede keten werkt zo niet. Het aanvaarde antwoord is om persoonsgegevens vanaf het begin off-chain te houden.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c37-q4",
      prompt: "Wat is het fundamentele verschil tussen een CBDC en een private, door fiat gedekte stablecoin?",
      options: [
        {
          text: "Er is geen verschil; het zijn allebei gewoon digitale euro's of dollars.",
          explanation:
            "Fout. Ze mogen dan allebei op een stabiele waarde mikken, maar wie jou het geld verschuldigd is verschilt volledig, en juist dat verschil is de hele kern.",
        },
        {
          text: "Een CBDC is een directe vordering op de centrale bank (publiek geld), terwijl een stablecoin een vordering is op een private uitgever en zijn reserves.",
          explanation:
            "Juist. Een CBDC is soeverein geld dat door de centrale bank wordt uitgegeven en geen kredietrisico van een private uitgever draagt. Een stablecoin wordt door een bedrijf uitgegeven en hangt af van het feit dat die uitgever de terugbetaling nakomt en goede reserves aanhoudt; onder MiCA is het een gereguleerde e-money token, terwijl een digitale euro publiek geld onder zijn eigen kader zou zijn.",
        },
        {
          text: "Een CBDC is gedecentraliseerd en permissionless, terwijl een stablecoin centraal wordt uitgegeven.",
          explanation:
            "Fout, en omgekeerd. Een CBDC is gecentraliseerd en permissioned, uitgegeven en beheerd door de centrale bank. Het zijn gedecentraliseerde assets zoals Bitcoin of XLM die permissionless zijn, niet de CBDC.",
        },
        {
          text: "Een stablecoin kan nooit gereguleerd worden, terwijl een CBDC altijd gereguleerd is.",
          explanation:
            "Fout. Door fiat gedekte stablecoins zijn onder MiCA gereguleerd als e-money tokens. Het echte onderscheid is de uitgever en de aard van de vordering, niet of er regelgeving bestaat.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q5",
      prompt: "Waarom wordt Stellar vaak genoemd als goed gepositioneerd voor de tokenisatie van real-world assets en voor betalingen?",
      options: [
        {
          text: "Omdat het doelgericht is gebouwd voor betalingen en het uitgeven van assets, met goedkope eersteklas asset-uitgifte, trustlines, atomische path payments en snelle SCP-afwikkeling.",
          explanation:
            "Juist. Stellar geeft assets uit als een eersteklas, goedkope operatie, gebruikt trustlines voor expliciete opt-in-controle, wikkelt omwisselingen atomisch af via path payments over het SDEX en de AMM-pools, en finaliseert in seconden onder het Stellar Consensus Protocol. Soroban voegt daar dan programmeerbare logica aan toe. Dat zijn precies de eigenschappen die getokeniseerde waarde nodig heeft.",
        },
        {
          text: "Omdat Stellar sneller nieuwe blokken mint dan enige andere proof-of-work-keten, wat het de hoogste veiligheid geeft.",
          explanation:
            "Fout. Stellar mint helemaal niet. Het gebruikt het Stellar Consensus Protocol, een Federated Byzantine Agreement waarbij nodes quorumsets vertrouwen, geen proof-of-work.",
        },
        {
          text: "Omdat Stellar geen kosten en geen reserves heeft, dus getokeniseerde assets zijn volledig gratis om aan te houden en te verplaatsen.",
          explanation:
            "Fout. De kosten zijn minuscuul, in de orde van een fractie van een cent, maar niet nul, en elk account houdt een kleine XLM-minimumreserve aan, met ongeveer een halve XLM extra per trustline. 'Goedkoop' klopt; 'gratis' niet.",
        },
        {
          text: "Omdat Soroban Stellar elke universele applicatie laat draaien, waardoor betalingen en uitgifte irrelevant worden.",
          explanation:
            "Fout. Soroban voegt smart contracts toe bovenop de basis van betalingen en uitgifte van Stellar, en echte projecten zoals Blend, DeFindex en Soroswap bouwen er, maar het vult de asset-rails aan in plaats van ze irrelevant te maken. De focus op betalingen is juist de kracht.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
