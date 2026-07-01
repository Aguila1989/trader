import type { Chapter } from "../../types";

export const chapter17: Chapter = {
  id: "c17",
  number: 17,
  level: "BASIC",
  title: "Je wallet aanmaken en beschermen",
  description:
    "Wat een crypto-wallet echt is, het verschil tussen je publieke en je geheime sleutel, waarom je de geheime nooit mag delen, en hoe je hem veilig offline bewaart.",
  lessons: [
    {
      id: "c17-l1",
      title: "Wat is een crypto-wallet?",
      paragraphs: [
        "Een crypto-wallet is eigenlijk geen plek waar je munten worden bewaard — je munten leven op de blockchain. Een wallet is het paar sleutels waarmee je kunt bewijzen dat de munten van jou zijn en waarmee je ze kunt verplaatsen. Zie het als je identiteit en je handtekening op het netwerk in één.",
        "De duidelijkste manier om het voor te stellen is een brievenbus. Je wallet heeft een publiek adres, net als het adres dat op de voorkant van een brievenbus staat: iedereen kan het lezen en iedereen kan er iets in stoppen. Om de bus te openen en eruit te halen wat erin zit, heb je de sleutel nodig — en alleen jij hoort die sleutel ooit te hebben.",
        "Een wallet heeft dus twee delen die twee verschillende taken doen. Het ene deel is publiek en bedoeld om te delen, zodat mensen je geld kunnen sturen. Het andere deel is privé en bedoeld om te verbergen, want het is het enige waarmee dat geld kan worden uitgegeven. De volgende lessen bekijken elk deel afzonderlijk.",
      ],
      example:
        "Stel je een brievenbus aan straat voor. Het adres (\"Eikenlaan 12\") is je publieke sleutel — dat zet je met plezier op brieven zodat mensen je kunnen schrijven. Het kleine sleuteltje in je zak waarmee de bus opengaat, is je geheime sleutel. Een buur kan je een kaartje sturen met het adres, maar zonder de sleutel kan hij de bus nooit openen en eruit halen wat erin zit.",
    },
    {
      id: "c17-l2",
      title: "Wat is een publieke sleutel en wat is een geheime sleutel?",
      paragraphs: [
        "Je publieke sleutel is het adres van je wallet. Die mag je veilig met iedereen delen — je geeft hem door zodat mensen je munten kunnen sturen, net zoals je je brievenbusadres doorgeeft zodat mensen je brieven kunnen sturen. Hem delen kan je niet schaden; het ergste dat iemand ermee kan doen, is je geld sturen.",
        "Je geheime sleutel (soms private sleutel genoemd) is compleet anders. Het is het enige waarmee een betaling uit je wallet kan worden goedgekeurd. Wie de geheime sleutel heeft, beheert het geld — punt. Er is geen extra wachtwoord, geen beheerder om te bellen en geen manier om een overdracht terug te draaien zodra hij is ondertekend.",
        "Daarom moeten de twee sleutels op tegengestelde manieren worden behandeld. De publieke sleutel is bedoeld om gezien te worden; de geheime sleutel is bedoeld om voor altijd verborgen te blijven. Als je ooit twijfelt welke je op het punt staat te delen, is de veilige regel simpel: deel nooit de geheime.",
      ],
      example:
        "Op Stellar zien de twee sleutels er zelfs anders uit zodat je ze uit elkaar kunt houden. Een publieke sleutel begint met de letter G, zoals \"GABC...\" — dat is degene die je plakt wanneer iemand je wil betalen. Een geheime sleutel begint met de letter S, zoals \"SABC...\" — die houd je voor jezelf en toon je aan niemand, nooit.",
    },
    {
      id: "c17-l3",
      title: "Waarom je je geheime sleutel nooit mag delen — echt nooit",
      paragraphs: [
        "Je geheime sleutel delen is hetzelfde als iemand je wallet overhandigen zonder enige manier om hem terug te krijgen. Wie hem heeft, kan elke munt in seconden leeghalen, en omdat blockchain-overdrachten definitief zijn en niet kunnen worden teruggedraaid, is er geen bank om te bellen en geen manier om het geld terug te halen. Het verlies is permanent.",
        "Oplichters weten dat dit de hoofdsleutel is, dus de meeste aanvallen zijn gewoon trucs om je hem te laten prijsgeven. Een veelvoorkomende is nep-\"support\": iemand die zich in een chat voordoet als een helpdesk zegt dat hij je geheime sleutel of seed phrase nodig heeft om je account te \"repareren\" of je geld te \"deblokkeren\". Echte support heeft je geheime sleutel nooit nodig — wie erom vraagt, probeert je te bestelen.",
        "Andere vallen ogen net zo overtuigend. Een website of pop-up kan je vragen je wallet te \"importeren\" of te \"verifiëren\" door je seed phrase in te typen — dat is seed-phrase-phishing, en hem invoeren geeft de aanvaller alles. De regel kent geen uitzonderingen: je geheime sleutel en seed phrase typ je nooit in een chat, een formulier, een e-mail of een website waar je via een link naartoe bent gestuurd.",
      ],
      example:
        "Iemand stuurt je een bericht in een support-chat: \"Ik zie het probleem op je account — plak gewoon je geheime sleutel zodat ik de toegang kan herstellen.\" Op het moment dat je hem plakt, ondertekenen ze een overdracht en is elke munt weg, zonder enige manier om het terug te draaien. De juiste reactie is niets te delen, de chat te verlaten en het te melden: geen enkele legitieme dienst zal ooit om die sleutel vragen.",
    },
    {
      id: "c17-l4",
      title: "Wat betekent \"jouw sleutels, jouw crypto\"?",
      paragraphs: [
        "\"Jouw sleutels, jouw crypto\" is een gezegde dat het hele idee van self-custody samenvat: als je de geheime sleutels zelf bewaart, ben je echt eigenaar van je munten en beheer je ze. Niemand kan ze bevriezen, afnemen of je beletten ze te verplaatsen, want het netwerk gehoorzaamt alleen wie ondertekent met de sleutel.",
        "De keerzijde is de waarschuwing: \"niet jouw sleutels, niet jouw crypto.\" Wanneer je munten achterlaat op een exchange of een dienst die de sleutels voor je bewaart — custodial genoemd — beheer je ze niet echt. Je vertrouwt erop dat dat bedrijf je opname honoreert. Als het accounts bevriest, failliet gaat of gehackt wordt, kan je toegang verdwijnen ook al waren de munten \"van jou\".",
        "Self-custody geeft je de controle en de verantwoordelijkheid samen. Er is geen supportlijn om een verloren sleutel te herstellen, dus de veiligheid van je geld hangt af van hoe goed je die sleutel beschermt. Die afweging — volledige controle in ruil voor volledige verantwoordelijkheid — is de kern van je eigen crypto bewaren.",
      ],
      example:
        "Twee mensen \"bezitten\" elk 100 munten. De een houdt ze op een exchange die de sleutels bewaart; de ander houdt ze in een wallet waarvan alleen zij de geheime sleutel heeft. Op een ochtend stopt de exchange opnames — de eerste persoon kan zijn munten niet aanraken en kan alleen maar wachten en hopen. De tweede persoon ondertekent een overdracht en verplaatst haar munten vrij, want haar sleutels zijn van haar. Dat is het verschil waar het gezegde op wijst.",
    },
    {
      id: "c17-l5",
      title: "Hoe je je geheime sleutel veilig offline bewaart",
      paragraphs: [
        "De veiligste plek voor een geheime sleutel is offline, weg van alles wat met internet verbonden is. Alles wat online staat, kan in principe door een aanvaller worden bereikt, dus het doel is de sleutel te bewaren op iets wat niet via een netwerk kan worden gehackt — het eenvoudigst op papier.",
        "Behandel de opgeschreven sleutel als de fysieke sleutel van je huis. Je zou je huissleutel niet op de voordeur plakken of er een foto van online zetten, en dezelfde voorzichtigheid geldt hier. Schrijf de sleutel (of seed phrase) op papier, bewaar hem ergens privé en veilig, en overweeg een tweede kopie op een andere veilige plek voor het geval de eerste verloren of beschadigd raakt.",
        "Even belangrijk is weten waar de sleutel nooit terecht mag komen. Bewaar hem nooit in een screenshot, in je fotogalerij, in e-mail, in notities die naar de cloud synchroniseren, of in een chat aan jezelf — die kunnen allemaal worden gehackt, gelekt of gesynchroniseerd naar een apparaat dat je niet meer beheert. Voor grotere bedragen houdt een hardware wallet de sleutel op een speciaal offline apparaat en ondertekent hij zonder de sleutel ooit bloot te stellen.",
      ],
      example:
        "Een zorgvuldige aanpak: schrijf je geheime sleutel met de hand op een vel papier, verzegel het en sluit het op in een lade of kluis thuis — eventueel met een tweede kopie bij een vertrouwd familielid. Een riskante aanpak: maak een foto van de sleutel \"zodat je hem niet kwijtraakt.\" Die foto uploadt stilletjes naar je cloudback-up, en op het moment dat dat account wordt gekraakt, gaat je wallet mee.",
    },
    {
      id: "c17-l6",
      title: "De weg vinden in de app & geld ontvangen",
      paragraphs: [
        "De app is opgebouwd rond een menu aan de linkerkant waarmee je tussen de pagina's springt: Traden, Ontvangen & Versturen, Openstaande betalingen, Logs en de Academy. Op een telefoon is dat menu weggeschoven — tik op het ☰-icoon (hamburger) in de hoek om het open te schuiven, kies een pagina en het klapt weer dicht. De Academy staat onder een scheidingslijn, los van de tradingpagina's, want het is de plek waar je komt om te leren, niet om te traden — en je hoeft er nooit voor in te loggen.",
        "Om geld te ontvangen open je \"Ontvangen & Versturen\" in het menu. Daar zie je het publieke adres van je wallet — hetzelfde G...-adres uit de vorige lessen — samen met een QR-code. Je kunt het adres kopiëren en doorsturen naar wie je betaalt, of die persoon de QR-code op je scherm laten scannen met zijn wallet-app.",
        "Een QR-code is niets mysterieuzer dan een vierkante streepjescode: in dit geval bevat hij gewoon je publieke adres als een patroon van stipjes. Omdat het alleen de publieke kant van je wallet is, is hij volkomen veilig om te tonen, te delen, te screenshotten of af te drukken. Het ergste dat iemand ermee kan doen, is je geld sturen. Onder de code staat het label \"Scan om naar deze wallet te sturen\" — dat zegt de verzender dat hij de camera van zijn wallet-app erop moet richten.",
        "De ene regel die nooit verandert loopt rechtstreeks door uit de eerdere lessen: een QR-code bevat altijd alleen je publieke adres. Je geheime sleutel mag nooit in een QR-code, een screenshot, of waar dan ook een camera hem zou kunnen lezen terechtkomen. Als een app of een persoon je ooit een QR-code toont en zegt dat die een geheime sleutel of seed phrase bevat, beschouw dat dan als oplichting en loop weg.",
      ],
      example:
        "Een vriend wil je wat XLM sturen. Je opent \"Ontvangen & Versturen\" in het menu (op je telefoon tik je eerst op ☰ om het tevoorschijn te halen), en je G...-adres verschijnt met een QR-code onder de woorden \"Scan om naar deze wallet te sturen\". Je vriend opent zijn eigen wallet-app, richt de camera op je scherm en het adres wordt automatisch ingevuld — geen getik, geen fouten. Het geld komt binnen, en op geen enkel moment heb je iets geheims prijsgegeven.",
    },
  ],
  quiz: [
    {
      id: "c17-q1",
      prompt:
        "Iemand in een support-chat vraagt om je geheime sleutel om je account te \"repareren\". Wat doe je?",
      options: [
        {
          text: "Deel hem nooit — verlaat de chat en meld ze; echte support heeft je geheime sleutel nooit nodig.",
          explanation:
            "Juist. Wie om je geheime sleutel vraagt, probeert je geld te stelen. Legitieme support heeft hem nooit nodig, dus de enige veilige zet is niets te delen.",
        },
        {
          text: "Deel hem, maar voor de zekerheid alleen de eerste helft.",
          explanation:
            "Nee. Je geheime sleutel mag nooit worden gedeeld, geheel noch gedeeltelijk. Er is geen versie van hem afgeven die veilig is.",
        },
        {
          text: "Deel hem, want supportmedewerkers zijn te vertrouwen om je te helpen.",
          explanation:
            "Nee. \"Support\" die om je geheime sleutel vraagt, is de klassieke oplichting. Echte support heeft hem nooit nodig, en hem weggeven laat ze je wallet onmiddellijk leeghalen.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q2",
      prompt: "Welke sleutel mag je veilig prijsgeven zodat mensen je munten kunnen sturen?",
      options: [
        {
          text: "Je publieke sleutel — net als een brievenbusadres is hij bedoeld om te delen.",
          explanation:
            "Juist. De publieke sleutel (op Stellar begint hij met G) is je adres. Hem delen laat mensen je alleen geld sturen.",
        },
        {
          text: "Je geheime sleutel — die hebben ze nodig om je geld te sturen.",
          explanation:
            "Nee. Mensen hebben je geheime sleutel nooit nodig om je te betalen. De geheime sleutel geeft alleen geld uit, dus hem delen laat iemand alles afnemen.",
        },
        {
          text: "Beide sleutels, zodat de betaling zeker aankomt.",
          explanation:
            "Nee. Alleen de publieke sleutel is nodig om geld te ontvangen. Je geheime sleutel moet altijd privé blijven.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q3",
      prompt: "Wat betekent \"jouw sleutels, jouw crypto\"?",
      options: [
        {
          text: "Als je de geheime sleutels zelf bewaart, beheer je je munten echt; bewaart iemand anders ze, dan vertrouw je op dat bedrijf.",
          explanation:
            "Juist. Self-custody betekent dat de controle ligt bij wie de sleutels heeft. Laat ze bij een dienst en je toegang hangt af van die dienst.",
        },
        {
          text: "Je sleutels maken de munten meer geld waard.",
          explanation:
            "Nee. Je eigen sleutels bewaren gaat over controle, niet over waarde. De prijs van de munten staat los van wie de sleutels heeft.",
        },
        {
          text: "Je moet een nieuwe sleutel maken voor elke munt die je bezit.",
          explanation:
            "Nee. Het gezegde gaat over wie het geld beheert, niet over een sleutel per munt aanmaken.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q4",
      prompt: "Waar bewaar je je geheime sleutel het veiligst?",
      options: [
        {
          text: "Offline — op papier geschreven op een veilige plek, of op een hardware wallet.",
          explanation:
            "Juist. De sleutel offline houden plaatst hem buiten bereik van netwerkaanvallen. Papieren back-ups en hardware wallets zijn de standaard veilige opties.",
        },
        {
          text: "In een screenshot in de fotogalerij van je telefoon.",
          explanation:
            "Nee. Foto's synchroniseren naar de cloud en kunnen worden gehackt of gelekt. Een screenshot van je sleutel is een van de riskantste plekken om hem te bewaren.",
        },
        {
          text: "In een e-mail aan jezelf zodat je hem altijd kunt terugvinden.",
          explanation:
            "Nee. E-mail staat online en kan worden gekraakt. Een sleutel in een inbox ligt bloot voor iedereen die in dat account komt.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q5",
      prompt:
        "Een website vraagt je je seed phrase te typen om je wallet te \"verifiëren\". Wat gebeurt er?",
      options: [
        {
          text: "Het is een phishing-oplichting — de seed phrase invoeren geeft de aanvaller volledige controle over je wallet.",
          explanation:
            "Juist. Legitieme apps vragen je nooit je seed phrase in een website te typen. Dat doen onthult het hoofdgeheim en laat de aanvaller alles afnemen.",
        },
        {
          text: "Het is een normale veiligheidsstap die alle wallets vereisen.",
          explanation:
            "Nee. Je seed phrase in een website typen is nooit een normale stap — het is de klassieke seed-phrase-phishingaanval.",
        },
        {
          text: "Het is prima zolang de website er professioneel uitziet.",
          explanation:
            "Nee. Een verzorgde uitstraling is juist hoe oplichting vertrouwen wint. De seed phrase mag nooit in een website worden ingevoerd, hoe hij er ook uitziet.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q6",
      prompt:
        "Is het veilig om de QR-code van je publieke adres te delen zodat iemand je kan betalen?",
      options: [
        {
          text: "Ja — een QR-code van je publieke adres is veilig om te tonen, te delen of te screenshotten; het ergste dat iemand ermee kan doen, is je geld sturen.",
          explanation:
            "Juist. De QR-code bevat alleen je publieke (G...) adres, dat bedoeld is om te delen. Hij kan niet worden gebruikt om je geld uit te geven.",
        },
        {
          text: "Nee — een QR-code bevat altijd je geheime sleutel, dus hem tonen laat iedereen je wallet leeghalen.",
          explanation:
            "Nee. Je ontvangst-QR-code bevat alleen het publieke adres. Je geheime sleutel hoort sowieso nooit in een QR-code terecht te komen.",
        },
        {
          text: "Alleen als je eerst een deel van de code onleesbaar maakt.",
          explanation:
            "Nee. Er valt niets te verbergen — een QR-code met een publiek adres is in zijn geheel veilig om te delen. Hem onleesbaar maken zou de betaling alleen maar laten mislukken.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q7",
      prompt: "Waar ga je in de app naartoe om geld te ontvangen?",
      options: [
        {
          text: "Naar de pagina \"Ontvangen & Versturen\" in het menu, waar je publieke adres en de bijbehorende QR-code staan.",
          explanation:
            "Juist. \"Ontvangen & Versturen\" toont je publieke adres en QR-code, zodat een verzender het adres kan kopiëren of de code kan scannen.",
        },
        {
          text: "Naar de Academy, nadat je de veiligheidsquiz hebt gehaald.",
          explanation:
            "Nee. De Academy is alleen om te leren en verwerkt nooit geld. Je ontvangt geld via de pagina \"Ontvangen & Versturen\".",
        },
        {
          text: "Naar de Logs-pagina, door je transactiegeschiedenis te lezen.",
          explanation:
            "Nee. Logs toont alleen activiteit uit het verleden. Om geld te ontvangen open je \"Ontvangen & Versturen\" en deel je je adres of QR-code.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
