import type { Chapter } from "../../types";

export const chapter18: Chapter = {
  id: "c18",
  number: 18,
  level: "ADVANCED",
  title: "Een wallet importeren en keypairs begrijpen",
  description:
    "Hoe een Stellar-keypair wordt gegenereerd, wat er echt gebeurt wanneer je een wallet importeert, hoe deze app je geheime sleutel in rust versleutelt, hoe testnet-funding werkt, en de risico's van het vervangen van je wallet.",
  lessons: [
    {
      id: "c18-l1",
      title: "Wat is een Stellar-keypair en hoe wordt het gegenereerd?",
      paragraphs: [
        "Een Stellar-keypair is de publieke sleutel en de geheime sleutel die bij elkaar horen, gegenereerd als een bijpassend paar. Stellar gebruikt een handtekeningschema dat ed25519 heet, een moderne vorm van publieke-sleutelcryptografie die snel, compact en breed vertrouwd is. Het paar is wiskundig verbonden: de publieke sleutel kan altijd uit de geheime sleutel worden afgeleid, maar nooit andersom.",
        "Het begint met een seed — een willekeurige waarde van 32 bytes. De kwaliteit van die willekeur is alles: als de seed echt onvoorspelbaar is, kan de resulterende sleutel niet worden geraden, zelfs niet door een aanvaller met enorme rekenkracht. De seed wordt door ed25519 gehaald om de geheime sleutel te maken, en de geheime sleutel wordt door dezelfde wiskunde gehaald om de bijbehorende publieke sleutel te maken.",
        "Stellar codeert de twee helften vervolgens zodat ze makkelijk uit elkaar te houden zijn. De publieke sleutel wordt zo gecodeerd dat hij met de letter G begint (het is je accountadres), en de geheime sleutel begint met de letter S. Dezelfde onderliggende wiskunde, twee leesbare vormen — een die je veilig kunt delen, een die je moet bewaken.",
      ],
      example:
        "Een keypair genereren is als 32 keer met een eerlijke dobbelsteen met 256 zijden gooien om een geheime seed te krijgen die niemand kon voorspellen, en die dan door een eenrichtingsmachine voeren die twee labels print: een G...-adres dat je mag uitdelen, en een S...-geheim dat alleen jij houdt. Omdat de machine maar één kant op werkt, kan niemand de labels achterstevoren lezen om je seed te herstellen.",
    },
    {
      id: "c18-l2",
      title: "Wat gebeurt er wanneer je een bestaande wallet importeert?",
      paragraphs: [
        "Een wallet importeren betekent de app vertellen over een account dat je al hebt, in plaats van een nieuw aan te maken. Je geeft je bestaande geheime sleutel op (de S...-waarde). Daaruit leidt de app de bijbehorende publieke sleutel af — het G...-adres — met dezelfde ed25519-wiskunde, zodat hij je adres leert zonder dat je het ooit intypt.",
        "Met het adres in handen zoekt de app het account op via Horizon, de toegangspoort van Stellar tot het netwerk, om te bevestigen dat het bestaat en om de huidige saldi uit te lezen. Daarom zie je vlak na het importeren je echte XLM- en token-saldi verschijnen: de app leest ze rechtstreeks uit het openbare grootboek, hij verzint ze niet.",
        "Cruciaal is dat importeren geen munten verplaatst of kopieert. Het is hetzelfde account dat het altijd was, op hetzelfde adres op hetzelfde netwerk; je hebt het simpelweg bruikbaar gemaakt vanuit deze app. Er wordt niets overgedragen, en het account gedraagt zich identiek of je het nu vanaf hier of vanaf een andere Stellar-wallet bereikt.",
      ],
      example:
        "Je plakt een S...-geheime sleutel in het importscherm. De app leidt het G...-adres af, bevraagt Horizon en toont \"Saldo: 250 XLM, 40 USDC.\" Dat geld kwam niet door het importeren — het stond altijd al op dat adres. Importeren verbond deze app gewoon met het account dat je al beheerde.",
    },
    {
      id: "c18-l3",
      title: "Wat is AES-256-GCM-versleuteling en hoe beschermt deze app je geheime sleutel in rust?",
      paragraphs: [
        "AES-256-GCM is een vorm van symmetrische geauthenticeerde versleuteling. \"Symmetrisch\" betekent dat dezelfde sleutel de gegevens zowel vergrendelt als ontgrendelt; \"256\" verwijst naar de sleutelgrootte, ver buiten wat enige computer kan brute-forcen; en \"GCM\" voegt een authenticatietag toe die elke manipulatie detecteert, zodat gewijzigde versleutelde tekst wordt afgewezen in plaats van stilletjes tot onzin te worden ontsleuteld.",
        "Deze app gebruikt het om je geheime sleutel in rust te beschermen — dat wil zeggen, terwijl hij in de database staat. Je geheim wordt versleuteld met een server-side sleutel die per gebruiker wordt afgeleid, en alleen de resulterende versleutelde tekst wordt opgeslagen. De gewone geheime sleutel wordt nooit naar schijf geschreven en nooit naar je browser teruggestuurd, dus een gestolen database-dump levert alleen onleesbare versleutelde tekst op.",
        "Het gewone geheim bestaat slechts kort in het servergeheugen, op precies het moment dat een transactie ondertekend moet worden, en wordt daarna meteen weggegooid. Daarom gebeurt het ondertekenen op de server en bereikt de sleutel de front-end nooit: de browser wordt als onbetrouwbaar behandeld, en het onversleutelde geheim wordt zo kortstondig en zo afgeschermd mogelijk gehouden.",
      ],
      example:
        "Stel dat een aanvaller een kopie van de database steelt. Voor je wallet vinden ze een blok als \"9f3a...c1\" — de AES-256-GCM-versleutelde tekst — en verder niets. Zonder de server-side sleutel per gebruiker kan die niet worden ontsleuteld, en de GCM-tag betekent dat ze er niet eens nuttig mee kunnen knoeien. De geheime sleutel zelf werd nooit in leesbare vorm opgeslagen om te vinden.",
    },
    {
      id: "c18-l4",
      title: "Wat is Friendbot en hoe werkt testnet-funding?",
      paragraphs: [
        "Stellar draait een apart oefennetwerk dat testnet heet, waar de munten geen echte waarde hebben en alleen bestaan zodat ontwikkelaars en lerenden veilig kunnen experimenteren. Om dat makkelijk te maken heeft testnet een kraan genaamd Friendbot: vraag het over een nieuw adres en het maakt het account aan en vult het met gratis test-XLM.",
        "Die fundingstap is belangrijk omdat een adres op Stellar pas een echt account is wanneer het een minimumsaldo aanhoudt — de base reserve. Friendbot dekt dit voor je op testnet, waarmee een vers gegenereerde keypair met één klik in een levend, bruikbaar account verandert, met test-XLM om mee te spelen.",
        "Mainnet — het echte netwerk — heeft geen Friendbot, en dat is precies de bedoeling. Op mainnet moet je een nieuw account zelf van echte XLM voorzien om aan de base reserve te voldoen voordat het actief wordt. Testmunten kunnen nooit overgaan naar mainnet, dus oefenen op testnet kost niets en riskeert niets, terwijl een echt account altijd begint met echt geld dat jij inbrengt.",
      ],
      example:
        "Op testnet genereer je een vers G...-adres en klik je op \"Fund met Friendbot.\" Seconden later bestaat het account met 10.000 test-XLM — perfect om te oefenen. Probeer hetzelfde op mainnet en er is geen Friendbot-knop: het account blijft inactief totdat je het echte XLM stuurt vanuit een andere wallet om de base reserve te dekken.",
    },
    {
      id: "c18-l5",
      title: "Wat zijn de risico's van het vervangen van je wallet in de app?",
      paragraphs: [
        "De app houdt slechts één actieve wallet tegelijk aan, dus een nieuwe importeren vervangt de oude in plaats van beide aan te houden. Omdat dit een gevoelige actie is, vereist het je wachtwoord — een bewuste beveiliging zodat een kort moment van onoplettendheid of een aanvaller bij je ontgrendelde scherm de wallet waarmee de bot handelt niet stilletjes kan verwisselen.",
        "Het vervangen van de wallet beïnvloedt ook werk dat al loopt. Open orders en actieve stop losses zijn gekoppeld aan de wallet die ze heeft aangemaakt; wanneer je van wallet wisselt, worden die geannuleerd, omdat ze niet meer overeenkomen met het account dat nu de controle heeft. Plan de wissel voor een moment waarop posities zonder beheer achterlaten aanvaardbaar is.",
        "Het diepste risico ligt bij jou, niet bij de app. Als je een wallet vervangt en de oude geheime sleutel niet veilig hebt bewaard, verlies je je toegang tot dat account en het geld dat erin zit — de app kan een geheim dat hij nooit in leesbare vorm opslaat niet herstellen. Zorg er voordat je vervangt voor dat de oude geheime sleutel offline geback-upt is, precies zoals het vorige hoofdstuk beschreef.",
      ],
      example:
        "Je importeert wallet B om wallet A te vervangen. De app vraagt om je wachtwoord, annuleert dan de twee open stop losses van A en schakelt over. Later wil je het resterende geld van A verplaatsen — maar je hebt de geheime sleutel van A nooit opgeschreven, en de app sloeg hem alleen versleuteld op en heeft hem nu vervangen. Dat geld zit vast, niet door een bug, maar omdat de enige sleutel die het kon bereiken weg is.",
    },
  ],
  quiz: [
    {
      id: "c18-q1",
      prompt: "Hoe is een Stellar-keypair verbonden, en welke sleutel begint met welke letter?",
      options: [
        {
          text: "Het is een ed25519-paar afgeleid van een willekeurige seed; de publieke sleutel begint met G en de geheime met S, en de publieke kan uit de geheime worden afgeleid maar niet omgekeerd.",
          explanation:
            "Juist. ed25519 verbindt het paar één kant op: de publieke sleutel (G...) komt uit de geheime sleutel (S...), die uit een willekeurige seed komt — en de wiskunde kan niet achterstevoren worden gedraaid.",
        },
        {
          text: "Het zijn twee niet-verbonden willekeurige waarden, een beginnend met G en een met S.",
          explanation:
            "Nee. De sleutels zijn wiskundig verbonden, niet onafhankelijk — de publieke sleutel is afgeleid van de geheime sleutel.",
        },
        {
          text: "De geheime sleutel begint met G en de publieke met S.",
          explanation:
            "Nee. Het is andersom: G is het publieke adres, S is de geheime sleutel.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q2",
      prompt: "Wanneer je een wallet importeert door je geheime sleutel in te voeren, wat gebeurt er met je munten?",
      options: [
        {
          text: "Er wordt niets verplaatst — de app leidt je publieke sleutel af, leest het account uit op Horizon, en toont saldi die er altijd al waren.",
          explanation:
            "Juist. Importeren verbindt de app alleen met een account dat je al beheert. Het leidt het G...-adres af en leest bestaande saldi uit; er worden geen munten overgedragen.",
        },
        {
          text: "Je munten worden verplaatst naar een nieuw account dat door de app is aangemaakt.",
          explanation:
            "Nee. Importeren verplaatst of maakt geen geld aan. Het is hetzelfde account op hetzelfde adres, nu hier bruikbaar.",
        },
        {
          text: "De app kopieert je munten zodat ze op twee plekken tegelijk bestaan.",
          explanation:
            "Nee. Munten worden niet gekopieerd. Er is één account in het grootboek; importeren laat deze app het alleen uitlezen en gebruiken.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q3",
      prompt: "Hoe beschermt deze app je geheime sleutel in rust met AES-256-GCM?",
      options: [
        {
          text: "Hij slaat alleen de versleutelde tekst op, ontsleutelt het geheim alleen in het geheugen op het moment van ondertekenen, en stuurt het nooit terug naar de browser.",
          explanation:
            "Juist. Het geheim wordt versleuteld met een server-side sleutel per gebruiker; alleen versleutelde tekst wordt opgeslagen, de gewone sleutel leeft kort in het geheugen om te ondertekenen, en de browser ziet hem nooit.",
        },
        {
          text: "Hij slaat je geheime sleutel in platte tekst op maar achter een login.",
          explanation:
            "Nee. Het geheim wordt nooit in platte tekst opgeslagen. Een login alleen zou een gestolen database-dump niet beschermen — versleuteling wel.",
        },
        {
          text: "Hij stuurt de geheime sleutel naar je browser, die hem lokaal versleutelt.",
          explanation:
            "Nee. Het geheim bereikt de browser nooit. Ondertekenen gebeurt server-side juist zodat de gewone sleutel buiten de onbetrouwbare front-end blijft.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q4",
      prompt: "Wat klopt er over Friendbot en het funden van accounts?",
      options: [
        {
          text: "Friendbot is een kraan die alleen op testnet bestaat en een account aanmaakt en vult met gratis test-XLM; op mainnet moet je met echte XLM funden om aan de base reserve te voldoen.",
          explanation:
            "Juist. Friendbot bestaat alleen op testnet voor veilig oefenen. Mainnet heeft geen kraan, dus een echt account moet met echte XLM worden gefund om de base reserve te dekken.",
        },
        {
          text: "Friendbot fundt je mainnet-account gratis met echte XLM.",
          explanation:
            "Nee. Friendbot werkt alleen op testnet en zijn munten hebben geen echte waarde. Niets fundt een mainnet-account gratis.",
        },
        {
          text: "Test-XLM van Friendbot kan naar mainnet worden verplaatst en uitgegeven.",
          explanation:
            "Nee. Testnet en mainnet zijn aparte netwerken; test-XLM kan niet overgaan en heeft geen echte waarde.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
